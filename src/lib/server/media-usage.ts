import { db } from '$lib/server/db';
import {
	mentor,
	program,
	blogPost,
	heroSettings,
	siteSection,
	programSection,
	programLocale
} from '$lib/server/db/schema';
import { eq, like } from 'drizzle-orm';

const MEDIA_PREFIX = '/media/uploads/';

export type UsageLocation = {
	type: string;
	id: string;
	label: string;
	href: string;
	detail?: string;
};

function isMediaUrl(s: string): boolean {
	return s.startsWith(MEDIA_PREFIX) || s.includes(MEDIA_PREFIX);
}

function collectUrlsFromPayload(obj: unknown, out: Set<string>): void {
	if (obj == null) return;
	if (typeof obj === 'string' && isMediaUrl(obj)) {
		out.add(obj);
		return;
	}
	if (Array.isArray(obj)) {
		for (const item of obj) collectUrlsFromPayload(item, out);
		return;
	}
	if (typeof obj === 'object') {
		for (const v of Object.values(obj)) collectUrlsFromPayload(v, out);
	}
}

function collectMediaPaths(obj: unknown, target: string, prefix = ''): string[] {
	const matches: string[] = [];
	if (obj == null) return matches;

	if (typeof obj === 'string') {
		if (obj === target) matches.push(prefix || 'payload');
		return matches;
	}

	if (Array.isArray(obj)) {
		for (let i = 0; i < obj.length; i += 1) {
			const path = `${prefix}[${i + 1}]`;
			matches.push(...collectMediaPaths(obj[i], target, path));
		}
		return matches;
	}

	if (typeof obj === 'object') {
		for (const [key, value] of Object.entries(obj)) {
			const path = prefix ? `${prefix}.${key}` : key;
			matches.push(...collectMediaPaths(value, target, path));
		}
	}
	return matches;
}

function normalizeDetailPath(path: string): string {
	return path.replace(/^payload\./, '').replace(/\[(\d+)\]/g, '[$1]');
}

/**
 * Returns where a single media URL is referenced (for modal and delete guard).
 */
