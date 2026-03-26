/**
 * Inserează șabloanele legale implicite în site_setting dacă lipesc.
 * Rulează: bun run scripts/seed-legal-policies.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { siteSetting } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import {
	defaultLegalPoliciesPayload,
	LEGAL_POLICIES_SETTING_KEY
} from '../src/lib/server/legal/legal-policies-defaults';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

async function seed() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	const [existing] = await db
		.select({ key: siteSetting.key })
		.from(siteSetting)
		.where(eq(siteSetting.key, LEGAL_POLICIES_SETTING_KEY))
		.limit(1);

	if (existing) {
		console.log('legal_policies already in site_setting, skip.');
	} else {
		const payload = defaultLegalPoliciesPayload();
		await db.insert(siteSetting).values({
			key: LEGAL_POLICIES_SETTING_KEY,
			value: payload as unknown as Record<string, unknown>,
			updatedBy: 'seed-legal-policies'
		});
		console.log('Inserted default legal_policies into site_setting.');
	}

	process.exit(0);
}

seed().catch((e) => {
	console.error(e);
	process.exit(1);
});
