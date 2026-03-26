import { db } from '$lib/server/db';
import {
	heroSettings,
	contactSettings,
	siteSection,
	program,
	programLocale,
	programSection,
	programMentor,
	mentor
} from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import type { ProgramSectionRow } from './program-sections';

export type Locale = 'ro' | 'en';

/**
 * Get hero settings for a locale. Returns null if not found (use fallbacks in UI).
 */
export async function getHeroSettings(locale: Locale) {
	try {
		const [row] = await db
			.select()
			.from(heroSettings)
			.where(eq(heroSettings.locale, locale))
			.limit(1);
		return row ?? null;
	} catch {
		return null;
	}
}

/**
 * Get contact settings for a locale. Returns null if not found.
 */
export async function getContactSettings(locale: Locale) {
	try {
		const [row] = await db
			.select()
			.from(contactSettings)
			.where(eq(contactSettings.locale, locale))
			.limit(1);
		return row ?? null;
	} catch {
		return null;
	}
}

/**
 * Get a single site section payload for page/section/locale. Returns null if not found.
 */
export async function getSectionPayload(
	page: string,
	section: string,
	locale: Locale
): Promise<Record<string, unknown> | null> {
	try {
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
		return row ? (row.payload as Record<string, unknown>) : null;
	} catch {
		return null;
	}
}

/**
 * Get all sections for a page and locale. Returns a map of section key -> payload.
 */
export async function getPageSections(
	page: string,
	locale: Locale
): Promise<Record<string, Record<string, unknown>>> {
	try {
		const rows = await db
			.select()
			.from(siteSection)
			.where(and(eq(siteSection.page, page), eq(siteSection.locale, locale)));
		const map: Record<string, Record<string, unknown>> = {};
		for (const r of rows) {
			map[r.section] = r.payload as Record<string, unknown>;
		}
		return map;
	} catch {
		return {};
	}
}

/** DTO for program list/detail with locale-resolved text (RO first, EN fallback). */
export type ProgramForDisplay = {
	id: number;
	slug: string;
	categoryId: string;
	image: string | null;
	videoUrl: string | null;
	badge: 'early_bird' | 'new' | null;
	sortOrder: number;
	location: string | null;
	startDate: string | null;
	endDate: string | null;
	title: string;
	subtitle: string | null;
	description: string | null;
	ageRange: string | null;
	datesText: string | null;
	durationText: string | null;
	locationText: string | null;
	publishedAt: Date | null;
	updatedAt: Date;
	mentorIds: number[];
	/** Rich sections for detail page (only loaded for getProgramBySlug when needed). */
	sections?: ProgramSectionRow[];
};

/**
 * Get all section rows for a program and locale, ordered by sortOrder. RO fallback for missing locale.
 */
export async function getProgramSections(
	programId: number,
	locale: Locale
): Promise<ProgramSectionRow[]> {
	try {
		const ro = await db
			.select()
			.from(programSection)
			.where(and(eq(programSection.programId, programId), eq(programSection.locale, 'ro')))
			.orderBy(asc(programSection.sortOrder));
		const loc = await db
			.select()
			.from(programSection)
			.where(
				and(eq(programSection.programId, programId), eq(programSection.locale, locale))
			)
			.orderBy(asc(programSection.sortOrder));
		const rows = loc.length > 0 ? loc : ro;
		return rows.map((r) => ({
			section: r.section,
			sortOrder: r.sortOrder,
			payload: r.payload as Record<string, unknown>
		}));
	} catch {
		return [];
	}
}

/**
 * Get all published programs with locale content. EN falls back to RO when missing.
 */
export async function getPrograms(locale: Locale): Promise<ProgramForDisplay[]> {
	try {
		const programs = await db
			.select()
			.from(program)
			.where(eq(program.status, 'published'))
			.orderBy(asc(program.sortOrder), asc(program.id));

		const result: ProgramForDisplay[] = [];
		for (const p of programs) {
			const ro = await db
				.select()
				.from(programLocale)
				.where(and(eq(programLocale.programId, p.id), eq(programLocale.locale, 'ro')))
				.limit(1);
			const loc = await db
				.select()
				.from(programLocale)
				.where(
					and(eq(programLocale.programId, p.id), eq(programLocale.locale, locale))
				)
				.limit(1);
			const localeRow = loc[0] ?? ro[0];
			const mentorLinks = await db
				.select({ mentorId: programMentor.mentorId })
				.from(programMentor)
				.where(eq(programMentor.programId, p.id));
			result.push({
				id: p.id,
				slug: p.slug,
				categoryId: p.categoryId,
				image: p.image,
				videoUrl: p.videoUrl ?? null,
				badge: (p.badge as 'early_bird' | 'new' | null) ?? null,
				sortOrder: p.sortOrder,
				location: p.location,
				startDate: p.startDate,
				endDate: p.endDate,
				title: localeRow?.title ?? p.slug,
				subtitle: localeRow?.subtitle ?? null,
				description: localeRow?.description ?? null,
				ageRange: localeRow?.ageRange ?? null,
				datesText: localeRow?.datesText ?? null,
				durationText: localeRow?.durationText ?? null,
				locationText: localeRow?.locationText ?? null,
				publishedAt: p.publishedAt,
				updatedAt: p.updatedAt,
				mentorIds: mentorLinks.map((l) => l.mentorId)
			});
		}
		return result;
	} catch {
		return [];
	}
}

