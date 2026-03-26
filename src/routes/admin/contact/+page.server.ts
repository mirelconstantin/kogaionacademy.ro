import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contactSettings } from '$lib/server/db/schema';
import { logCmsAudit, getUserDisplayName } from '$lib/server/audit';
import { requirePermission } from '$lib/server/permissions';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'pages.view');
	const rows = await db.select().from(contactSettings);
	const byLocale: Record<string, (typeof rows)[0]> = {};
	for (const r of rows) byLocale[r.locale] = r;
	return {
		contactRo: byLocale['ro'] ?? null,
		contactEn: byLocale['en'] ?? null
	};
};

export const actions: Actions = {
	default: async (event) => {
		requirePermission(event, 'pages.edit');
		const formData = await event.request.formData();
		const locale = (formData.get('locale') as string) || 'ro';
		const email = (formData.get('email') as string)?.trim() ?? '';
		const phone = (formData.get('phone') as string)?.trim() ?? '';
		const address = (formData.get('address') as string)?.trim() ?? '';
		const mapUrl = (formData.get('mapUrl') as string)?.trim() || null;
		const SOCIAL_KEYS = ['instagram', 'facebook', 'linkedin', 'youtube', 'twitter', 'tiktok'] as const;
		const socials: { name: string; url: string }[] = [];
		for (const key of SOCIAL_KEYS) {
			const url = (formData.get(`social_${key}`) as string)?.trim();
			if (url) socials.push({ name: key, url });
		}
		if (!email || !phone || !address) {
			return fail(400, { error: 'Email, phone and address are required', locale });
		}
		const userId = event.locals.user?.id ?? null;
		const [existing] = await db.select().from(contactSettings).where(eq(contactSettings.locale, locale)).limit(1);
		try {
			await db
				.insert(contactSettings)
				.values({
					locale,
					email,
					phone,
					address,
					mapUrl,
					socials,
					updatedBy: userId
				})
				.onConflictDoUpdate({
					target: contactSettings.locale,
					set: { email, phone, address, mapUrl, socials, updatedBy: userId }
				});
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to save', locale });
		}
		await logCmsAudit({
			entityType: 'contact_settings',
			entityId: locale,
			userId,
			userName: getUserDisplayName(event.locals.user as { name?: string; email?: string } | null),
			action: existing ? 'update' : 'create',
			payloadBefore: existing ? (existing as unknown as Record<string, unknown>) : undefined,
			payloadAfter: { locale, email, phone, address, mapUrl, socials }
		});
		return { success: true, locale };
	}
};
