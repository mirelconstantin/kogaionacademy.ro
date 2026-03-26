import { db } from '$lib/server/db';
import { blogPost } from '$lib/server/db/schema';
import { desc, isNull } from 'drizzle-orm';
import { requirePermission } from '$lib/server/permissions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'blog.view');
	const posts = await db
		.select({
			id: blogPost.id,
			slug: blogPost.slug,
			title: blogPost.title,
			status: blogPost.status,
			publishedAt: blogPost.publishedAt,
			scheduledFor: blogPost.scheduledFor,
			createdAt: blogPost.createdAt
		})
		.from(blogPost)
		.where(isNull(blogPost.deletedAt))
		.orderBy(desc(blogPost.createdAt));
	return { posts };
};
