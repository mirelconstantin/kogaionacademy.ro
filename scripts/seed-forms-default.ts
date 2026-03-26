/**
 * Seed published contact form v1 if missing. Run: bun run scripts/seed-forms-default.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { formsDefinition, formsPlacement } from '../src/lib/server/db/schema';
import { DEFAULT_CONTACT_FORM_SCHEMA } from '../src/lib/server/forms/defaults';
import { and, eq } from 'drizzle-orm';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

async function seed() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	const locale = 'ro';
	const existing = await db
		.select({ id: formsDefinition.id })
		.from(formsDefinition)
		.where(
			and(eq(formsDefinition.key, 'contact'), eq(formsDefinition.locale, locale), eq(formsDefinition.status, 'published'))
		)
		.limit(1);

	if (existing[0]) {
		console.log('Published contact form already exists, skip.');
	} else {
		await db.insert(formsDefinition).values({
			key: 'contact',
			locale,
			version: 1,
			title: 'Contact',
			schemaJson: DEFAULT_CONTACT_FORM_SCHEMA,
			status: 'published',
			publishedAt: new Date(),
			updatedBy: 'seed-forms-default'
		});
		console.log('Inserted forms_definition contact/ro v1 published.');
	}

	await db
		.insert(formsPlacement)
		.values({
			formKey: 'contact',
			placementKey: 'contact:main',
			routePattern: '/contact',
			enabled: true
		})
		.onConflictDoNothing({ target: [formsPlacement.formKey, formsPlacement.placementKey] });

	console.log('Done.');
	process.exit(0);
}

seed().catch((e) => {
	console.error(e);
	process.exit(1);
});
