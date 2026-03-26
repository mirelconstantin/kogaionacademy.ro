/**
 * Creează tabelul blog_post dacă nu există.
 * Util când db:migrate eșuează din cauza jurnalului desincronizat.
 * Usage: bun run scripts/ensure-blog-post.ts
 */
import postgres from 'postgres';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const SQL = `
CREATE TABLE IF NOT EXISTS "blog_post" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body" text DEFAULT '' NOT NULL,
	"locale" text DEFAULT 'ro' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"featured_image" text,
	"published_at" timestamp,
	"scheduled_for" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "blog_post_slug_unique" UNIQUE("slug")
);
`;

async function main() {
	const client = postgres(databaseUrl);
	try {
		await client.unsafe(SQL);
		console.log('Tabelul blog_post a fost creat (sau exista deja).');
	} catch (e) {
		console.error('Eroare:', e);
		process.exit(1);
	} finally {
		await client.end();
	}
}

main();
