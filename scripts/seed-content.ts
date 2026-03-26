/**
 * Seed programs and program_locale from existing programs-data and messages (ro/en).
 * Idempotent: uses onConflictDoUpdate. Run after db:migrate.
 * Usage: bun run scripts/seed-content.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { program, programLocale } from '../src/lib/server/db/schema';
import { programsList } from '../src/lib/programs-data';
import type { ProgramItem } from '../src/lib/programs-data';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

type Messages = Record<string, string>;

function loadMessages(locale: string): Messages {
	const path = join(process.cwd(), 'messages', `${locale}.json`);
	const raw = readFileSync(path, 'utf-8');
	const data = JSON.parse(raw) as Record<string, unknown>;
	const out: Messages = {};
	for (const [k, v] of Object.entries(data)) {
		if (k.startsWith('$')) continue;
		out[k] = typeof v === 'string' ? v : String(v ?? '');
	}
	return out;
}

function msg(m: Messages, key: string): string {
	return m[key] ?? key;
}

async function seed() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);
	const ro = loadMessages('ro');
	const en = loadMessages('en');

	console.log('Seeding programs and program_locale...');
	let order = 0;
	for (const item of programsList as ProgramItem[]) {
		const [inserted] = await db
			.insert(program)
			.values({
				slug: item.slug,
				categoryId: item.categoryId,
				image: item.image ?? null,
				badge: item.badge ?? null,
				sortOrder: order++,
				status: 'published',
				publishedAt: new Date()
			})
			.onConflictDoUpdate({
				target: program.slug,
				set: {
					categoryId: item.categoryId,
					image: item.image ?? undefined,
					badge: item.badge ?? undefined,
					sortOrder: order - 1,
					updatedAt: new Date()
				}
			})
			.returning({ id: program.id });

		const programId = inserted!.id;

		const titleRo = msg(ro, item.titleKey);
		const ageRo = msg(ro, item.ageKey);
		const descRo = item.descriptionKey ? msg(ro, item.descriptionKey) : null;
		const locationRo = msg(ro, item.locationKey);
		const datesRo = msg(ro, item.datesKey);
		const durationRo = item.durationKey ? msg(ro, item.durationKey) : null;

		const titleEn = msg(en, item.titleKey) || titleRo;
		const ageEn = msg(en, item.ageKey) || ageRo;
		const descEn = item.descriptionKey ? (msg(en, item.descriptionKey) || descRo) : null;
		const locationEn = msg(en, item.locationKey) || locationRo;
		const datesEn = msg(en, item.datesKey) || datesRo;
		const durationEn = item.durationKey ? (msg(en, item.durationKey) || durationRo) : null;

		await db
			.insert(programLocale)
			.values({
				programId,
				locale: 'ro',
				title: titleRo,
				ageRange: ageRo,
				description: descRo,
				locationText: locationRo,
				datesText: datesRo,
				durationText: durationRo
			})
			.onConflictDoUpdate({
				target: [programLocale.programId, programLocale.locale],
				set: {
					title: titleRo,
					ageRange: ageRo,
					description: descRo,
					locationText: locationRo,
					datesText: datesRo,
					durationText: durationRo
				}
			});

		await db
			.insert(programLocale)
			.values({
				programId,
				locale: 'en',
				title: titleEn,
				ageRange: ageEn,
				description: descEn,
				locationText: locationEn,
				datesText: datesEn,
				durationText: durationEn
			})
			.onConflictDoUpdate({
				target: [programLocale.programId, programLocale.locale],
				set: {
					title: titleEn,
					ageRange: ageEn,
					description: descEn,
					locationText: locationEn,
					datesText: datesEn,
					durationText: durationEn
				}
			});
	}

	console.log(`Seeded ${programsList.length} programs (RO + EN).`);
	await client.end();
	process.exit(0);
}

seed().catch((e) => {
	console.error(e);
	process.exit(1);
});
