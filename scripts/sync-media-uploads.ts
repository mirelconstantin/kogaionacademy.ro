/**
 * Seed media_asset rows by scanning static/media/uploads.
 *
 * The admin media library lists files from disk; media_asset stores the
 * editable metadata (title/alt/caption/description/tags) per URL.
 * Idempotent: onConflictDoUpdate on url, existing human-edited fields are preserved
 * unless --overwrite is passed.
 *
 * Usage: DATABASE_URL=... bun run scripts/sync-media-uploads.ts [--overwrite]
 */
import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { mediaAsset } from '../src/lib/server/db/schema';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const UPLOAD_DIR = path.join(process.cwd(), 'static', 'media', 'uploads');
const URL_PREFIX = '/media/uploads';
const OVERWRITE = process.argv.includes('--overwrite');

const MEDIA_EXTENSIONS = new Set([
	'.jpg',
	'.jpeg',
	'.png',
	'.gif',
	'.webp',
	'.svg',
	'.mp4',
	'.webm'
]);

type Scanned = { url: string; file: string; folder: string };

async function scan(dir: string, base: string): Promise<Scanned[]> {
	const out: Scanned[] = [];
	let items: string[];
	try {
		items = await readdir(dir);
	} catch {
		return out;
	}
	for (const name of items) {
		if (name.startsWith('.')) continue;
		const fp = path.join(dir, name);
		const st = await stat(fp);
		if (st.isDirectory()) {
			out.push(...(await scan(fp, base)));
		} else if (st.isFile() && MEDIA_EXTENSIONS.has(path.extname(name).toLowerCase())) {
			const rel = path.relative(base, fp).replace(/\\/g, '/');
			const folder = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
			out.push({ url: `${URL_PREFIX}/${rel}`, file: name, folder });
		}
	}
	return out;
}

/** "kogaion-science-bootcamp-gallery-03.webp" -> "Kogaion Science Bootcamp Gallery 03" */
function titleFromFilename(file: string): string {
	const base = file.replace(/\.[^.]+$/, '');
	return base
		.replace(/[-_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

const FOLDER_TAGS: Record<string, string[]> = {
	about: ['about', 'echipa'],
	badges: ['badges'],
	blog: ['blog'],
	brand: ['brand'],
	home: ['home', 'hero'],
	mentori: ['mentori', 'echipa'],
	programe: ['programe']
};

function tagsFor(folder: string, file: string): string[] {
	const tags = new Set<string>();
	for (const [prefix, values] of Object.entries(FOLDER_TAGS)) {
		if (folder === prefix || folder.startsWith(`${prefix}/`)) {
			values.forEach((v) => tags.add(v));
		}
	}
	const programMatch = folder.match(/^programe\/([^/]+)/);
	if (programMatch?.[1]) tags.add(programMatch[1]);
	if (/-gallery-\d+$/i.test(file)) tags.add('galerie');
	if (/-cover$/i.test(file)) tags.add('cover');
	return [...tags];
}

async function main() {
	if (!existsSync(UPLOAD_DIR)) {
		console.error(`Uploads directory not found: ${UPLOAD_DIR}`);
		process.exit(1);
	}

	const files = await scan(UPLOAD_DIR, UPLOAD_DIR);
	console.log(`Scanned ${files.length} media files under ${URL_PREFIX}`);

	const client = postgres(databaseUrl);
	const db = drizzle(client);

	let inserted = 0;
	let updated = 0;

	for (const f of files) {
		const values = {
			url: f.url,
			title: titleFromFilename(f.file),
			alt: titleFromFilename(f.file),
			caption: null as string | null,
			description: null as string | null,
			type: /\.(webm|mp4)$/i.test(f.url) ? 'video' : 'image',
			tags: tagsFor(f.folder, f.file)
		};

		const [existing] = await db
			.select({ id: mediaAsset.id })
			.from(mediaAsset)
			.where(eq(mediaAsset.url, f.url))
			.limit(1);

		if (existing) {
			if (!OVERWRITE) continue;
			await db
				.update(mediaAsset)
				.set({ title: values.title, alt: values.alt, type: values.type, tags: values.tags })
				.where(eq(mediaAsset.url, f.url));
			updated++;
		} else {
			await db.insert(mediaAsset).values(values);
			inserted++;
		}
	}

	console.log(`media_asset: ${inserted} inserted, ${updated} updated.`);
	await client.end();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
