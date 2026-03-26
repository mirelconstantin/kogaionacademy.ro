import { getLocale } from '$lib/paraglide/runtime';
import { getHeroSettings, getPageSections, getPrograms } from '$lib/server/content';
import type { Locale } from '$lib/server/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const locale = getLocale() as Locale;
	const [sections, heroRow, programs] = await Promise.all([
		getPageSections('about', locale),
		getHeroSettings(locale),
		getPrograms(locale)
	]);
	const hero = heroRow
		? {
				videoUrl: heroRow.videoUrl ?? undefined,
				posterUrl: heroRow.posterUrl ?? undefined,
				ctaPrimaryLabel: heroRow.ctaPrimaryLabel ?? undefined,
				ctaPrimaryLink: heroRow.ctaPrimaryLink ?? undefined,
				ctaSecondaryLabel: heroRow.ctaSecondaryLabel ?? undefined,
				ctaSecondaryLink: heroRow.ctaSecondaryLink ?? undefined
			}
		: null;
	return {
		sections,
		hero,
		programs: programs.slice(0, 4),
		canonicalUrl: url.href.split(/[?#]/)[0] ?? url.href,
		baseUrl: url.origin
	};
};
