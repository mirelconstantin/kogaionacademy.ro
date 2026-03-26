import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { siteSection, heroSettings, contactSettings } from '$lib/server/db/schema';
import { getDefaultSectionPayload } from '$lib/server/cms-defaults';
import { getPrograms } from '$lib/server/content';
import { logCmsAudit, getUserDisplayName } from '$lib/server/audit';
import { requirePermission } from '$lib/server/permissions';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

const PAGE_KEYS = ['home', 'about', 'programs', 'contact', 'mentors'] as const;

function mergeSectionPayloadWithDefaults(
	page: string,
	section: string,
	locale: 'ro' | 'en',
	rowPayload: Record<string, unknown> | null | undefined
): Record<string, unknown> {
	const defaults = getDefaultSectionPayload(page, section, locale) ?? {};
	const payload = rowPayload ?? {};
	const merged = { ...defaults, ...payload };
	if (page === 'about' && section === 'age_cards') {
		const defaultCards = (defaults as { cards?: Array<Record<string, unknown>> }).cards ?? [];
		const payloadCards = (payload as { cards?: Array<Record<string, unknown>> }).cards ?? [];
		const cards = Array.from({ length: Math.max(defaultCards.length, payloadCards.length, 3) }, (_, i) => ({
			...(defaultCards[i] ?? {}),
			...(payloadCards[i] ?? {})
		}));
		return { ...merged, cards };
	}
	return merged;
}

/** Returns true if payload has at least one non-empty string (recursively in objects and arrays). */
function sectionHasTextContent(payload: unknown): boolean {
	if (payload == null) return false;
	if (typeof payload === 'string') return payload.trim().length > 0;
	if (Array.isArray(payload)) return payload.some((item) => sectionHasTextContent(item));
	if (typeof payload === 'object') {
		return Object.values(payload).some((v) => sectionHasTextContent(v));
	}
	return false;
}

/** Section keys that are always shown for editing (even when empty). */
const DEFAULT_SECTION_KEYS_BY_PAGE: Record<string, string[]> = {
	home: [
		'intro',
		'hero_label',
		'stats',
		'featured_heading',
		'mentors_preview',
		'why_us',
		'about_teaser',
		'programs_section',
		'blog_teaser',
		'contact_cta'
	],
	about: [
		'hero',
		'letter',
		'timeline',
		'mission',
		'integrated',
		'transdisciplinary',
		'skills',
		'founders',
		'age_cards',
		'cta_section'
	],
	programs: ['hero'],
	mentors: ['hero', 'cta'],
	contact: ['hero']
};

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'pages.view');
	const pageKey = event.params.pageKey as string;
	if (!PAGE_KEYS.includes(pageKey as (typeof PAGE_KEYS)[number])) {
		return {
			pageKey,
			sections: [],
			sectionKeysWithContent: [],
			defaultSectionKeys: [],
			heroRo: null,
			heroEn: null,
			programs: [],
			contactRo: null
		};
	}
	let sections = await db.select().from(siteSection).where(eq(siteSection.page, pageKey));
	sections = sections.map((r) => ({
		...r,
		payload: mergeSectionPayloadWithDefaults(
			pageKey,
			r.section,
			(r.locale as 'ro' | 'en') ?? 'ro',
			r.payload as Record<string, unknown>
		) as object
	}));
	// Fill missing section rows with default payloads so edit forms show fallback values.
	const defaultKeys = DEFAULT_SECTION_KEYS_BY_PAGE[pageKey] ?? [];
	const locale = 'ro' as const;
	for (const section of defaultKeys) {
		const hasRow = sections.some((r) => r.section === section && r.locale === locale);
		if (!hasRow) {
			const defaultPayload = mergeSectionPayloadWithDefaults(pageKey, section, locale, undefined);
			if (defaultPayload) {
				sections = [
					...sections,
					{
						id: 0,
						page: pageKey,
						section,
						locale,
						payload: defaultPayload as object,
						updatedAt: new Date(),
						updatedBy: null
					} as (typeof sections)[number]
				];
			}
		}
	}
	const sectionKeysWithContent = [
		...new Set(
			sections
				.filter((r) => sectionHasTextContent(r.payload))
				.map((r) => r.section)
		)
	];
	let heroRo = null;
	let heroEn = null;
	let programs: Awaited<ReturnType<typeof getPrograms>> = [];
	let contactRo: (typeof contactSettings.$inferSelect) | null = null;
	if (pageKey === 'home') {
		const heroes = await db.select().from(heroSettings);
		heroRo = heroes.find((h) => h.locale === 'ro') ?? null;
		heroEn = heroes.find((h) => h.locale === 'en') ?? null;
	}
	if (pageKey === 'programs') {
		programs = await getPrograms('ro');
	}
	if (pageKey === 'contact') {
		const [row] = await db
			.select()
			.from(contactSettings)
			.where(eq(contactSettings.locale, 'ro'))
			.limit(1);
		contactRo = row ?? null;
	}
	const defaultSectionKeys = DEFAULT_SECTION_KEYS_BY_PAGE[pageKey] ?? [];
	return {
		pageKey,
		sections,
		sectionKeysWithContent,
		defaultSectionKeys,
		heroRo,
		heroEn,
		programs,
		contactRo
	};
};

