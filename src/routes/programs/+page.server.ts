import { getPrograms, getPageSections } from '$lib/server/content';
import { programCategories } from '$lib/programs-data';
import type { PageServerLoad } from './$types';

/** Programs area is RO-only for now; content always loaded in Romanian. */
const PROGRAMS_LOCALE = 'ro' as const;
const ALLOWED_AGE_FILTERS = new Set(['3-6', '7-12', '13-18']);

function normalizeAge(value: string | null | undefined): string {
	return (value ?? '').replace(/[–—]/g, '-').replace(/\s+/g, '');
}

export const load: PageServerLoad = async ({ url }) => {
	const [programs, sections] = await Promise.all([
		getPrograms(PROGRAMS_LOCALE),
		getPageSections('programs', PROGRAMS_LOCALE)
	]);

	const requestedAge = normalizeAge(url.searchParams.get('age'));
	const activeAgeFilter = ALLOWED_AGE_FILTERS.has(requestedAge) ? requestedAge : null;
	const filteredPrograms = activeAgeFilter
		? programs.filter((program) => normalizeAge(program.ageRange).includes(activeAgeFilter))
		: programs;

	return {
		programs: filteredPrograms,
		programCategories,
		sections,
		activeAgeFilter,
		canonicalUrl: url.href.split(/[?#]/)[0] ?? url.href,
		baseUrl: url.origin
	};
};
