import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { program, programLocale, programSection, programMentor, mentor } from '$lib/server/db/schema';
import { requirePermission } from '$lib/server/permissions';
import { eq, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'programs.view');
	const id = parseInt(event.params.id, 10);
	if (Number.isNaN(id)) throw error(404, 'Program negăsit');
	const [p] = await db.select().from(program).where(eq(program.id, id)).limit(1);
	if (!p) throw error(404, 'Program negăsit');
	const locales = await db
		.select()
		.from(programLocale)
		.where(eq(programLocale.programId, id));
	const ro = locales.find((l) => l.locale === 'ro');
	const sectionRows = await db
		.select()
		.from(programSection)
		.where(eq(programSection.programId, id))
		.orderBy(asc(programSection.sortOrder), asc(programSection.section));
	/** Programs area is RO-only; only load RO sections for editing. */
	const sections = sectionRows
		.filter((r) => r.locale === 'ro')
		.map((r) => ({
			section: r.section,
			locale: r.locale,
			sortOrder: r.sortOrder,
			payload: r.payload as Record<string, unknown>
		}));
	const mentorLinks = await db
		.select({ mentorId: programMentor.mentorId })
		.from(programMentor)
		.where(eq(programMentor.programId, id));
	const mentorIds = mentorLinks.map((l) => l.mentorId);
	const allMentors = await db
		.select({
			id: mentor.id,
			slug: mentor.slug,
			nameRo: mentor.nameRo,
			nameEn: mentor.nameEn,
			titleRo: mentor.titleRo,
			image: mentor.image
		})
		.from(mentor)
		.where(eq(mentor.status, 'published'))
		.orderBy(asc(mentor.sortOrder), asc(mentor.nameRo));
	return {
		program: {
			id: p.id,
			slug: p.slug,
			categoryId: p.categoryId,
			image: p.image,
			videoUrl: p.videoUrl ?? null,
			badge: p.badge,
			sortOrder: p.sortOrder,
			location: p.location,
			startDate: p.startDate,
			endDate: p.endDate,
			status: p.status
		},
		/** RO-only: single locale for editing. */
		ro: ro
			? {
					title: ro.title,
					subtitle: ro.subtitle,
					description: ro.description,
					ageRange: ro.ageRange,
					datesText: ro.datesText,
					durationText: ro.durationText,
					locationText: ro.locationText
				}
			: null,
		sections,
		mentorIds,
		allMentors
	};
};
