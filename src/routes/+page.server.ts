import { getLocale } from '$lib/paraglide/runtime';
import {
	getHeroSettings,
	getMentors,
	getPageSections,
	getPrograms
} from '$lib/server/content';
import type { Locale } from '$lib/server/content';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { blogPost } from '$lib/server/db/schema';
import { and, desc, eq, isNotNull, isNull, lte, or } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const locale = getLocale() as Locale;
	const now = new Date();
	const [hero, mentors, sections, aboutSections, programs, posts] = await Promise.all([
		getHeroSettings(locale),
		getMentors(locale),
		getPageSections('home', locale),
		getPageSections('about', locale),
		getPrograms(locale),
		db
			.select({
				id: blogPost.id,
				slug: blogPost.slug,
				title: blogPost.title,
				excerpt: blogPost.excerpt,
				featuredImage: blogPost.featuredImage,
				publishedAt: blogPost.publishedAt
			})
			.from(blogPost)
			.where(
				or(
					and(
						eq(blogPost.status, 'published'),
						or(isNull(blogPost.publishedAt), lte(blogPost.publishedAt, now))
					),
					and(
						eq(blogPost.status, 'scheduled'),
						isNotNull(blogPost.scheduledFor),
						lte(blogPost.scheduledFor, now)
					)
				)
			)
			.orderBy(desc(blogPost.publishedAt))
			.limit(3)
	]);
	return {
		hero: hero
			? {
					videoUrl: hero.videoUrl,
					posterUrl: hero.posterUrl ?? undefined,
					ctaPrimaryLabel: hero.ctaPrimaryLabel ?? undefined,
					ctaPrimaryLink: hero.ctaPrimaryLink ?? undefined,
					ctaSecondaryLabel: hero.ctaSecondaryLabel ?? undefined,
					ctaSecondaryLink: hero.ctaSecondaryLink ?? undefined
				}
			: null,
		mentors: mentors.slice(0, 4),
		programs: programs.slice(0, 6),
		posts: posts ?? [],
		/** Secțiuni din DB - fallback la m() în UI */
		sections,
		aboutSections
	};
};