export async function getMediaUsage(url: string): Promise<{ used: boolean; locations: UsageLocation[] }> {
	const locations: UsageLocation[] = [];

	const norm = url.startsWith('/') ? url : `/${url}`;

	// Mentors
	const mentorsWithImage = await db
		.select({ id: mentor.id, nameRo: mentor.nameRo })
		.from(mentor)
		.where(eq(mentor.image, norm));
	for (const m of mentorsWithImage) {
		locations.push({
			type: 'mentor',
			id: String(m.id),
			label: m.nameRo ?? `Mentor #${m.id}`,
			href: '/admin/mentors',
			detail: 'imagine profil'
		});
	}

	// Programs
	const programsWithImage = await db
		.select({ id: program.id, slug: program.slug })
		.from(program)
		.where(eq(program.image, norm));
	const programIds = new Set(programsWithImage.map((p) => p.id));
	if (programIds.size > 0) {
		const titles = await db
			.select({ programId: programLocale.programId, title: programLocale.title })
			.from(programLocale)
			.where(eq(programLocale.locale, 'ro'));
		const titleByProgramId = new Map(titles.map((t) => [t.programId, t.title]));
		for (const p of programsWithImage) {
			locations.push({
				type: 'program',
				id: String(p.id),
				label: titleByProgramId.get(p.id) ?? p.slug ?? `Program #${p.id}`,
				href: `/admin/programs/${p.id}`,
				detail: 'imagine principală program'
			});
		}
	}

	// Blog (featured + body)
	const postsWithFeatured = await db
		.select({ id: blogPost.id, title: blogPost.title })
		.from(blogPost)
		.where(eq(blogPost.featuredImage, norm));
	for (const p of postsWithFeatured) {
		locations.push({
			type: 'blog',
			id: String(p.id),
			label: p.title ?? `Post #${p.id}`,
			href: `/admin/blog/${p.id}`,
			detail: 'imagine principală articol'
		});
	}
	const postsWithBody = await db
		.select({ id: blogPost.id, title: blogPost.title, body: blogPost.body })
		.from(blogPost)
		.where(like(blogPost.body, `%${norm}%`));
	for (const p of postsWithBody) {
		if (p.body?.includes(norm) && !locations.some((l) => l.type === 'blog' && l.id === String(p.id))) {
			locations.push({
				type: 'blog',
				id: String(p.id),
				label: p.title ?? `Post #${p.id}`,
				href: `/admin/blog/${p.id}`,
				detail: 'conținut articol (body)'
			});
		}
	}

	// Hero
	const heroRows = await db.select().from(heroSettings);
	for (const h of heroRows) {
		if (h.videoUrl === norm || h.posterUrl === norm) {
			locations.push({
				type: 'hero',
				id: h.locale,
				label: `Hero (${h.locale})`,
				href: '/admin/pages/home',
				detail: h.videoUrl === norm ? 'video hero' : 'poster hero'
			});
		}
	}

	// Site sections (payload jsonb)
	const sections = await db.select().from(siteSection);
	for (const s of sections) {
		const urlsInPayload = new Set<string>();
		collectUrlsFromPayload(s.payload, urlsInPayload);
		if (urlsInPayload.has(norm)) {
			const paths = collectMediaPaths(s.payload, norm, 'payload');
			if (paths.length === 0) {
				locations.push({
					type: 'section',
					id: `${s.page}:${s.section}:${s.locale}`,
					label: `Pagina ${s.page} › ${s.section} (${s.locale})`,
					href: `/admin/pages/${s.page}`
				});
			} else {
				for (const path of paths) {
					locations.push({
						type: 'section',
						id: `${s.page}:${s.section}:${s.locale}:${path}`,
						label: `Pagina ${s.page} › ${s.section} (${s.locale})`,
						href: `/admin/pages/${s.page}`,
						detail: normalizeDetailPath(path)
					});
				}
			}
		}
	}

	// Program sections (payload jsonb)
	const progSections = await db.select().from(programSection);
	for (const ps of progSections) {
		const urlsInPayload = new Set<string>();
		collectUrlsFromPayload(ps.payload, urlsInPayload);
		if (urlsInPayload.has(norm)) {
			const paths = collectMediaPaths(ps.payload, norm, 'payload');
			if (paths.length === 0) {
				locations.push({
					type: 'program_section',
					id: `${ps.programId}:${ps.section}:${ps.locale}`,
					label: `Program #${ps.programId} › ${ps.section} (${ps.locale})`,
					href: `/admin/programs/${ps.programId}`
				});
			} else {
				for (const path of paths) {
					locations.push({
						type: 'program_section',
						id: `${ps.programId}:${ps.section}:${ps.locale}:${path}`,
						label: `Program #${ps.programId} › ${ps.section} (${ps.locale})`,
						href: `/admin/programs/${ps.programId}`,
						detail: normalizeDetailPath(path)
					});
				}
			}
		}
	}

	return { used: locations.length > 0, locations };
}

/**
 * Returns the set of all media URLs that are referenced somewhere (for grid badges).
 */
export async function getAllUsedMediaUrls(): Promise<Set<string>> {
	const out = new Set<string>();

	const add = (v: string | null) => {
		if (v && isMediaUrl(v)) out.add(v.startsWith('/') ? v : `/${v}`);
	};

	const mentors = await db.select({ image: mentor.image }).from(mentor);
	mentors.forEach((m) => add(m.image));

	const programs = await db.select({ image: program.image }).from(program);
	programs.forEach((p) => add(p.image));

	const posts = await db.select({ featuredImage: blogPost.featuredImage, body: blogPost.body }).from(blogPost);
	for (const p of posts) {
		add(p.featuredImage);
		if (p.body && p.body.includes(MEDIA_PREFIX)) {
			const matches = p.body.match(/\/media\/uploads\/[^\s"'<>)]+/g);
			matches?.forEach((u) => out.add(u));
		}
	}

	const heroRows = await db.select({ videoUrl: heroSettings.videoUrl, posterUrl: heroSettings.posterUrl }).from(heroSettings);
	for (const h of heroRows) {
		add(h.videoUrl);
		add(h.posterUrl);
	}

	const siteSections = await db.select({ payload: siteSection.payload }).from(siteSection);
	for (const s of siteSections) {
		collectUrlsFromPayload(s.payload, out);
	}

	const progSections = await db.select({ payload: programSection.payload }).from(programSection);
	for (const ps of progSections) {
		collectUrlsFromPayload(ps.payload, out);
	}

	return out;
}
