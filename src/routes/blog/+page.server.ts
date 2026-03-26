import { db } from '$lib/server/db';
import { blogPost } from '$lib/server/db/schema';
import { and, eq, lte, desc, isNotNull, isNull, or } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const now = new Date();
	// published: publishedAt <= now (or null, treat as visible)
	// scheduled: scheduledFor <= now (programat care a trecut)
	// draft: never visible; exclude soft-deleted
	const posts = await db
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
			and(
				isNull(blogPost.deletedAt),
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
		)
		.orderBy(desc(blogPost.publishedAt));
	return { posts };
};
