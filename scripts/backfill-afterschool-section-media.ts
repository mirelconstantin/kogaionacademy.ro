/**
 * Backfill afterschool program_section payloads with media URLs that were previously hardcoded.
 * After refactor, intro.imageBetweenBlocks, benefits_main.image, and location.image are read from payload.
 *
 * Run: bun run scripts/backfill-afterschool-section-media.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { program, programSection } from '../src/lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const PROGRAM_SLUG = 'afterschool-kogaion-self-mastery';
const MEDIA = {
	introBetweenBlocks: '/media/uploads/programe/afterschool-self-mastery/afterschool-self-mastery-gallery-08.webp',
	benefitsMain: '/media/uploads/programe/afterschool-self-mastery/afterschool-self-mastery-benefits-main.webp',
	location: '/media/uploads/programe/afterschool-self-mastery/afterschool-self-mastery-location.webp'
};

async function main() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	const [p] = await db.select().from(program).where(eq(program.slug, PROGRAM_SLUG)).limit(1);
	if (!p) {
		console.error('Program not found:', PROGRAM_SLUG);
		process.exit(1);
	}
	const programId = p.id;

	const sections = await db
		.select()
		.from(programSection)
		.where(and(eq(programSection.programId, programId), eq(programSection.locale, 'ro')));

	for (const row of sections) {
		const payload = (row.payload ?? {}) as Record<string, unknown>;
		let next: Record<string, unknown> | null = null;
		if (row.section === 'intro') {
			next = { ...payload, imageBetweenBlocks: MEDIA.introBetweenBlocks };
		} else if (row.section === 'benefits_main') {
			next = { ...payload, image: MEDIA.benefitsMain };
		} else if (row.section === 'location') {
			next = { ...payload, image: MEDIA.location };
		}
		if (next) {
			await db
				.update(programSection)
				.set({ payload: next })
				.where(eq(programSection.id, row.id));
			console.log('  Updated', row.section);
		}
	}

	await client.end();
	console.log('Done.');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
