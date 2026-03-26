/**
 * Renames and converts afterschool-self-mastery images to semantic .webp names,
 * then rewrites DB references so program pages keep working.
 *
 * Run: bun run scripts/rename-afterschool-self-mastery-assets.ts
 */
import { existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, eq, like } from 'drizzle-orm';
import { mediaAsset, program, programSection } from '../src/lib/server/db/schema';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const PROGRAM_SLUG = 'afterschool-kogaion-self-mastery';
const BASE_URL = '/media/uploads/programe/afterschool-self-mastery';
const UPLOAD_DIR = join(
	process.cwd(),
	'static',
	'media',
	'uploads',
	'programe',
	'afterschool-self-mastery'
);

const FILE_MAP = [
	['IMG_6633-scaled.jpg', 'afterschool-gallery-01.webp'],
	['RDCL5631-scaled.jpg', 'afterschool-gallery-02.webp'],
	['RDCL5656-scaled.jpg', 'afterschool-gallery-03.webp'],
	['RDCL5690-scaled.jpg', 'afterschool-gallery-04.webp'],
	['RDCL5757-scaled.jpg', 'afterschool-gallery-05.webp'],
	['RDCL5775-scaled.jpg', 'afterschool-gallery-06.webp'],
	['RDCL5803-scaled.jpg', 'afterschool-gallery-07.webp'],
	['RDCL5825-scaled.jpg', 'afterschool-gallery-08.webp'],
	['RDCL5871-scaled.jpg', 'afterschool-gallery-09.webp'],
	['RDCL5928-scaled.jpg', 'afterschool-gallery-10.webp'],
	['RDCL5971-scaled.jpg', 'afterschool-gallery-11.webp'],
	['RDCL5983-scaled.jpg', 'afterschool-gallery-12.webp'],
	['RDCL6001-scaled.jpg', 'afterschool-gallery-13.webp'],
	['IMG_6483-1-scaled.jpg', 'afterschool-gallery-14.webp'],
	['DCL1866-scaled.jpg', 'afterschool-gallery-15.webp'],
	['DCL1892-scaled.jpg', 'afterschool-gallery-16.webp'],
	['DCL1928-scaled.jpg', 'afterschool-gallery-17.webp'],
	['DCL2018-scaled.jpg', 'afterschool-gallery-18.webp'],
	['DCL2069-scaled.jpg', 'afterschool-benefits-main.webp'],
	['Program-after-school_Kogaion-Gifted-Academy.jpg', 'afterschool-location.webp']
] as const;

const URL_MAP = new Map(
	FILE_MAP.map(([from, to]) => [`${BASE_URL}/${from}`, `${BASE_URL}/${to}`])
);

function rewritePayload(value: unknown): unknown {
	if (typeof value === 'string') return URL_MAP.get(value) ?? value;
	if (Array.isArray(value)) return value.map((item) => rewritePayload(item));
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			out[k] = rewritePayload(v);
		}
		return out;
	}
	return value;
}

async function convertAndRenameFiles() {
	let converted = 0;
	for (const [oldName, newName] of FILE_MAP) {
		const oldPath = join(UPLOAD_DIR, oldName);
		const newPath = join(UPLOAD_DIR, newName);
		const oldExists = existsSync(oldPath);
		const newExists = existsSync(newPath);

		if (!oldExists && newExists) continue;
		if (!oldExists && !newExists) {
			console.warn('Missing source and target, skipping:', oldName);
			continue;
		}

		await sharp(oldPath).webp({ quality: 86 }).toFile(newPath);
		await unlink(oldPath);
		converted++;
		console.log(`Converted: ${oldName} -> ${newName}`);
	}

	console.log('Converted files:', converted);
}

async function updateProgramSectionUrls() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);
	try {
		const [p] = await db.select().from(program).where(eq(program.slug, PROGRAM_SLUG)).limit(1);
		if (!p) throw new Error(`Program not found: ${PROGRAM_SLUG}`);

		const rows = await db
			.select()
			.from(programSection)
			.where(and(eq(programSection.programId, p.id), like(programSection.locale, '%')));

		let updated = 0;
		for (const row of rows) {
			const payloadBefore = row.payload as Record<string, unknown>;
			const payloadAfter = rewritePayload(payloadBefore) as Record<string, unknown>;
			if (JSON.stringify(payloadBefore) === JSON.stringify(payloadAfter)) continue;

			await db
				.update(programSection)
				.set({ payload: payloadAfter })
				.where(eq(programSection.id, row.id));
			updated++;
		}
		console.log('Updated program_section rows:', updated);

		const mediaRows = await db
			.select()
			.from(mediaAsset)
			.where(like(mediaAsset.url, `${BASE_URL}/%`));

		let mediaUpdated = 0;
		for (const row of mediaRows) {
			const nextUrl = URL_MAP.get(row.url);
			if (!nextUrl || nextUrl === row.url) continue;
			await db.update(mediaAsset).set({ url: nextUrl }).where(eq(mediaAsset.id, row.id));
			mediaUpdated++;
		}
		console.log('Updated media_asset rows:', mediaUpdated);
	} finally {
		await client.end();
	}
}

async function main() {
	await convertAndRenameFiles();
	await updateProgramSectionUrls();
	console.log('Done.');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

