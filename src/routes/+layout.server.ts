import { getLocale } from '$lib/paraglide/runtime';
import { getIsEditor } from '$lib/server/permissions';
import { getContactSettings, getProgramBySlug } from '$lib/server/content';
import { loadLegalPoliciesFromDb } from '$lib/server/legal/policies';
import { renderMarkdownToSafeHtml } from '$lib/server/markdown-safe';
import { db } from '$lib/server/db';
import { blogPost } from '$lib/server/db/schema';
import { and, eq, lte, isNotNull, isNull, or } from 'drizzle-orm';
import type { Locale } from '$lib/server/content';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const locale = getLocale() as Locale;
	const contact = await getContactSettings(locale);
	const u = event.locals.user;
	const socials = (contact?.socials ?? []) as { name: string; url: string }[];
	const contactSocials = socials.filter((s) => s?.url?.trim());

	const pathname = event.url.pathname;
	const segments = pathname.split('/').filter(Boolean);

	const isProgramDetail =
		(segments.includes('programs') || segments.includes('programe')) &&
		segments.length > 1 &&
		segments[segments.length - 1] !== 'programs' &&
		segments[segments.length - 1] !== 'programe';
	let program: { id: number; title: string } | null = null;
	if (isProgramDetail) {
		const slug = segments[segments.length - 1];
		const p = await getProgramBySlug(slug, locale);
		if (p) program = { id: p.id, title: p.title };
	}

	const isBlogDetail = segments.includes('blog') && segments.length > 1 && segments[segments.length - 1] !== 'blog';
	let post: { id: number; title: string } | null = null;
	if (isBlogDetail) {
		const slug = segments[segments.length - 1];
		const now = new Date();
		const [row] = await db
			.select({ id: blogPost.id, title: blogPost.title })
			.from(blogPost)
			.where(
				and(
					eq(blogPost.slug, slug),
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
		if (row) post = { id: row.id, title: row.title };
	}

	const legalPolicies = await loadLegalPoliciesFromDb();
	const consentBanner = {
		title: legalPolicies.consentBannerTitle,
		bodyHtml: renderMarkdownToSafeHtml(legalPolicies.consentBannerBodyMarkdown),
		cookiePolicyHref: '/politica-cookie-uri' as const,
		privacyPolicyHref: '/politica-de-confidentialitate' as const
	};

	return {
		isEditor: getIsEditor(event),
		user: u ? { name: u.name, email: u.email, image: u.image } : null,
		locale,
		contactEmail: contact?.email ?? 'diana@kogaionacademy.ro',
		contactPhone: contact?.phone ?? '0720.529.398',
		contactAddress: contact?.address ?? 'Șoseaua Nordului nr. 94F, Sector 1, București',
		contactSocials,
		program,
		post,
		consentBanner
	};
};
