import { db } from '$lib/server/db';
import { blogPost } from '$lib/server/db/schema';
import { isSlugFormat, slugify } from '$lib/utils';
import { error, fail, redirect } from '@sveltejs/kit';
import { requirePermission } from '$lib/server/permissions';
import { and, eq, isNull, ne } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'blog.view');
	const id = parseInt(event.params.id, 10);
	if (Number.isNaN(id)) throw error(404, 'Not found');
	const [post] = await db
		.select()
		.from(blogPost)
		.where(and(eq(blogPost.id, id), isNull(blogPost.deletedAt)))
		.limit(1);
	if (!post) throw error(404, 'Articol negăsit');
	return { post };
};

export const actions: Actions = {
	save: async (event) => {
		requirePermission(event, 'blog.edit');
		const id = parseInt(event.params.id, 10);
		if (Number.isNaN(id)) return fail(400, { error: 'ID invalid' });
		const form = await event.request.formData();
		const title = form.get('title')?.toString()?.trim();
		const slug = form.get('slug')?.toString()?.trim();
		const excerpt = form.get('excerpt')?.toString()?.trim() || null;
		const body = form.get('body')?.toString() ?? '';
		const status = (form.get('status')?.toString() as 'draft' | 'scheduled' | 'published') || 'draft';
		const featuredImage = form.get('featuredImage')?.toString()?.trim() || null;
		const publishedAt = form.get('publishedAt')?.toString() ? new Date(form.get('publishedAt') as string) : null;
		const scheduledFor = form.get('scheduledFor')?.toString() ? new Date(form.get('scheduledFor') as string) : null;

		if (!title || !slug) return fail(400, { error: 'Titlul și slug-ul sunt obligatorii.' });

		const normalizedSlug = slugify(slug);
		if (!normalizedSlug || !isSlugFormat(normalizedSlug)) {
			return fail(400, { error: 'Slug-ul poate conține doar litere mici, cifre și cratimă.' });
		}
		const [existing] = await db
			.select({ id: blogPost.id })
			.from(blogPost)
			.where(and(eq(blogPost.slug, normalizedSlug), ne(blogPost.id, id)))
			.limit(1);
		if (existing) return fail(400, { error: `Slug-ul "${normalizedSlug}" este deja folosit. Alege altul.` });

		const userId = event.locals.user?.id ?? null;
		await db
			.update(blogPost)
			.set({
				title,
				slug: normalizedSlug,
				excerpt,
				body,
				status,
				featuredImage,
				publishedAt: status === 'published' ? publishedAt ?? new Date() : null,
				scheduledFor: status === 'scheduled' ? scheduledFor : null,
				updatedAt: new Date(),
				updatedBy: userId != null ? String(userId) : null
			})
			.where(eq(blogPost.id, id));
		return { success: true };
	},
	delete: async (event) => {
		requirePermission(event, 'blog.edit');
		const id = parseInt(event.params.id, 10);
		if (Number.isNaN(id)) return fail(400, { error: 'ID invalid', action: 'delete' });
		const userId = event.locals.user?.id ?? null;
		try {
			await db
				.update(blogPost)
				.set({
					deletedAt: new Date(),
					deletedBy: userId != null ? String(userId) : null
				})
				.where(eq(blogPost.id, id));
		} catch (e) {
			console.error('Blog delete error:', e);
			return fail(500, { error: 'Nu s-a putut șterge articolul', action: 'delete' });
		}
		redirect(303, '/admin/blog');
	}
};