export const actions: Actions = {
	updateSection: async (event) => {
		requirePermission(event, 'pages.edit');
		const formData = await event.request.formData();
		const pageKey = (formData.get('page') as string)?.trim() ?? '';
		const section = (formData.get('section') as string)?.trim() ?? '';
		const locale = (formData.get('locale') as string)?.trim() ?? 'ro';
		const payloadStr = (formData.get('payload') as string)?.trim() ?? '{}';
		if (!pageKey || !section) return fail(400, { error: 'Page and section required' });
		let payload: Record<string, unknown>;
		try {
			payload = JSON.parse(payloadStr) as Record<string, unknown>;
		} catch {
			return fail(400, { error: 'Invalid JSON payload' });
		}
		const userId = event.locals.user?.id ?? null;
		const [existing] = await db
			.select()
			.from(siteSection)
			.where(
				and(
					eq(siteSection.page, pageKey),
					eq(siteSection.section, section),
					eq(siteSection.locale, locale)
				)
			)
			.limit(1);
		const payloadBefore = existing ? (existing.payload as Record<string, unknown>) : null;
		const mergedPayload = payloadBefore ? { ...payloadBefore, ...payload } : payload;
		await db
			.insert(siteSection)
			.values({
				page: pageKey,
				section,
				locale,
				payload: mergedPayload as object,
				updatedBy: userId
			})
			.onConflictDoUpdate({
				target: [siteSection.page, siteSection.section, siteSection.locale],
				set: { payload: mergedPayload as object, updatedBy: userId, updatedAt: new Date() }
			});
		await logCmsAudit({
			entityType: 'site_section',
			entityId: `${pageKey}:${section}:${locale}`,
			userId,
			userName: getUserDisplayName(event.locals.user as { name?: string; email?: string } | null),
			action: existing ? 'update' : 'create',
			payloadBefore: payloadBefore ?? undefined,
			payloadAfter: mergedPayload
		});
		return { success: true };
	},
	updateHero: async (event) => {
		requirePermission(event, 'pages.edit');
		const formData = await event.request.formData();
		const locale = (formData.get('locale') as string)?.trim() ?? 'ro';
		const videoUrl = (formData.get('videoUrl') as string)?.trim() ?? '';
		const posterUrl = (formData.get('posterUrl') as string)?.trim() || null;
		const ctaPrimaryLabel = (formData.get('ctaPrimaryLabel') as string)?.trim() || null;
		const ctaPrimaryLink = (formData.get('ctaPrimaryLink') as string)?.trim() || null;
		const ctaSecondaryLabel = (formData.get('ctaSecondaryLabel') as string)?.trim() || null;
		const ctaSecondaryLink = (formData.get('ctaSecondaryLink') as string)?.trim() || null;
		if (!videoUrl) return fail(400, { error: 'Video URL required' });
		const userId = event.locals.user?.id ?? null;
		const [existing] = await db.select().from(heroSettings).where(eq(heroSettings.locale, locale)).limit(1);
		const afterPayload = {
			locale,
			videoUrl,
			posterUrl,
			ctaPrimaryLabel,
			ctaPrimaryLink,
			ctaSecondaryLabel,
			ctaSecondaryLink
		};
		await db
			.insert(heroSettings)
			.values({
				locale,
				videoUrl,
				posterUrl,
				ctaPrimaryLabel,
				ctaPrimaryLink,
				ctaSecondaryLabel,
				ctaSecondaryLink,
				updatedBy: userId
			})
			.onConflictDoUpdate({
				target: heroSettings.locale,
				set: {
					videoUrl,
					posterUrl,
					ctaPrimaryLabel,
					ctaPrimaryLink,
					ctaSecondaryLabel,
					ctaSecondaryLink,
					updatedBy: userId
				}
			});
		await logCmsAudit({
			entityType: 'hero_settings',
			entityId: locale,
			userId,
			userName: getUserDisplayName(event.locals.user as { name?: string; email?: string } | null),
			action: existing ? 'update' : 'create',
			payloadBefore: existing ? (existing as unknown as Record<string, unknown>) : undefined,
			payloadAfter: afterPayload
		});
		return { success: true };
	},
	updateContactSocials: async (event) => {
		requirePermission(event, 'pages.edit');
		const formData = await event.request.formData();
		const locale = (formData.get('locale') as string)?.trim() ?? 'ro';
		const SOCIAL_KEYS = ['instagram', 'facebook', 'linkedin', 'youtube', 'twitter', 'tiktok'] as const;
		const socials: { name: string; url: string }[] = [];
		for (const key of SOCIAL_KEYS) {
			const url = (formData.get(`social_${key}`) as string)?.trim();
			if (url) socials.push({ name: key, url });
		}
		const userId = event.locals.user?.id ?? null;
		const [existing] = await db
			.select()
			.from(contactSettings)
			.where(eq(contactSettings.locale, locale))
			.limit(1);
		if (!existing) {
			return fail(400, { error: 'Contact settings not found for locale. Run db:seed:cms first.', updateContactSocials: true });
		}
		await db
			.update(contactSettings)
			.set({ socials, updatedBy: userId })
			.where(eq(contactSettings.locale, locale));
		await logCmsAudit({
			entityType: 'contact_settings',
			entityId: locale,
			userId,
			userName: getUserDisplayName(event.locals.user as { name?: string; email?: string } | null),
			action: 'update',
			payloadBefore: existing ? (existing as unknown as Record<string, unknown>) : undefined,
			payloadAfter: { ...existing, socials }
		});
		return { success: true, updateContactSocials: true };
	}
};
