/**
 * Apply the generated mentor profile content to the database.
 *
 * Reads the three batch files (scripts/mentor-profile-batch{1,2,3}.ts), which contain the
 * six structured fields per mentor derived from their existing bio, and upserts them into
 * the `mentor` columns added by migration 0013_mentor_profile.
 *
 * Idempotent: matches on slug, so re-running refreshes the content.
 * Missing batches are skipped, so the three content agents can land independently.
 *
 * Usage: bun run scripts/seed-mentor-profiles.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { mentor } from '../src/lib/server/db/schema';
import { mentorProfileBatch1 } from './mentor-profile-batch1';
import { mentorProfileBatch2 } from './mentor-profile-batch2';
import { mentorProfileBatch3 } from './mentor-profile-batch3';
import { mentorProfileBatch4 } from './mentor-profile-batch4';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

type Entry = {
	slug: string;
	role: string;
	short: string;
	about: string;
	kogaion: string;
	quote: string;
	expertise: string[];
};

function loadBatches(): { batch: number; entries: Entry[] }[] {
	const out: { batch: number; entries: Entry[] }[] = [];
	const candidates: { batch: number; entries: Entry[] }[] = [
		{ batch: 1, entries: mentorProfileBatch1 },
		{ batch: 2, entries: mentorProfileBatch2 },
		{ batch: 3, entries: mentorProfileBatch3 },
		{ batch: 4, entries: mentorProfileBatch4 }
	];
	for (const c of candidates) {
		if (Array.isArray(c.entries) && c.entries.length > 0) out.push(c);
	}
	return out;
}

function words(s: string): number {
	return s.trim() ? s.trim().split(/\s+/).length : 0;
}

const RANGES: Record<string, [number, number]> = {
	short: [25, 40],
	about: [80, 120],
	kogaion: [60, 100],
	quote: [25, 60]
};

async function main() {
	const batches = loadBatches();
	if (batches.length === 0) {
		console.error('No mentor profile batches found. Nothing to do.');
		process.exit(1);
	}

	const client = postgres(databaseUrl);
	const db = drizzle(client);
	const all = batches.flatMap((b) => b.entries);
	console.log(`Loaded ${all.length} mentor entries from ${batches.length} batch(es).`);

	// Guard against the same slug appearing in two batches.
	const seen = new Map<string, number>();
	const dupes: string[] = [];
	for (const e of all) {
		if (seen.has(e.slug)) dupes.push(e.slug);
		else seen.set(e.slug, 1);
	}
	if (dupes.length > 0) {
		console.error(`Duplicate slugs across batches: ${dupes.join(', ')}`);
		await client.end();
		process.exit(1);
	}

	let applied = 0;
	const missingFromDb: string[] = [];
	const outOfRange: string[] = [];

	for (const e of all) {
		const [row] = await db
			.select({ id: mentor.id })
			.from(mentor)
			.where(eq(mentor.slug, e.slug))
			.limit(1);
		if (!row) {
			missingFromDb.push(e.slug);
			continue;
		}

		// Report, do not silently accept, out-of-spec word counts.
		for (const [field, [min, max]] of Object.entries(RANGES)) {
			const value = (e as unknown as Record<string, string>)[field] ?? '';
			const w = words(value);
			if (value && (w < min || w > max)) {
				outOfRange.push(`${e.slug}.${field} = ${w} (target ${min}-${max})`);
			}
		}

		await db
			.update(mentor)
			.set({
				roleRo: e.role || null,
				shortBioRo: e.short || null,
				aboutRo: e.about || null,
				kogaionRo: e.kogaion || null,
				voiceQuoteRo: e.quote || null,
				expertiseRo: e.expertise ?? [],
				updatedAt: new Date(),
				updatedBy: 'seed-mentor-profiles'
			})
			.where(eq(mentor.slug, e.slug));
		applied++;
	}

	console.log(`Applied to ${applied} mentors.`);

	if (missingFromDb.length > 0) {
		console.log(`\nSLUG NOT IN DB (${missingFromDb.length}) — need review:`);
		for (const s of missingFromDb) console.log(`   ${s}`);
	}
	if (outOfRange.length > 0) {
		console.log(
			`\nWORD COUNTS OUTSIDE THE SPEC (${outOfRange.length}) — applied as written, review:`
		);
		for (const s of outOfRange) console.log(`   ${s}`);
	}

	// Coverage read-back: which published mentors still have no structured content.
	const uncovered = await db
		.select({
			slug: mentor.slug,
			name: mentor.nameRo,
			short: mentor.shortBioRo,
			about: mentor.aboutRo
		})
		.from(mentor)
		.where(eq(mentor.status, 'published'));
	const noContent = uncovered.filter((r) => !r.short && !r.about);
	console.log(`\npublished mentors in DB: ${uncovered.length}`);
	console.log(`without any structured content: ${noContent.length}`);
	for (const r of noContent) console.log(`   ${r.slug} (${r.name})`);

	await client.end();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
