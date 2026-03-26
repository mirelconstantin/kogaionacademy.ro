import { db } from '$lib/server/db';
import { blogPost, cmsAuditLog } from '$lib/server/db/schema';
import { requirePermission } from '$lib/server/permissions';
import { and, desc, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 20;
const ENTITY_LABELS: Record<string, string> = {
	admin_action: 'Acțiune admin',
	cms: 'CMS',
	media: 'Media',
	media_metadata: 'Metadate media',
	site_section: 'Secțiune pagină',
	site_settings: 'Setări site',
	mentor: 'Mentor',
	program: 'Program',
	program_section: 'Secțiune program',
	hero_settings: 'Setări hero',
	contact_settings: 'Contact',
	blog_post: 'Articol blog'
};

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'history.view');
	const pageNum = Math.max(1, parseInt(event.url.searchParams.get('page') ?? '1', 10) || 1);
	const userName = event.url.searchParams.get('user') ?? '';

	const whereClause = userName ? eq(cmsAuditLog.userName, userName) : undefined;

	const distinctUsers = await db
		.selectDistinct({ userName: cmsAuditLog.userName })
		.from(cmsAuditLog)
		.where(and(isNotNull(cmsAuditLog.userName), ne(cmsAuditLog.userName, '')))
		.orderBy(cmsAuditLog.userName);

	const userOptions = distinctUsers.map((r) => ({
		value: r.userName ?? '',
		label: r.userName ?? '—'
	}));

	const [countResult] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(cmsAuditLog)
		.where(whereClause);
	const total = countResult?.count ?? 0;

	const entries = await db
		.select()
		.from(cmsAuditLog)
		.where(whereClause)
		.orderBy(desc(cmsAuditLog.changedAt))
		.limit(PAGE_SIZE)
		.offset((pageNum - 1) * PAGE_SIZE);

	const blogIdSet = new Set<number>();
	for (const entry of entries) {
		if (entry.entityType === 'blog_post') {
			const id = Number(entry.entityId);
			if (Number.isInteger(id) && id > 0) blogIdSet.add(id);
		}
		const payloadAfter = entry.payloadAfter as Record<string, unknown> | null;
		const pathname = typeof payloadAfter?.pathname === 'string' ? payloadAfter.pathname : null;
		if (!pathname) continue;
		const match = pathname.match(/^\/admin\/blog\/(\d+)(?:\/|$)/);
		if (!match) continue;
		const id = Number(match[1]);
		if (Number.isInteger(id) && id > 0) blogIdSet.add(id);
	}

	const blogTitles: Record<string, string> = {};
	if (blogIdSet.size > 0) {
		const ids = [...blogIdSet];
		const rows = await db
			.select({ id: blogPost.id, title: blogPost.title })
			.from(blogPost)
			.where(inArray(blogPost.id, ids));
		for (const row of rows) {
			blogTitles[String(row.id)] = row.title;
		}
	}

	return {
		entries,
		total,
		page: pageNum,
		pageSize: PAGE_SIZE,
		totalPages: Math.ceil(total / PAGE_SIZE),
		entityLabels: ENTITY_LABELS,
		blogTitles,
		userOptions,
		filters: { userName }
	};
};
