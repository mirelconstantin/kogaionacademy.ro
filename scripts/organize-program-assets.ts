/**
 * Organizes all program images into per-program folders, converts to .webp and
 * updates DB references so program pages keep working.
 *
 * Run: bun run scripts/organize-program-assets.ts
 */
import { existsSync } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, like } from 'drizzle-orm';
import { mediaAsset, program, programSection } from '../src/lib/server/db/schema';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const STATIC_DIR = join(process.cwd(), 'static');
const PROGRAMS_BASE = '/media/uploads/programe';

type ProgramRow = typeof program.$inferSelect;
type ProgramSectionRow = typeof programSection.$inferSelect;

type ProgramUrlRole =
	| { kind: 'cover' }
	| { kind: 'gallery'; index: number }
	| { kind: 'section'; section: string; order: number };

function folderForProgram(slug: string): string {
	// Keep existing folder naming for afterschool to avoid unnecessary churn.
	if (slug === 'afterschool-kogaion-self-mastery') return 'afterschool-self-mastery';
	return slug;
}

function sanitizeToken(v: string): string {
	return v
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
}

function urlToAbsPath(url: string): string {
	return join(STATIC_DIR, url.replace(/^\//, ''));
}

function isProgramAssetUrl(v: string): boolean {
	return /^\/media\/uploads\/programe\/.+\.(webp|jpg|jpeg|png|avif|gif)$/i.test(v);
}

function collectUrlsFromValue(v: unknown, out: string[]) {
	if (typeof v === 'string') {
		if (isProgramAssetUrl(v)) out.push(v);
		return;
	}
	if (Array.isArray(v)) {
		for (const item of v) collectUrlsFromValue(item, out);
		return;
	}
	if (v && typeof v === 'object') {
		for (const val of Object.values(v as Record<string, unknown>)) collectUrlsFromValue(val, out);
	}
}

function rewritePayloadUrls(value: unknown, urlMap: Map<string, string>): unknown {
	if (typeof value === 'string') return urlMap.get(value) ?? value;
	if (Array.isArray(value)) return value.map((item) => rewritePayloadUrls(item, urlMap));
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			out[k] = rewritePayloadUrls(v, urlMap);
		}
		return out;
	}
	return value;
}

function filenameForRole(folder: string, role: ProgramUrlRole): string {
	if (role.kind === 'cover') return `${folder}-cover.webp`;
	if (role.kind === 'gallery') return `${folder}-gallery-${String(role.index).padStart(2, '0')}.webp`;
	return `${folder}-${sanitizeToken(role.section)}-${String(role.order).padStart(2, '0')}.webp`;
}

async function ensureWebpAtTarget(oldUrl: string, newUrl: string) {
	const oldAbs = urlToAbsPath(oldUrl);
	const newAbs = urlToAbsPath(newUrl);
	await mkdir(dirname(newAbs), { recursive: true });

	if (oldUrl === newUrl) return;
	if (existsSync(newAbs)) {
		if (existsSync(oldAbs)) {
			try {
				await unlink(oldAbs);
			} catch (e) {
				console.warn('Could not remove source file (kept as duplicate):', oldUrl, e);
			}
		}
		return;
	}
	if (!existsSync(oldAbs)) {
		console.warn('Missing source file:', oldUrl);
		return;
	}

	await sharp(oldAbs).webp({ quality: 86 }).toFile(newAbs);
	try {
		await unlink(oldAbs);
	} catch (e) {
		console.warn('Could not remove source file (kept as duplicate):', oldUrl, e);
	}
}

async function main() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);
	try {
		const programs = await db.select().from(program);
		const allSections = await db.select().from(programSection);

		const sectionByProgram = new Map<number, ProgramSectionRow[]>();
		for (const row of allSections) {
			const arr = sectionByProgram.get(row.programId) ?? [];
			arr.push(row);
			sectionByProgram.set(row.programId, arr);
		}

		const urlMap = new Map<string, string>();
		let convertedOrMoved = 0;

		for (const p of programs) {
			const folder = folderForProgram(p.slug);
			const roles = new Map<string, ProgramUrlRole>();

			if (p.image && isProgramAssetUrl(p.image)) {
				roles.set(p.image, { kind: 'cover' });
			}

			const rows = sectionByProgram.get(p.id) ?? [];
			const sectionCounters = new Map<string, number>();
			for (const row of rows) {
				const payload = row.payload as Record<string, unknown>;

				if (row.section === 'gallery') {
					const images = Array.isArray((payload as { images?: unknown[] }).images)
						? ((payload as { images?: Array<{ url?: unknown }> }).images ?? [])
						: [];
					let galleryIndex = 1;
					for (const img of images) {
						if (!img || typeof img !== 'object') continue;
						const url = typeof img.url === 'string' ? img.url : null;
						if (!url || !isProgramAssetUrl(url) || roles.has(url)) continue;
						roles.set(url, { kind: 'gallery', index: galleryIndex++ });
					}
				}

				const urls: string[] = [];
				collectUrlsFromValue(payload, urls);
				for (const url of urls) {
					if (roles.has(url)) continue;
					const nextOrder = (sectionCounters.get(row.section) ?? 0) + 1;
					sectionCounters.set(row.section, nextOrder);
					roles.set(url, { kind: 'section', section: row.section, order: nextOrder });
				}
			}

			for (const [oldUrl, role] of roles.entries()) {
				const newFilename = filenameForRole(folder, role);
				const newUrl = `${PROGRAMS_BASE}/${folder}/${newFilename}`;
				if (!urlMap.has(oldUrl)) {
					urlMap.set(oldUrl, newUrl);
					await ensureWebpAtTarget(oldUrl, newUrl);
					convertedOrMoved++;
				}
			}
		}

		let programUpdated = 0;
		for (const p of programs) {
			if (!p.image) continue;
			const newImage = urlMap.get(p.image);
			if (!newImage || newImage === p.image) continue;
			await db.update(program).set({ image: newImage }).where(eq(program.id, p.id));
			programUpdated++;
		}

		let sectionUpdated = 0;
		for (const row of allSections) {
			const before = row.payload as Record<string, unknown>;
			const after = rewritePayloadUrls(before, urlMap) as Record<string, unknown>;
			if (JSON.stringify(before) === JSON.stringify(after)) continue;
			await db.update(programSection).set({ payload: after }).where(eq(programSection.id, row.id));
			sectionUpdated++;
		}

		const mediaRows = await db
			.select()
			.from(mediaAsset)
			.where(like(mediaAsset.url, '/media/uploads/programe/%'));
		let mediaUpdated = 0;
		for (const row of mediaRows) {
			const nextUrl = urlMap.get(row.url);
			if (!nextUrl || nextUrl === row.url) continue;
			await db.update(mediaAsset).set({ url: nextUrl }).where(eq(mediaAsset.id, row.id));
			mediaUpdated++;
		}

		console.log('Assets processed:', convertedOrMoved);
		console.log('Program image rows updated:', programUpdated);
		console.log('Program section rows updated:', sectionUpdated);
		console.log('Media asset rows updated:', mediaUpdated);
		console.log('URL mappings generated:', urlMap.size);
	} finally {
		await client.end();
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

