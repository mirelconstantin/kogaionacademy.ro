import { db } from '$lib/server/db';
import { blogPost } from '$lib/server/db/schema';
import { and, desc, eq, gt, lt, lte, isNotNull, isNull, or } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Regula de vizibilitate publică, identică cu lista din `blog/+page.server.ts`:
 * published cu publishedAt <= now (sau null) sau scheduled cu scheduledFor <= now.
 * Draft-urile și articolele șterse soft nu apar niciodată.
 */
function visibleToPublic(now: Date) {
	return and(
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
	);
}

/** Coloane suficiente pentru navigarea „articol anterior / următor". */
const neighbourColumns = {
	id: blogPost.id,
	slug: blogPost.slug,
	title: blogPost.title,
	excerpt: blogPost.excerpt,
	featuredImage: blogPost.featuredImage,
	publishedAt: blogPost.publishedAt
};

export const load: PageServerLoad = async ({ params, url }) => {
	const slug = params.slug;
	if (!slug) throw error(404, 'Not found');
	const now = new Date();
	const [post] = await db
		.select()
		.from(blogPost)
		.where(and(eq(blogPost.slug, slug), visibleToPublic(now)))
		.limit(1);
	if (!post) throw error(404, 'Articol negăsit');

	// Vecinii editoriali se pot ordona cronologic doar dacă data este publicată.
	// Fără publishedAt nu inventăm o ordine: blocul de navigare e pur și simplu omis.
	const [older, newer] = post.publishedAt
		? await Promise.all([
				// Cel mai recent dintre articolele mai vechi.
				db
					.select(neighbourColumns)
					.from(blogPost)
					.where(
						and(
							visibleToPublic(now),
							isNotNull(blogPost.publishedAt),
							lt(blogPost.publishedAt, post.publishedAt)
						)
					)
					.orderBy(desc(blogPost.publishedAt))
					.limit(1),
				// Cel mai apropiat articol mai nou.
				db
					.select(neighbourColumns)
					.from(blogPost)
					.where(
						and(
							visibleToPublic(now),
							isNotNull(blogPost.publishedAt),
							gt(blogPost.publishedAt, post.publishedAt)
						)
					)
					.orderBy(blogPost.publishedAt)
					.limit(1)
			])
		: [[], []];

	return {
		post,
		prevPost: older[0] ?? null,
		nextPost: newer[0] ?? null,
		canonicalUrl: url.href.split(/[?#]/)[0] ?? url.href,
		baseUrl: url.origin
	};
};
