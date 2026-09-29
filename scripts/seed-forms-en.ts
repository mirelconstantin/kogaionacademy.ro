/**
 * Seed the English variant of the contact form definition.
 *
 * scripts/seed-forms-default.ts only inserts `contact`/ro, and
 * getPublishedFormDefinition() (src/lib/server/forms/queries.ts) matches the locale
 * exactly with no RO fallback — so /contact in English had no published definition and
 * silently fell back to the Romanian DEFAULT_CONTACT_FORM_SCHEMA.
 *
 * Field keys, types, required flags, piiClass, autocomplete and rows are copied verbatim
 * from DEFAULT_CONTACT_FORM_SCHEMA; only the English copy of the labels is added.
 *
 * Idempotent: skip-if-present, same guard style as seed-forms-default.ts.
 * Usage: bun run scripts/seed-forms-en.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, eq } from 'drizzle-orm';
import { formsDefinition, formsPlacement } from '../src/lib/server/db/schema';
import { DEFAULT_CONTACT_FORM_SCHEMA } from '../src/lib/server/forms/defaults';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

/** English copy for the fields whose RO source text needs translating. */
const EN_LABELS: Record<string, Record<string, string>> = {
	name: { label: 'Name', placeholder: 'e.g. Maria Ionescu', sampleValue: 'Alexandru Ionescu' },
	email: { label: 'Email', placeholder: 'name@email.com', sampleValue: 'contact@example.com' },
	message: {
		label: 'Message',
		placeholder: 'Write your question or message here…',
		sampleValue:
			'Hello, I would like to find out more about the summer camps for children aged 10–12 and about enrolment. Thank you!'
	}
};

const EN_SUBMIT_LABEL = 'Send message';
const EN_CONSENT_HINT =
	'By sending this form, you agree that we may contact you for clarifications.';

function buildEnglishSchema() {
	const base = DEFAULT_CONTACT_FORM_SCHEMA;
	return {
		version: base.version ?? 1,
		fields: base.fields.map((f) => {
			const en = EN_LABELS[f.key];
			if (!en) return f;
			return {
				...f,
				label: { ...f.label, en: en.label },
				...(en.placeholder ? { placeholder: { ...f.placeholder, en: en.placeholder } } : {}),
				...(en.sampleValue ? { sampleValue: { ...f.sampleValue, en: en.sampleValue } } : {})
			};
		}),
		...(base.submitLabel ? { submitLabel: { ...base.submitLabel, en: EN_SUBMIT_LABEL } } : {}),
		...(base.consentHint ? { consentHint: { ...base.consentHint, en: EN_CONSENT_HINT } } : {})
	};
}

async function seed() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	const [existing] = await db
		.select({ id: formsDefinition.id })
		.from(formsDefinition)
		.where(
			and(
				eq(formsDefinition.key, 'contact'),
				eq(formsDefinition.locale, 'en'),
				eq(formsDefinition.status, 'published')
			)
		)
		.limit(1);

	if (existing) {
		console.log('Published contact/en form already exists, skip.');
		await client.end();
		return;
	}

	const now = new Date();
	await db.insert(formsDefinition).values({
		key: 'contact',
		locale: 'en',
		version: 1,
		title: 'Contact',
		schemaJson: buildEnglishSchema(),
		status: 'published',
		publishedAt: now,
		updatedBy: 'seed-forms-en'
	});
	console.log('Inserted forms_definition contact/en v1 published.');

	await db
		.insert(formsPlacement)
		.values({
			formKey: 'contact',
			placementKey: 'contact:main',
			routePattern: '/contact',
			enabled: 1
		})
		.onConflictDoNothing({ target: [formsPlacement.formKey, formsPlacement.placementKey] });

	await client.end();
}

seed().catch((e) => {
	console.error(e);
	process.exit(1);
});
