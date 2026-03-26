import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	blogPost,
	cmsAuditLog,
	heroSettings,
	mentor,
	program,
	programLocale,
	programMentor,
	programSection,
	siteSection
} from '$lib/server/db/schema';
import { getDefaultSectionPayload } from '$lib/server/cms-defaults';
import { getHeroSettings } from '$lib/server/content';
import { requireAnyPermission, requirePermission } from '$lib/server/permissions';
import { eq, and, asc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

function getUserName(user: { name?: string; email?: string } | null): string | null {
	if (!user) return null;
	return (user as { name?: string }).name ?? (user as { email?: string }).email ?? null;
}

/** Light validation for program_section merged payload: ensure list fields stay arrays. */
function validateProgramSectionPayload(
	sectionKey: string,
	merged: Record<string, unknown>
): { ok: true } | { ok: false; error: string } {
	if (sectionKey === 'gallery' && 'images' in merged && !Array.isArray(merged.images)) {
		return { ok: false, error: 'gallery.images must be an array' };
	}
	if (sectionKey === 'intro' && 'blocks' in merged && !Array.isArray(merged.blocks)) {
		return { ok: false, error: 'intro.blocks must be an array' };
	}
	if (sectionKey === 'enrollment') {
		if ('steps' in merged && merged.steps != null && !Array.isArray(merged.steps)) {
			return { ok: false, error: 'enrollment.steps must be an array' };
		}
		if ('buttons' in merged && merged.buttons != null && !Array.isArray(merged.buttons)) {
			return { ok: false, error: 'enrollment.buttons must be an array' };
		}
	}
	return { ok: true };
}

type CmsType = 'mentor' | 'program' | 'program_section' | 'section' | 'blog' | 'hero';

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

/** GET ?type=mentor|program|program_section|section|hero (section: &page= &section= &locale=; hero: &locale=; mentor/program/blog: &id=; program_section: &programId= &section= &locale=) */
export const GET: RequestHandler = async (event) => {
	requireAnyPermission(event, ['pages.view', 'programs.view', 'mentors.view', 'blog.view']);
	const type = event.url.searchParams.get('type') as CmsType | null;
	if (!type) return json({ error: 'type required' }, { status: 400 });
	if (type === 'program_section') {
		const programIdParam = event.url.searchParams.get('programId');
		const sectionKey = event.url.searchParams.get('section');
		const locale = (event.url.searchParams.get('locale') ?? 'ro') as 'ro' | 'en';
		if (!programIdParam || !sectionKey) return json({ error: 'programId and section required' }, { status: 400 });
		const programId = parseInt(programIdParam, 10);
		if (Number.isNaN(programId)) return json({ error: 'Invalid programId' }, { status: 400 });
		const [row] = await db
			.select()
			.from(programSection)
			.where(
				and(
					eq(programSection.programId, programId),
					eq(programSection.section, sectionKey),
					eq(programSection.locale, locale)
				)
			)
			.limit(1);
		if (!row) return json({ error: 'Section not found' }, { status: 404 });
		return json({ payload: row.payload ?? {} });
	}
	if (type === 'hero') {
		const locale = (event.url.searchParams.get('locale') ?? 'ro') as 'ro' | 'en';
		const hero = await getHeroSettings(locale);
		if (!hero) return json({ videoUrl: '', posterUrl: null, ctaPrimaryLabel: null, ctaPrimaryLink: null, ctaSecondaryLabel: null, ctaSecondaryLink: null });
		return json({
			videoUrl: hero.videoUrl ?? '',
			posterUrl: hero.posterUrl ?? null,
			ctaPrimaryLabel: hero.ctaPrimaryLabel ?? null,
			ctaPrimaryLink: hero.ctaPrimaryLink ?? null,
			ctaSecondaryLabel: hero.ctaSecondaryLabel ?? null,
			ctaSecondaryLink: hero.ctaSecondaryLink ?? null
		});
	}
	if (type === 'section') {
		const page = event.url.searchParams.get('page');
		const section = event.url.searchParams.get('section');
		const locale = event.url.searchParams.get('locale') ?? 'ro';
		if (!page || !section) return json({ error: 'page and section required' }, { status: 400 });
		const [row] = await db
			.select()
			.from(siteSection)
			.where(
				and(
					eq(siteSection.page, page),
					eq(siteSection.section, section),
					eq(siteSection.locale, locale)
				)
			)
			.limit(1);
		const localeTyped = locale as 'ro' | 'en';
		const payload = mergeSectionPayloadWithDefaults(
			page,
			section,
			localeTyped,
			(row?.payload as Record<string, unknown> | undefined) ?? undefined
		);
		return json({ payload });
	}
	const idParam = event.url.searchParams.get('id');
	if (!idParam) return json({ error: 'id required for mentor/program' }, { status: 400 });
	const id = parseInt(idParam, 10);
	if (Number.isNaN(id)) return json({ error: 'Invalid id' }, { status: 400 });
	if (type === 'mentor') {
		const [row] = await db.select().from(mentor).where(eq(mentor.id, id)).limit(1);
		if (!row) return json({ error: 'Not found' }, { status: 404 });
		return json(row);
	}
	if (type === 'program') {
		const [p] = await db.select().from(program).where(eq(program.id, id)).limit(1);
		if (!p) return json({ error: 'Not found' }, { status: 404 });
		const locales = await db
			.select()
			.from(programLocale)
			.where(eq(programLocale.programId, id));
		const sections = await db
			.select()
			.from(programSection)
			.where(eq(programSection.programId, id))
			.orderBy(asc(programSection.sortOrder), asc(programSection.section));
		const mentorLinks = await db
			.select({ mentorId: programMentor.mentorId })
			.from(programMentor)
			.where(eq(programMentor.programId, id));
		return json({
			program: p,
			locales,
			mentorIds: mentorLinks.map((l) => l.mentorId),
			sections: sections.map((r) => ({
				section: r.section,
				locale: r.locale,
				sortOrder: r.sortOrder,
				payload: r.payload
			}))
		});
	}
	if (type === 'blog') {
		const [row] = await db.select().from(blogPost).where(eq(blogPost.id, id)).limit(1);
		if (!row) return json({ error: 'Not found' }, { status: 404 });
		return json(row);
	}
	return json({ error: 'Unknown type' }, { status: 400 });
};

/** PATCH body: { type, id?, page?, section?, locale?, payload } */
export const PATCH: RequestHandler = async (event) => {
	let body: {
		type: CmsType;
		id?: number;
		programId?: number;
		page?: string;
		section?: string;
		locale?: string;
		payload: Record<string, unknown>;
	};
	try {
		body = await event.request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}
	const { type, payload } = body;
	if (!type || !payload || typeof payload !== 'object') {
		return json({ error: 'type and payload required' }, { status: 400 });
	}
	const userId = event.locals.user?.id ?? null;

	if (type === 'mentor' && typeof body.id === 'number') {
		requirePermission(event, 'mentors.edit');
		const [beforeRow] = await db.select().from(mentor).where(eq(mentor.id, body.id)).limit(1);
		const allowed = [
			'nameRo', 'nameEn', 'titleRo', 'titleEn', 'bioRo', 'bioEn',
			'image', 'yearJoined', 'location', 'status'
		];
		const set: Record<string, unknown> = { updatedAt: new Date(), updatedBy: userId };
		for (const k of allowed) {
			if (k in payload) set[k] = payload[k];
		}
		await db.update(mentor).set(set as Record<string, unknown>).where(eq(mentor.id, body.id));
		const [afterRow] = await db.select().from(mentor).where(eq(mentor.id, body.id)).limit(1);
		await db.insert(cmsAuditLog).values({
			entityType: 'mentor',
			entityId: String(body.id),
			userId: userId ?? undefined,
			userName: getUserName(event.locals.user as { name?: string; email?: string } | null),
			action: beforeRow ? 'update' : 'create',
			payloadBefore: beforeRow ? (beforeRow as Record<string, unknown>) : null,
			payloadAfter: afterRow ? (afterRow as Record<string, unknown>) : null
		});
		return json({ success: true });
	}

	if (type === 'program' && typeof body.id === 'number') {
		requirePermission(event, 'programs.edit');
		const [programBefore] = await db.select().from(program).where(eq(program.id, body.id)).limit(1);
		const localesBefore = await db.select().from(programLocale).where(eq(programLocale.programId, body.id));
		const programAllowed = ['slug', 'categoryId', 'image', 'videoUrl', 'badge', 'sortOrder', 'location', 'status'];
		const set: Record<string, unknown> = { updatedAt: new Date(), updatedBy: userId };
		for (const k of programAllowed) {
			if (k in payload) set[k] = payload[k];
		}
		await db.update(program).set(set as Record<string, unknown>).where(eq(program.id, body.id));
		const localePayload = payload.locales as Record<string, Record<string, unknown>> | undefined;
		if (localePayload && typeof localePayload === 'object') {
			for (const [locale, fields] of Object.entries(localePayload)) {
				const row = await db
					.select()
					.from(programLocale)
					.where(
						and(
							eq(programLocale.programId, body.id),
							eq(programLocale.locale, locale)
						)
					)
					.limit(1);
				const allowed = ['title', 'subtitle', 'description', 'ageRange', 'datesText', 'durationText', 'locationText'];
				const toSet: Record<string, unknown> = {};
				for (const k of allowed) {
					if (fields && k in fields) toSet[k] = fields[k];
				}
				if (Object.keys(toSet).length > 0) {
					if (row[0]) {
						await db
							.update(programLocale)
							.set(toSet)
							.where(eq(programLocale.id, row[0].id));
					} else {
						await db.insert(programLocale).values({
							programId: body.id,
							locale,
							title: (toSet.title as string) ?? '',
							subtitle: (toSet.subtitle as string) ?? null,
							description: (toSet.description as string) ?? null,
							ageRange: (toSet.ageRange as string) ?? null,
							datesText: (toSet.datesText as string) ?? null,
							durationText: (toSet.durationText as string) ?? null,
							locationText: (toSet.locationText as string) ?? null
						});
					}
				}
			}
		}
		const sectionsBefore = await db
			.select()
			.from(programSection)
			.where(eq(programSection.programId, body.id))
			.orderBy(asc(programSection.sortOrder));
		const sectionsPayload = payload.sections as Array<{
			section: string;
			locale: string;
			sortOrder?: number;
			payload: Record<string, unknown>;
		}> | undefined;
		if (Array.isArray(sectionsPayload)) {
			await db.delete(programSection).where(eq(programSection.programId, body.id));
			for (const s of sectionsPayload) {
				if (!s || typeof s.section !== 'string' || typeof s.locale !== 'string') continue;
				const sectionPayload = s.payload && typeof s.payload === 'object' ? (s.payload as Record<string, unknown>) : {};
				const validation = validateProgramSectionPayload(s.section, sectionPayload);
				if (!validation.ok) {
					return json({ error: `Secțiune ${s.section}: ${validation.error}` }, { status: 400 });
				}
				await db.insert(programSection).values({
					programId: body.id,
					section: s.section,
					locale: s.locale,
					sortOrder: typeof s.sortOrder === 'number' ? s.sortOrder : 0,
					payload: sectionPayload as object,
					updatedBy: userId
				});
			}
		}
		const mentorIdsPayload = payload.mentorIds as number[] | undefined;
		if (Array.isArray(mentorIdsPayload)) {
			await db.delete(programMentor).where(eq(programMentor.programId, body.id));
			const uniqueIds = [...new Set(mentorIdsPayload)].filter((n) => typeof n === 'number' && Number.isInteger(n));
			for (const mentorId of uniqueIds) {
				await db.insert(programMentor).values({
					programId: body.id,
					mentorId
				});
			}
		}
		const [programAfter] = await db.select().from(program).where(eq(program.id, body.id)).limit(1);
		const localesAfter = await db.select().from(programLocale).where(eq(programLocale.programId, body.id));
		const sectionsAfter = await db
			.select()
			.from(programSection)
			.where(eq(programSection.programId, body.id))
			.orderBy(asc(programSection.sortOrder));
		await db.insert(cmsAuditLog).values({
			entityType: 'program',
			entityId: String(body.id),
			userId: userId ?? undefined,
			userName: getUserName(event.locals.user as { name?: string; email?: string } | null),
			action: programBefore ? 'update' : 'create',
			payloadBefore: programBefore
				? ({
						program: programBefore,
						locales: localesBefore,
						sections: sectionsBefore
					} as unknown as Record<string, unknown>)
				: null,
			payloadAfter: programAfter
				? ({
						program: programAfter,
						locales: localesAfter,
						sections: sectionsAfter
					} as unknown as Record<string, unknown>)
				: null
		});
		return json({ success: true });
	}

	if (type === 'program_section' && typeof body.programId === 'number' && body.section) {
		requirePermission(event, 'programs.edit');
		const programId = body.programId;
		const sectionKey = body.section;
		const locale = (body.locale ?? 'ro') as string;
		const [existing] = await db
			.select()
			.from(programSection)
			.where(
				and(
					eq(programSection.programId, programId),
					eq(programSection.section, sectionKey),
					eq(programSection.locale, locale)
				)
			)
			.limit(1);
		if (!existing) return json({ error: 'Program section not found' }, { status: 404 });
		const payloadBefore = existing.payload as Record<string, unknown>;
		const mergedPayload: Record<string, unknown> = { ...payloadBefore, ...payload };
		const validation = validateProgramSectionPayload(sectionKey, mergedPayload);
		if (!validation.ok) return json({ error: validation.error }, { status: 400 });
		await db
			.update(programSection)
			.set({
				payload: mergedPayload as object,
				updatedBy: userId,
				updatedAt: new Date()
			})
			.where(eq(programSection.id, existing.id));
		await db.insert(cmsAuditLog).values({
			entityType: 'program_section',
			entityId: `${programId}:${sectionKey}:${locale}`,
			userId: userId ?? undefined,
			userName: getUserName(event.locals.user as { name?: string; email?: string } | null),
			action: 'update',
			payloadBefore: payloadBefore ?? undefined,
			payloadAfter: mergedPayload
		});
		return json({ success: true });
	}

	if (type === 'blog' && typeof body.id === 'number') {
		const [beforeRow] = await db.select().from(blogPost).where(eq(blogPost.id, body.id)).limit(1);
		if (!beforeRow) return json({ error: 'Not found' }, { status: 404 });
		const allowed = ['title', 'excerpt', 'body', 'featuredImage', 'slug', 'status'];
		const set: Record<string, unknown> = { updatedAt: new Date(), updatedBy: userId };
		for (const k of allowed) {
			if (k in payload && payload[k] !== undefined) set[k] = payload[k];
		}
		await db.update(blogPost).set(set as Record<string, unknown>).where(eq(blogPost.id, body.id));
		const [afterRow] = await db.select().from(blogPost).where(eq(blogPost.id, body.id)).limit(1);
		await db.insert(cmsAuditLog).values({
			entityType: 'blog_post',
			entityId: String(body.id),
			userId: userId ?? undefined,
			userName: getUserName(event.locals.user as { name?: string; email?: string } | null),
			action: 'update',
			payloadBefore: beforeRow as unknown as Record<string, unknown>,
			payloadAfter: afterRow ? (afterRow as unknown as Record<string, unknown>) : null
		});
		return json({ success: true });
	}

	if (type === 'section' && body.page && body.section) {
		requirePermission(event, 'pages.edit');
		const locale = body.locale ?? 'ro';
		const entityId = `${body.page}:${body.section}:${locale}`;
		const [existing] = await db
			.select()
			.from(siteSection)
			.where(
				and(
					eq(siteSection.page, body.page),
					eq(siteSection.section, body.section),
					eq(siteSection.locale, locale)
				)
			)
			.limit(1);
		const payloadBefore = existing ? (existing.payload as Record<string, unknown>) : null;
		const mergedPayload: Record<string, unknown> = payloadBefore
			? { ...payloadBefore, ...payload }
			: { ...payload };
		await db
			.insert(siteSection)
			.values({
				page: body.page,
				section: body.section,
				locale,
				payload: mergedPayload as object,
				updatedBy: userId
			})
			.onConflictDoUpdate({
				target: [siteSection.page, siteSection.section, siteSection.locale],
				set: { payload: mergedPayload as object, updatedBy: userId, updatedAt: new Date() }
			});
		await db.insert(cmsAuditLog).values({
			entityType: 'site_section',
			entityId,
			userId: userId ?? undefined,
			userName: getUserName(event.locals.user as { name?: string; email?: string } | null),
			action: existing ? 'update' : 'create',
			payloadBefore: payloadBefore ?? undefined,
			payloadAfter: mergedPayload
		});
		return json({ success: true });
	}

	if (type === 'hero' && body.locale) {
		requirePermission(event, 'pages.edit');
		const locale = body.locale as string;
		const [existing] = await db.select().from(heroSettings).where(eq(heroSettings.locale, locale)).limit(1);
		const allowed = ['videoUrl', 'posterUrl', 'ctaPrimaryLabel', 'ctaPrimaryLink', 'ctaSecondaryLabel', 'ctaSecondaryLink'] as const;
		const merged = {
			videoUrl: (payload.videoUrl as string | undefined) ?? existing?.videoUrl ?? '',
			posterUrl: (payload.posterUrl as string | null | undefined) ?? existing?.posterUrl ?? null,
			ctaPrimaryLabel: (payload.ctaPrimaryLabel as string | null | undefined) ?? existing?.ctaPrimaryLabel ?? null,
			ctaPrimaryLink: (payload.ctaPrimaryLink as string | null | undefined) ?? existing?.ctaPrimaryLink ?? null,
			ctaSecondaryLabel: (payload.ctaSecondaryLabel as string | null | undefined) ?? existing?.ctaSecondaryLabel ?? null,
			ctaSecondaryLink: (payload.ctaSecondaryLink as string | null | undefined) ?? existing?.ctaSecondaryLink ?? null
		};
		await db
			.insert(heroSettings)
			.values({
				locale,
				videoUrl: merged.videoUrl,
				posterUrl: merged.posterUrl,
				ctaPrimaryLabel: merged.ctaPrimaryLabel,
				ctaPrimaryLink: merged.ctaPrimaryLink,
				ctaSecondaryLabel: merged.ctaSecondaryLabel,
				ctaSecondaryLink: merged.ctaSecondaryLink,
				updatedBy: userId
			})
			.onConflictDoUpdate({
				target: heroSettings.locale,
				set: {
					videoUrl: merged.videoUrl,
					posterUrl: merged.posterUrl,
					ctaPrimaryLabel: merged.ctaPrimaryLabel,
					ctaPrimaryLink: merged.ctaPrimaryLink,
					ctaSecondaryLabel: merged.ctaSecondaryLabel,
					ctaSecondaryLink: merged.ctaSecondaryLink,
					updatedBy: userId,
					updatedAt: new Date()
				}
			});
		await db.insert(cmsAuditLog).values({
			entityType: 'hero_settings',
			entityId: locale,
			userId: userId ?? undefined,
			userName: getUserName(event.locals.user as { name?: string; email?: string } | null),
			action: existing ? 'update' : 'create',
			payloadBefore: existing ? (existing as unknown as Record<string, unknown>) : undefined,
			payloadAfter: merged as unknown as Record<string, unknown>
		});
		return json({ success: true });
	}

	return json({ error: 'Missing id or page/section' }, { status: 400 });
}
