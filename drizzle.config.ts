import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL ?? 'postgres://localhost:5432/kogaion';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: { url: databaseUrl },
	migrations: { schema: 'public', table: '__drizzle_migrations' },
	verbose: true,
	strict: true
});
