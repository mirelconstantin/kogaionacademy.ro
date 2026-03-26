import { db } from '$lib/server/db';
import { blogPost } from '$lib/server/db/schema';
import { and, eq, lte, isNotNull, isNull, or } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const slug = params.slug;
	if (!slug) throw error(404, 'Not found');
	const now = new Date();
	const [post] = await db
		.select()
		.from(blogPost)
		.where(
			and(
				eq(blogPost.slug, slug),
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
		.limit(1);
	if (!post) throw error(404, 'Articol negăsit');
	return { post };
};
