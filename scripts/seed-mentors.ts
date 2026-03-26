/**
 * Seed script for mentors table. Run with: bun run scripts/seed-mentors.ts
 * Requires DATABASE_URL and existing mentors table (bun run db:push).
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { mentor } from '../src/lib/server/db/schema';
import { mentorsSeedData } from './mentors-seed-data';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

async function seed() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	console.log('Seeding mentors...');
	const now = new Date();
	for (const m of mentorsSeedData) {
		await db
			.insert(mentor)
			.values({
				slug: m.slug,
				nameRo: m.nameRo,
				nameEn: m.nameEn ?? m.nameRo,
				titleRo: m.titleRo,
				titleEn: m.titleEn ?? m.titleRo,
				bioRo: m.bioRo,
				bioEn: m.bioEn ?? m.bioRo,
				image: m.image,
				yearJoined: m.yearJoined,
				sortOrder: m.sortOrder,
				status: 'published',
				publishedAt: now
			})
			.onConflictDoUpdate({
				target: mentor.slug,
				set: {
					nameRo: m.nameRo,
					nameEn: m.nameEn,
					titleRo: m.titleRo,
					titleEn: m.titleEn,
					bioRo: m.bioRo,
					bioEn: m.bioEn,
					image: m.image,
					yearJoined: m.yearJoined,
					sortOrder: m.sortOrder,
					updatedAt: now
				}
			});
	}
	console.log(`Seeded ${mentorsSeedData.length} mentors.`);
	await client.end();
}

seed().catch((e) => {
	console.error(e);
	process.exit(1);
});
