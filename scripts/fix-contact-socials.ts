/**
 * Replace the placeholder social links in contact_settings with the real ones.
 *
 * scripts/seed-cms-defaults.ts seeds `{instagram: 'https://instagram.com'}`,
 * `{facebook: 'https://facebook.com'}`, `{linkedin: 'https://linkedin.com'}` — bare
 * network homepages, not the brand's accounts. The live site's footer links only to
 * Facebook and YouTube.
 *
 * 'facebook' and 'youtube' are both valid keys (see ICON_MAP in SocialIcons.svelte).
 *
 * Idempotent. Usage: bun run scripts/fix-contact-socials.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { contactSettings } from '../src/lib/server/db/schema';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

/** Verified from the live site footer. */
const SOCIALS = [
	{ name: 'facebook', url: 'https://www.facebook.com/kogaionacademy.ro/' },
	{ name: 'youtube', url: 'https://www.youtube.com/channel/UCoBFhLHz0qA0lFX3P0QOxcA' }
];

async function main() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	for (const locale of ['ro', 'en']) {
		await db
			.update(contactSettings)
			.set({ socials: SOCIALS, updatedAt: new Date() })
			.where(eq(contactSettings.locale, locale));
		console.log(`contact_settings/${locale}: socials set (${SOCIALS.length}).`);
	}

	await client.end();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
