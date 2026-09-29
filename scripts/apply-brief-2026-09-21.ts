/**
 * One-off data migration for the client brief of 21/09/2026.
 *
 *  1. Contact email -> contact@kogaionacademy.ro (was diana@).
 *  2. Social links -> the real accounts; Twitter/X dropped entirely.
 *  3. Office removed: the Bucharest premises (Șoseaua Nordului nr. 94F) has closed, so
 *     contact_settings.address / map_url are cleared and the `address` column is made
 *     nullable (it was NOT NULL, which would have forced a fake value to remain).
 *  4. "Centru enrichment" retired -> the 2 Bucharest programmes go to status='draft'.
 *     Drafted, not deleted, so a single UPDATE brings them back.
 *  5. Colceag stays on as founder but is no longer listed as a mentor -> status='draft'.
 *
 * Idempotent. Usage: bun run scripts/apply-brief-2026-09-21.ts
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, count } from 'drizzle-orm';
import { contactSettings, program, mentor, siteSetting } from '../src/lib/server/db/schema';
import { defaultLegalPoliciesPayload } from '../src/lib/server/legal/legal-policies-defaults';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const EMAIL = 'contact@kogaionacademy.ro';

/** The office is gone: every entry is a real account, and there is no Twitter/X. */
const SOCIALS = [
	{ name: 'instagram', url: 'https://www.instagram.com/kogaionacademy/' },
	{ name: 'facebook', url: 'https://www.facebook.com/kogaionacademy.ro' },
	{
		name: 'linkedin',
		url: 'https://www.linkedin.com/company/kogaion-gifted-academy/posts/?feedView=all'
	},
	{ name: 'youtube', url: 'https://www.youtube.com/@KOGAIONGIFTEDACADEMY' }
];

const RETIRED_PROGRAM_SLUGS = ['afterschool-kogaion-self-mastery', 'kogaion-bright-academy'];
const FOUNDER_ONLY_MENTOR_SLUGS = ['florian-colceag'];

async function main() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	// 1 + 2 + 3 — contact settings, both locales.
	for (const locale of ['ro', 'en']) {
		await db
			.update(contactSettings)
			.set({
				email: EMAIL,
				address: null,
				mapUrl: null,
				socials: SOCIALS,
				updatedAt: new Date(),
				updatedBy: 'brief-2026-09-21'
			})
			.where(eq(contactSettings.locale, locale));
		console.log(
			`contact_settings/${locale}: email -> ${EMAIL}, address+map cleared, socials -> ${SOCIALS.length} accounts`
		);
	}

	// 4 — retire the enrichment programmes.
	const retired = await db
		.update(program)
		.set({ status: 'draft', updatedAt: new Date(), updatedBy: 'brief-2026-09-21' })
		.where(inArray(program.slug, RETIRED_PROGRAM_SLUGS))
		.returning({ slug: program.slug });
	console.log(`program: drafted ${retired.length} -> ${retired.map((r) => r.slug).join(', ')}`);

	// 5 — Colceag: founder, not mentor.
	const founders = await db
		.update(mentor)
		.set({ status: 'draft', updatedAt: new Date(), updatedBy: 'brief-2026-09-21' })
		.where(inArray(mentor.slug, FOUNDER_ONLY_MENTOR_SLUGS))
		.returning({ slug: mentor.slug });
	console.log(`mentor: drafted ${founders.length} -> ${founders.map((r) => r.slug).join(', ')}`);

	// Legal policies: email changes; operatorAddress is an operator-identity field, not a
	// premises field, so it is left as the client must supply the registered address
	// (Romanian privacy law requires one for ANSPDCP). Reported, not silently dropped.
	const [legal] = await db
		.select()
		.from(siteSetting)
		.where(eq(siteSetting.key, 'legal_policies'))
		.limit(1);
	if (legal) {
		const value = legal.value as Record<string, unknown>;
		if (value.operatorEmail !== EMAIL || value.dpoEmail !== EMAIL) {
			await db
				.update(siteSetting)
				.set({
					value: { ...value, operatorEmail: EMAIL, dpoEmail: EMAIL },
					updatedAt: new Date(),
					updatedBy: 'brief-2026-09-21'
				})
				.where(eq(siteSetting.key, 'legal_policies'));
			console.log('site_setting/legal_policies: operatorEmail + dpoEmail -> ' + EMAIL);
		} else {
			console.log('site_setting/legal_policies: emails already current');
		}
		console.log(
			`site_setting/legal_policies: operatorAddress left as ${JSON.stringify(defaultLegalPoliciesPayload().operatorAddress)} — needs the registered address`
		);
	}

	// Verification read-back.
	const cs = await db.select().from(contactSettings);
	for (const row of cs) {
		console.log(
			`  [${row.locale}] email=${row.email} address=${row.address ?? 'NULL'} map=${row.mapUrl ?? 'NULL'} socials=${(row.socials as unknown[])?.length ?? 0}`
		);
	}
	const p = await db
		.select({ slug: program.slug, status: program.status })
		.from(program)
		.where(inArray(program.slug, RETIRED_PROGRAM_SLUGS));
	console.log('  programs:', p.map((r) => `${r.slug}=${r.status}`).join(', '));
	const m = await db
		.select({ slug: mentor.slug, status: mentor.status })
		.from(mentor)
		.where(and(inArray(mentor.slug, FOUNDER_ONLY_MENTOR_SLUGS)));
	console.log('  mentor:', m.map((r) => `${r.slug}=${r.status}`).join(', '));
	const live = await db.select({ n: count() }).from(program).where(eq(program.status, 'published'));
	console.log('  published programs remaining:', live[0]?.n);
	const liveMentors = await db
		.select({ n: count() })
		.from(mentor)
		.where(eq(mentor.status, 'published'));
	console.log('  published mentors remaining:', liveMentors[0]?.n);

	await client.end();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
