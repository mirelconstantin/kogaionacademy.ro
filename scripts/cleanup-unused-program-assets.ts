/**
 * Deletes unused files under static/media/uploads/programe based on current DB
 * references plus known UI fallbacks.
 *
 * Run: bun run scripts/cleanup-unused-program-assets.ts
 */
import { readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { program, programSection } from '../src/lib/server/db/schema';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const STATIC_DIR = join(process.cwd(), 'static');
const PROGRAMS_DIR = join(STATIC_DIR, 'media', 'uploads', 'programe');

const UI_FALLBACK_URLS = [
	'/media/uploads/programe/afterschool-self-mastery/afterschool-self-mastery-location.webp',
	'/media/uploads/programe/afterschool-self-mastery/afterschool-self-mastery-benefits-main.webp',
	'/media/uploads/programe/afterschool-self-mastery/afterschool-self-mastery-gallery-08.webp'
];

function isProgramAssetUrl(v: string): boolean {
	return /^\/media\/uploads\/programe\/.+\.(webp|jpg|jpeg|png|avif|gif)$/i.test(v);
}

function collectUrls(value: unknown, out: Set<string>) {
	if (typeof value === 'string') {
		if (isProgramAssetUrl(value)) out.add(value);
		return;
	}
	if (Array.isArray(value)) {
		for (const item of value) collectUrls(item, out);
		return;
	}
	if (value && typeof value === 'object') {
		for (const v of Object.values(value as Record<string, unknown>)) collectUrls(v, out);
	}
}

async function walkFiles(dir: string, out: string[]) {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const abs = join(dir, entry.name);
		if (entry.isDirectory()) {
			await walkFiles(abs, out);
		} else if (entry.isFile()) {
			out.push(abs);
		}
	}
}

async function main() {
	if (!existsSync(PROGRAMS_DIR)) {
		console.log('No program uploads directory found.');
		return;
	}

	const client = postgres(databaseUrl);
	const db = drizzle(client);
	try {
		const keep = new Set<string>(UI_FALLBACK_URLS);
		const programs = await db.select().from(program);
		for (const p of programs) {
			if (p.image && isProgramAssetUrl(p.image)) keep.add(p.image);
		}
		const sections = await db.select().from(programSection);
		for (const row of sections) collectUrls(row.payload, keep);

		const files: string[] = [];
		await walkFiles(PROGRAMS_DIR, files);

		let deleted = 0;
		let skippedBusy = 0;
		for (const absPath of files) {
			const relToStatic = relative(STATIC_DIR, absPath).replace(/\\/g, '/');
			const url = `/${relToStatic}`;
			if (keep.has(url)) continue;
			try {
				await unlink(absPath);
				deleted++;
			} catch {
				// Keep going, we only report best-effort cleanup.
				skippedBusy++;
			}
		}

		console.log('Files kept:', keep.size);
		console.log('Files deleted:', deleted);
		console.log('Files skipped:', skippedBusy);
	} finally {
		await client.end();
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

