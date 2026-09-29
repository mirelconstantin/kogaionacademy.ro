/**
 * Import blog articles from the blogs/articles folder tree into `blog_post`.
 *
 * The .md files have no YAML frontmatter:
 *   - title        <- the line-1 `# H1`
 *   - body         <- everything after the H1, converted Markdown -> HTML (`marked`,
 *                     same shape the Edra/Tiptap editor consumes), sanitised with DOMPurify
 *   - publishedAt  <- parsed from the parent folder name, `DD-MM-YYYY`
 *   - excerpt      <- first non-heading paragraph, truncated
 *   - featuredImage<- the first `![alt](url)`, downloaded to static/media/uploads/blog
 *
 * Markdown images point at the old WordPress host, so every image is downloaded, converted
 * to webp and rewritten to a local `/media/uploads/blog/...` URL. A download that fails
 * leaves the absolute remote URL in place rather than silently dropping the image.
 *
 * Idempotent: matches on slug (filename with `_` -> `-`), so re-running updates in place.
 * Usage: bun run scripts/import-blog-articles.ts [--all] [relative/path/to/file.md ...]
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { mkdir } from 'fs/promises';
import { basename, join, extname } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import sharp from 'sharp';
import { blogPost } from '../src/lib/server/db/schema';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const ARTICLES_DIR = join(process.cwd(), 'blogs', 'articles');
const BLOG_UPLOAD_DIR = join(process.cwd(), 'static', 'media', 'uploads', 'blog');
const BLOG_URL_BASE = '/media/uploads/blog';

const args = process.argv.slice(2);
const IMPORT_ALL = args.includes('--all');
const EXPLICIT = args.filter((a) => !a.startsWith('--'));

/** The three most recent articles, by `DD-MM-YYYY` folder name. */
const DEFAULT_ARTICLES = [
	join('08-06-2026', 'Family Bootcamp', 'cum_dezvolti_curajul_copilului_tau.md'),
	join('08-06-2026', 'Engineer Bootcamp', 'copilaria_offline_de_ce_este_vitala.md'),
	join('04-06-2026', 'Robotics Bootcamp', 'ce_este_robotica_arduino.md')
];

type Found = { abs: string; rel: string; publishedAt: Date | null };

/** `DD-MM-YYYY` folder name -> Date at 09:00 local, so the post sorts after same-day items. */
function parseFolderDate(folderName: string): Date | null {
	const m = folderName.match(/^(\d{2})-(\d{2})-(\d{4})$/);
	if (!m) return null;
	const [, dd, mm, yyyy] = m;
	const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 9, 0, 0);
	return Number.isNaN(d.getTime()) ? null : d;
}

function slugify(relPath: string): string {
	return basename(relPath, extname(relPath)).replace(/_/g, '-').toLowerCase();
}

function walk(dir: string): string[] {
	if (!existsSync(dir)) return [];
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(p));
		else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md') && entry.name !== '.md')
			out.push(p);
	}
	return out;
}

function selectArticles(): Found[] {
	let files: string[];
	if (EXPLICIT.length > 0) {
		files = EXPLICIT.map((rel) => join(ARTICLES_DIR, rel));
	} else if (IMPORT_ALL) {
		files = walk(ARTICLES_DIR);
	} else {
		files = DEFAULT_ARTICLES.map((rel) => join(ARTICLES_DIR, rel));
	}

	return files.map((abs) => {
		const rel = abs.replace(`${ARTICLES_DIR}\\`, '').replace(`${ARTICLES_DIR}/`, '');
		const folder = rel.split(/[\\/]/).slice(0, -2).join('/');
		return { abs, rel, publishedAt: parseFolderDate(folder) };
	});
}

/** Download every remote image referenced by the markdown, rewrite to a local URL. */
async function localizeImages(
	markdown: string,
	slug: string
): Promise<{ md: string; first: string | null }> {
	const seen = new Map<string, string>();
	let first: string | null = null;
	const matches = [...markdown.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)];

	for (const m of matches) {
		const alt = m[1];
		const url = m[2];
		if (!seen.has(url)) {
			const ext = (extname(new URL(url).pathname) || '.jpg').toLowerCase();
			const name = `${slug}--${seen.size + 1}${ext === '.jpeg' ? '.jpg' : ext}`;
			const localUrl = `${BLOG_URL_BASE}/${name}`;
			try {
				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const buf = Buffer.from(await res.arrayBuffer());
				await mkdir(BLOG_UPLOAD_DIR, { recursive: true });
				await sharp(buf)
					.rotate()
					.webp({ quality: 85 })
					.toFile(join(BLOG_UPLOAD_DIR, name.replace(/\.\w+$/, '.webp')));
				seen.set(url, localUrl.replace(/\.\w+$/, '.webp'));
				console.log(`    image -> ${seen.get(url)}`);
			} catch (e) {
				console.warn(`    image FAILED (${(e as Error).message}), keeping remote URL: ${url}`);
				seen.set(url, url);
			}
		}
		const local = seen.get(url)!;
		if (!first) first = local;
		void alt;
	}

	let out = markdown;
	for (const [remote, local] of seen) {
		out = out.split(`(${remote})`).join(`(${local})`);
	}
	return { md: out, first };
}

/** First real paragraph, trimmed and truncated, used as excerpt + meta description. */
function buildExcerpt(markdown: string): string {
	const paras = markdown
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter((p) => p && !p.startsWith('#') && !p.startsWith('![') && !p.startsWith('---'));
	const first = paras[0] ?? '';
	const plain = first
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[*_`]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	return plain.length > 280 ? `${plain.slice(0, 277)}…` : plain;
}

async function main() {
	const articles = selectArticles();
	if (articles.length === 0) {
		console.error('No articles selected.');
		process.exit(1);
	}

	const client = postgres(databaseUrl);
	const db = drizzle(client);
	const now = new Date();

	for (const a of articles) {
		if (!existsSync(a.abs)) {
			console.warn(`SKIP (missing file): ${a.rel}`);
			continue;
		}

		const raw = readFileSync(a.abs, 'utf-8');
		const h1 = raw.match(/^#\s+(.+)$/m);
		const title = (h1?.[1] ?? slugify(a.rel)).trim();
		const bodyMd = h1 ? raw.slice((h1.index ?? 0) + h1[0].length).trim() : raw.trim();
		const slug = slugify(a.rel);

		console.log(`\n${a.rel}\n  slug: ${slug}\n  title: ${title}`);

		const { md, first } = await localizeImages(bodyMd, slug);
		const html = DOMPurify.sanitize(await marked.parse(md));
		const excerpt = buildExcerpt(bodyMd);
		const publishedAt = a.publishedAt ?? now;

		const values = {
			slug,
			title,
			excerpt,
			body: html,
			locale: 'ro',
			status: 'published',
			featuredImage: first,
			publishedAt,
			scheduledFor: null,
			updatedAt: now,
			updatedBy: 'import-blog-articles',
			deletedAt: null,
			deletedBy: null
		};

		const [existing] = await db
			.select({ id: blogPost.id })
			.from(blogPost)
			.where(eq(blogPost.slug, slug))
			.limit(1);
		if (existing) {
			await db.update(blogPost).set(values).where(eq(blogPost.id, existing.id));
			console.log(`  updated id=${existing.id}`);
		} else {
			const [row] = await db.insert(blogPost).values(values).returning({ id: blogPost.id });
			console.log(`  inserted id=${row!.id}`);
		}
	}

	await client.end();
	console.log(`\nDone. ${articles.length} article(s) processed.`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
