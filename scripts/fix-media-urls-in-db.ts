/**
 * Actualizează toate URL-urile vechi din baza de date la noile path-uri din media/uploads.
 * Rulează: bun run scripts/fix-media-urls-in-db.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
	heroSettings,
	mentor,
	program,
	siteSection,
	blogPost
} from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'node:fs';
import * as path from 'node:path';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

// Încarcă mapping din media-url-mapping.json
const mappingPath = path.join(process.cwd(), 'scripts', 'media-url-mapping.json');
let URL_MAP: Record<string, string> = {};
try {
	URL_MAP = JSON.parse(fs.readFileSync(mappingPath, 'utf-8')) as Record<string, string>;
} catch {
	console.warn('Nu s-a găsit media-url-mapping.json, folosesc mapping hardcodat.');
	URL_MAP = {
		'/media/home/hero-learning.mp4': '/media/uploads/home/hero.mp4',
		'/media/home/hero-no-people.mp4': '/media/uploads/home/hero.mp4',
		'/kogaion-source/images/008-RDCL5971-scaled.jpg': '/media/uploads/home/hero-poster.webp',
		'/kogaion-source/images/003-DSC05800.jpg': '/media/uploads/about/age-3-6.webp',
		'/kogaion-source/images/004-DSC07149.jpg': '/media/uploads/about/age-7-12.webp',
		'/kogaion-source/images/009-DSC07735.jpg': '/media/uploads/about/age-13-18.webp',
		'/kogaion-source/images/007-Poza-Diana-2.jpg': '/media/uploads/about/founder-diana.webp',
		'/kogaion-source/images/002-Florian-Colceag.jpg': '/media/uploads/about/founder-florian.webp',
		'/media/mentori/diana-antoci.webp': '/media/uploads/mentori/diana-antoci.webp',
		'/media/mentori/florian-colceag.webp': '/media/uploads/mentori/florian-colceag.webp',
		'/media/mentori/florin-munteanu.webp': '/media/uploads/mentori/florin-munteanu.webp',
		'/media/mentori/alina-monica-antoci.webp': '/media/uploads/mentori/alina-monica-antoci.webp'
	};
}

function replaceUrl(url: string | null): string | null {
	if (!url || typeof url !== 'string') return url;
	for (const [oldU, newU] of Object.entries(URL_MAP)) {
		if (url === oldU || url.startsWith(oldU)) {
			return url.replace(oldU, newU);
		}
	}
	// Fallback generic: /media/mentori/ -> /media/uploads/mentori/
	if (url.startsWith('/media/mentori/') && !url.startsWith('/media/uploads/mentori/')) {
		return url.replace('/media/mentori/', '/media/uploads/mentori/');
	}
	if (url.startsWith('/media/programe/') && !url.startsWith('/media/uploads/programe/')) {
		return url.replace('/media/programe/', '/media/uploads/programe/');
	}
	return url;
}

function replaceInJson(obj: unknown): unknown {
	if (obj == null) return obj;
	if (typeof obj === 'string') {
		const r = replaceUrl(obj);
		return r ?? obj;
	}
	if (Array.isArray(obj)) {
		return obj.map(replaceInJson);
	}
	if (typeof obj === 'object') {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(obj)) {
			out[k] = replaceInJson(v);
		}
		return out;
	}
	return obj;
}

async function main() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	let total = 0;

	// 1. hero_settings
	const heroes = await db.select().from(heroSettings);
	for (const row of heroes) {
		const nv = replaceUrl(row.videoUrl);
		const np = replaceUrl(row.posterUrl);
		if (nv !== row.videoUrl || np !== row.posterUrl) {
			await db.update(heroSettings).set({ videoUrl: nv!, posterUrl: np }).where(eq(heroSettings.id, row.id));
			total++;
			console.log(`  hero_settings locale=${row.locale}`);
		}
	}

	// 2. mentor
	const mentors = await db.select().from(mentor);
	for (const row of mentors) {
		const ni = replaceUrl(row.image);
		if (ni !== row.image) {
			await db.update(mentor).set({ image: ni }).where(eq(mentor.id, row.id));
			total++;
			console.log(`  mentor ${row.slug}`);
		}
	}

	// 3. program
	const programs = await db.select().from(program);
	for (const row of programs) {
		const ni = replaceUrl(row.image);
		if (ni !== row.image) {
			await db.update(program).set({ image: ni }).where(eq(program.id, row.id));
			total++;
			console.log(`  program ${row.slug}`);
		}
	}

	// 4. site_section (payload JSON)
	const sections = await db.select().from(siteSection);
	for (const row of sections) {
		const payload = row.payload as Record<string, unknown>;
		const newPayload = replaceInJson(payload) as Record<string, unknown>;
		if (JSON.stringify(payload) !== JSON.stringify(newPayload)) {
			await db.update(siteSection).set({ payload: newPayload }).where(eq(siteSection.id, row.id));
			total++;
			console.log(`  site_section ${row.page}:${row.section}:${row.locale}`);
		}
	}

	// 5. blog_post featured_image
	const posts = await db.select().from(blogPost);
	for (const row of posts) {
		const ni = replaceUrl(row.featuredImage);
		if (ni !== row.featuredImage) {
			await db.update(blogPost).set({ featuredImage: ni }).where(eq(blogPost.id, row.id));
			total++;
			console.log(`  blog_post ${row.slug}`);
		}
	}

	console.log(`\nGata. ${total} înregistrări actualizate în total.`);
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
