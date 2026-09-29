/**
 * Direct migration runner — sandbox-safe equivalent of `drizzle-kit migrate`.
 *
 * drizzle-kit spawns a child process (its esbuild config loader), which is blocked in
 * sandboxed/CI-with-restricted-pipe environments (`spawn EPERM`). This applies the exact
 * same logic as drizzle-orm's migrator: reads drizzle/meta/_journal.json, applies each
 * drizzle/<tag>.sql in order, and records sha256 hashes in public.__drizzle_migrations.
 *
 * Running this instead of `bun run db:migrate` leaves the journal in the same state, so a
 * later `drizzle-kit migrate` is a no-op.
 *
 * Usage: DATABASE_URL=... bun run scripts/migrate-direct.ts
 */
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { join } from 'path';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

type JournalEntry = { idx: number; tag: string; when: number };

async function main() {
	const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });

	await client.unsafe(`
		CREATE TABLE IF NOT EXISTS public.__drizzle_migrations (
			id SERIAL PRIMARY KEY,
			hash TEXT NOT NULL,
			created_at BIGINT NOT NULL
		)
	`);

	const existing = await client<{ hash: string }[]>`
		SELECT hash FROM public.__drizzle_migrations
	`;
	const applied = new Set(existing.map((r) => r.hash));
	console.log(`Already applied: ${applied.size} migration(s).`);

	const journal = JSON.parse(
		readFileSync(join(process.cwd(), 'drizzle', 'meta', '_journal.json'), 'utf-8')
	) as { entries: JournalEntry[] };

	for (const entry of journal.entries) {
		const sqlText = readFileSync(join(process.cwd(), 'drizzle', `${entry.tag}.sql`), 'utf-8');
		const hash = createHash('sha256').update(sqlText).digest('hex');

		if (applied.has(hash)) {
			console.log(`- ${entry.tag}: already applied`);
			continue;
		}

		const statements = sqlText
			.split('--> statement-breakpoint')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		await client.begin(async (tx) => {
			for (const statement of statements) {
				await tx.unsafe(statement);
			}
			await tx`INSERT INTO public.__drizzle_migrations (hash, created_at) VALUES (${hash}, ${entry.when})`;
		});

		console.log(`+ ${entry.tag}: applied (${statements.length} statements)`);
	}

	const [{ count }] = await client<{ count: number }[]>`
		SELECT count(*)::int AS count
		FROM information_schema.tables
		WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
	`;
	console.log(`\nDone. public tables: ${count}`);

	await client.end();
}

main().catch((e) => {
	console.error('MIGRATION ERROR:', e);
	process.exit(1);
});
