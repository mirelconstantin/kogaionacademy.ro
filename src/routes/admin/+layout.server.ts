import { contentHref } from '$lib/content-routes';
import { db } from '$lib/server/db';
import { blogPost, program } from '$lib/server/db/schema';
import { requireEditor } from '$lib/server/permissions';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	requireEditor(event);
	const pathname = event.url.pathname;
	const out: {
		user: typeof event.locals.user;
		permissions: string[];
		viewOnSite?: { url: string; label: string };
	} = {
		user: event.locals.user,
		permissions: event.locals.permissions ? Array.from(event.locals.permissions) : []
	};

	const blogMatch = pathname.match(/^\/admin\/blog\/(\d+)$/);
	const programMatch = pathname.match(/^\/admin\/programs\/(\d+)$/);

	if (blogMatch) {
		const id = parseInt(blogMatch[1], 10);
		if (!Number.isNaN(id)) {
			const [post] = await db.select({ slug: blogPost.slug }).from(blogPost).where(eq(blogPost.id, id)).limit(1);
			if (post) {
				const base = contentHref('blog');
				out.viewOnSite = { url: `${base}/${post.slug}`, label: 'Vezi articolul' };
			}
		}
	} else if (programMatch) {
		const id = parseInt(programMatch[1], 10);
		if (!Number.isNaN(id)) {
			const [p] = await db.select({ slug: program.slug }).from(program).where(eq(program.id, id)).limit(1);
			if (p) {
				const base = contentHref('programs');
				out.viewOnSite = { url: `${base}/${p.slug}`, label: 'Vezi programul' };
			}
		}
	}

	return out;
};
