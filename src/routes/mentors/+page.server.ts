import { getLocale } from '$lib/paraglide/runtime';
import { getMentors, getPageSections } from '$lib/server/content';
import type { Locale } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export type { MentorForDisplay } from '$lib/server/content';

export const load: PageServerLoad = async () => {
	const locale = getLocale() as Locale;
	const [mentors, sections] = await Promise.all([
		getMentors(locale),
		getPageSections('mentors', locale)
	]);
	return { mentors, sections };
};