/**
 * Get one program by slug with locale content and mentor ids. Returns null if not found.
 */
export async function getProgramBySlug(
	slug: string,
	locale: Locale
): Promise<ProgramForDisplay | null> {
	try {
		const [p] = await db.select().from(program).where(eq(program.slug, slug)).limit(1);
		if (!p) return null;

		const ro = await db
			.select()
			.from(programLocale)
			.where(and(eq(programLocale.programId, p.id), eq(programLocale.locale, 'ro')))
			.limit(1);
		const loc = await db
			.select()
			.from(programLocale)
			.where(
				and(eq(programLocale.programId, p.id), eq(programLocale.locale, locale))
			)
			.limit(1);
		const localeRow = loc[0] ?? ro[0];
		const mentorLinks = await db
			.select({ mentorId: programMentor.mentorId })
			.from(programMentor)
			.where(eq(programMentor.programId, p.id));
		const sections = await getProgramSections(p.id, locale);

		return {
			id: p.id,
			slug: p.slug,
			categoryId: p.categoryId,
			image: p.image,
			videoUrl: p.videoUrl ?? null,
			badge: (p.badge as 'early_bird' | 'new' | null) ?? null,
			sortOrder: p.sortOrder,
			location: p.location,
			startDate: p.startDate,
			endDate: p.endDate,
			title: localeRow?.title ?? p.slug,
			subtitle: localeRow?.subtitle ?? null,
			description: localeRow?.description ?? null,
			ageRange: localeRow?.ageRange ?? null,
			datesText: localeRow?.datesText ?? null,
			durationText: localeRow?.durationText ?? null,
			locationText: localeRow?.locationText ?? null,
			publishedAt: p.publishedAt,
			updatedAt: p.updatedAt,
			mentorIds: mentorLinks.map((l) => l.mentorId),
			sections
		};
	} catch {
		return null;
	}
}

/** DTO for mentor list/detail with locale-resolved fields. */
export type MentorForDisplay = {
	id: number;
	slug: string;
	name: string;
	title: string;
	bio: string;
	image: string | null;
	yearJoined: number | null;
	sortOrder: number;
	location: string | null;
	publishedAt: Date | null;
	updatedAt: Date;
};

function sanitizeMentorBio(bio: string, yearJoined: number | null): string {
	if (!bio) return '';
	const normalized = bio.replace(/\r\n/g, '\n');
	const cleaned = normalized
		.replace(/\bDin\s+\d{4},\s*/gi, '')
		.replace(/\b(?:începând|incepand)\s+cu\s+anul\s+\d{4},?\s*/gi, '')
		.replace(/\bdin\s+anul\s+\d{4}\b/gi, '')
		.replace(/\b(?:este|e)\s+mentor[^.\n!?]*[.\n!?]?/gi, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
	void yearJoined;
	return cleaned || normalized.trim();
}

/**
 * Get all published mentors with locale content (RO first, EN fallback).
 */
export async function getMentors(locale: Locale): Promise<MentorForDisplay[]> {
	try {
		const rows = await db
			.select()
			.from(mentor)
			.where(eq(mentor.status, 'published'))
			.orderBy(asc(mentor.sortOrder), asc(mentor.id));
		return rows.map((r) => ({
			id: r.id,
			slug: r.slug,
			name: locale === 'ro' ? r.nameRo : (r.nameEn ?? r.nameRo),
			title: locale === 'ro' ? r.titleRo : (r.titleEn ?? r.titleRo),
			bio: sanitizeMentorBio(locale === 'ro' ? r.bioRo : (r.bioEn ?? r.bioRo), r.yearJoined),
			image: r.image,
			yearJoined: r.yearJoined,
			sortOrder: r.sortOrder,
			location: r.location,
			publishedAt: r.publishedAt,
			updatedAt: r.updatedAt
		}));
	} catch {
		return [];
	}
}

/**
 * Get one mentor by slug. Returns null if not found.
 */
export async function getMentorBySlug(
	slug: string,
	locale: Locale
): Promise<MentorForDisplay | null> {
	try {
		const [r] = await db.select().from(mentor).where(eq(mentor.slug, slug)).limit(1);
		if (!r) return null;
		return {
			id: r.id,
			slug: r.slug,
			name: locale === 'ro' ? r.nameRo : (r.nameEn ?? r.nameRo),
			title: locale === 'ro' ? r.titleRo : (r.titleEn ?? r.titleRo),
			bio: sanitizeMentorBio(locale === 'ro' ? r.bioRo : (r.bioEn ?? r.bioRo), r.yearJoined),
			image: r.image,
			yearJoined: r.yearJoined,
			sortOrder: r.sortOrder,
			location: r.location,
			publishedAt: r.publishedAt,
			updatedAt: r.updatedAt
		};
	} catch {
		return null;
	}
}
