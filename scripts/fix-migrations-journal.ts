/**
 * Sincronizează jurnalul __drizzle_migrations când db:migrate eșuează
 * (ex: tabele există deja dar jurnalul e gol sau desincronizat).
 *
 * Marchează toate migrările 0000–0003 ca aplicate.
 * Usage: bun run scripts/fix-migrations-journal.ts
 */
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

async function main() {
	const client = postgres(databaseUrl);

	try {
		const journalPath = join(process.cwd(), 'drizzle', 'meta', '_journal.json');
		const journal = JSON.parse(readFileSync(journalPath, 'utf-8')) as {
			entries: { idx: number; tag: string; when: number }[];
		};

		// Creează tabelul __drizzle_migrations în schema public dacă nu există
		await client.unsafe(`
			CREATE TABLE IF NOT EXISTS public.__drizzle_migrations (
				id SERIAL PRIMARY KEY,
				hash TEXT NOT NULL,
				created_at BIGINT NOT NULL
			)
		`);

		const existing = await client`
			SELECT hash FROM public.__drizzle_migrations
		`;
		const applied = new Set((existing as { hash: string }[]).map((r) => r.hash));

		for (const entry of journal.entries) {
			const tag = entry.tag;
			if (applied.has(tag)) {
				console.log(`✓ ${tag} – deja aplicată`);
				continue;
			}
			await client`
				INSERT INTO public.__drizzle_migrations (hash, created_at)
				VALUES (${tag}, ${entry.when})
			`;
			console.log(`+ ${tag} – marcată ca aplicată`);
		}

		console.log('\nJurnal sincronizat. Poți rula acum: bun run db:migrate');
	} catch (e) {
		console.error('Eroare:', e);
		process.exit(1);
	} finally {
		await client.end();
	}
}

main();
