import { db } from '$lib/server/db';
import { formsDefinition } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import type { FormSchemaV1 } from '$lib/forms/types';
import { parseFormSchemaClient } from '$lib/forms/schema-utils';

export type PublishedFormRow = {
	id: number;
	key: string;
	locale: string;
	version: number;
	title: string | null;
	schemaJson: unknown;
};

export async function getPublishedFormDefinition(
	formKey: string,
	locale: string
): Promise<PublishedFormRow | null> {
	const rows = await db
		.select()
		.from(formsDefinition)
		.where(
			and(eq(formsDefinition.key, formKey), eq(formsDefinition.locale, locale), eq(formsDefinition.status, 'published'))
		)
		.orderBy(desc(formsDefinition.version))
		.limit(1);
	const row = rows[0];
	if (!row) return null;
	return {
		id: row.id,
		key: row.key,
		locale: row.locale,
		version: row.version,
		title: row.title,
		schemaJson: row.schemaJson
	};
}

export function parseFormSchema(raw: unknown): FormSchemaV1 | null {
	return parseFormSchemaClient(raw);
}
