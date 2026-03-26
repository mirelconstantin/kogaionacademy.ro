import { db } from '$lib/server/db';
import { blogPost } from '$lib/server/db/schema';
import { isSlugFormat, slugify } from '$lib/utils';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { requirePermission } from '$lib/server/permissions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'blog.edit');
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		requirePermission(event, 'blog.edit');
		const form = await event.request.formData();
		const title = form.get('title')?.toString()?.trim();
		const slug = form.get('slug')?.toString()?.trim() || title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';
		const excerpt = form.get('excerpt')?.toString()?.trim() || null;
		const body = form.get('body')?.toString() ?? '';
		const status = (form.get('status')?.toString() as 'draft' | 'scheduled' | 'published') || 'draft';
		const featuredImage = form.get('featuredImage')?.toString()?.trim() || null;
		const publishedAt = form.get('publishedAt')?.toString() ? new Date(form.get('publishedAt') as string) : null;
		const scheduledFor = form.get('scheduledFor')?.toString() ? new Date(form.get('scheduledFor') as string) : null;

		if (!title) return fail(400, { error: 'Titlul este obligatoriu.' });

		const baseSlug =
			(slug?.trim() ? slugify(slug) : null) || slugify(title) || `post-${Date.now()}`;
		if (!isSlugFormat(baseSlug)) {
			return fail(400, { error: 'Slug-ul poate conține doar litere mici, cifre și cratimă.' });
		}
		// Asigură slug unic – verifică existența și adaugă sufix dacă e necesar
		let finalSlug = baseSlug;
		let attempt = 0;
		while (true) {
			const existing = await db.select({ id: blogPost.id }).from(blogPost).where(eq(blogPost.slug, finalSlug)).limit(1);
			if (existing.length === 0) break;
			attempt++;
			finalSlug = `${baseSlug}-${attempt}`;
			if (attempt > 100) return fail(500, { error: 'Nu s-a putut genera un slug unic.' });
		}

		const userId = event.locals.user?.id ?? null;
		try {
			await db.insert(blogPost).values({
				title,
				slug: finalSlug,
				excerpt: excerpt || null,
				body: body || '',
				status,
				featuredImage: featuredImage || null,
				publishedAt: status === 'published' ? publishedAt ?? new Date() : null,
				scheduledFor: status === 'scheduled' ? scheduledFor : null,
				updatedBy: userId != null ? String(userId) : null
			});
		} catch (e) {
			const cause = (e as { cause?: { message?: string } })?.cause;
			const msg = (cause?.message ?? (e instanceof Error ? e.message : String(e)));
			if (msg.includes('unique') || msg.includes('duplicate')) {
				return fail(400, { error: `Slug-ul "${finalSlug}" există deja. Alege altul.` });
			}
			console.error('Blog insert error:', e);
			return fail(500, { error: 'Eroare la salvarea articolului: ' + msg });
		}
		return { success: true };
	}
};
