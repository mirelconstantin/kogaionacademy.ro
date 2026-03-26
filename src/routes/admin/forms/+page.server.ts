import { db } from '$lib/server/db';
import { formsDefinition } from '$lib/server/db/schema';
import { requirePermission } from '$lib/server/permissions';
import { asc, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'forms.view');

	const rows = await db
		.select()
		.from(formsDefinition)
		.orderBy(asc(formsDefinition.key), asc(formsDefinition.locale), desc(formsDefinition.version));

	const latestByPair = new Map<string, (typeof rows)[0]>();
	for (const row of rows) {
		const pair = `${row.key}:${row.locale}`;
		if (!latestByPair.has(pair)) latestByPair.set(pair, row);
	}

	return {
		forms: [...latestByPair.values()].sort((a, b) => a.key.localeCompare(b.key) || a.locale.localeCompare(b.locale))
	};
};
