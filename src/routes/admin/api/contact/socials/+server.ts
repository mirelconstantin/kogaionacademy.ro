import { json } from '@sveltejs/kit';
import { requirePermission } from '$lib/server/permissions';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { contactSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Social networks the site can display. Twitter/X was retired (brief 21/09/2026), so it is
 * absent. This must stay in sync with SOCIAL_NETWORKS in SocialLinksEditor.svelte,
 * admin/contact/+page.svelte and admin/pages/[pageKey]/+page.svelte, and with ICON_MAP in
 * SocialIcons.svelte. Without this filter, the PATCH below is a second persistence path
 * that would keep a retired network writable even after the UI stopped offering it.
 */
const SOCIAL_ALLOWED = new Set(['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok']);

export const GET: RequestHandler = async (event) => {
	requirePermission(event, 'pages.view');
	const locale = event.url.searchParams.get('locale') || 'ro';
	if (locale !== 'ro' && locale !== 'en') {
		return json({ error: 'Invalid locale' }, { status: 400 });
	}
	const [row] = await db
		.select({ socials: contactSettings.socials })
		.from(contactSettings)
		.where(eq(contactSettings.locale, locale))
		.limit(1);
	const socials = (row?.socials ?? []) as { name: string; url: string }[];
	return json({ socials });
};

export const PATCH: RequestHandler = async (event) => {
	requirePermission(event, 'pages.edit');
	let body: { locale?: string; socials?: { name: string; url: string }[] };
	try {
		body = await event.request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}
	const locale = body.locale || 'ro';
	if (locale !== 'ro' && locale !== 'en') {
		return json({ error: 'Invalid locale' }, { status: 400 });
	}
	const raw = body.socials;
	const socials: { name: string; url: string }[] = Array.isArray(raw)
		? raw
				.filter(
					(s) =>
						s &&
						typeof s.name === 'string' &&
						typeof s.url === 'string' &&
						s.url.trim() &&
						SOCIAL_ALLOWED.has(s.name.trim().toLowerCase())
				)
				.map((s) => ({ name: s.name.trim().toLowerCase(), url: (s.url as string).trim() }))
		: [];
	const userId = event.locals.user?.id ?? null;
	const [existing] = await db
		.select()
		.from(contactSettings)
		.where(eq(contactSettings.locale, locale))
		.limit(1);
	if (existing) {
		await db
			.update(contactSettings)
			.set({ socials, updatedAt: new Date(), updatedBy: userId })
			.where(eq(contactSettings.locale, locale));
	} else {
		await db.insert(contactSettings).values({
			locale,
			email: 'contact@example.com',
			phone: '',
			address: '',
			socials,
			updatedBy: userId
		});
	}
	return json({ success: true });
};
