import { redirect } from '@sveltejs/kit';
import { isProgramPubliclyOpen } from '$lib/program-availability';
import { getProgramBySlug, getMentors } from '$lib/server/content';
import { programCategories } from '$lib/programs-data';
import type { MentorForDisplay } from '$lib/server/content';
import type { PageServerLoad } from './$types';

/** Programs area is RO-only for now; content always loaded in Romanian. */
const PROGRAMS_LOCALE = 'ro' as const;

export const load: PageServerLoad = async ({ params, url }) => {
	const program = await getProgramBySlug(params.slug, PROGRAMS_LOCALE);
	if (!program) {
		const programsPath = url.pathname.replace(/\/[^/]+$/, '') || '/programe';
		redirect(302, programsPath);
	}
	if (!isProgramPubliclyOpen(params.slug)) {
		const programsPath = url.pathname.replace(/\/[^/]+$/, '') || '/programe';
		redirect(302, programsPath);
	}
	const allMentors = await getMentors(PROGRAMS_LOCALE);
	const mentors: MentorForDisplay[] = program.mentorIds
		.map((id) => allMentors.find((m) => m.id === id))
		.filter((m): m is MentorForDisplay => m != null);
	const canonicalUrl = `${url.origin}${url.pathname}`;
	const baseUrl = url.origin;
	return {
		program,
		programCategories,
		mentors,
		canonicalUrl,
		baseUrl
	};
};
