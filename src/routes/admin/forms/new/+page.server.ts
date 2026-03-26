import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { formsDefinition } from '$lib/server/db/schema';
import { logCmsAudit, getUserDisplayName } from '$lib/server/audit';
import { requirePermission } from '$lib/server/permissions';
import { and, eq, max } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'forms.edit');
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		requirePermission(event, 'forms.edit');
		const data = await event.request.formData();
		const key = ((data.get('key') as string) ?? '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
		const locale = ((data.get('locale') as string) ?? 'ro').trim().slice(0, 8) || 'ro';
		const title = ((data.get('title') as string) ?? '').trim() || key;
		if (!key) return fail(400, { message: 'Cheie invalidă' });

		const emptySchema = { version: 1, fields: [] as unknown[] };

		const [m] = await db
			.select({ v: max(formsDefinition.version) })
			.from(formsDefinition)
			.where(and(eq(formsDefinition.key, key), eq(formsDefinition.locale, locale)));
		const nextVersion = Number(m?.v ?? 0) + 1;

		const [inserted] = await db
			.insert(formsDefinition)
			.values({
				key,
				locale,
				version: nextVersion,
				title,
				schemaJson: emptySchema,
				status: 'draft',
				updatedBy: event.locals.user?.email ?? event.locals.user?.id ?? null
			})
			.returning({ id: formsDefinition.id });

		await logCmsAudit({
			entityType: 'forms_definition',
			entityId: String(inserted?.id),
			userId: event.locals.user?.id ?? null,
			userName: getUserDisplayName(event.locals.user ?? null),
			action: 'create',
			payloadAfter: { key, locale, title }
		});

		throw redirect(303, `/admin/forms/${inserted?.id}`);
	}
};
