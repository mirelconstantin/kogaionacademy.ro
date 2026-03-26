import { db } from '$lib/server/db';
import { blogPost, program, cmsAuditLog, adminInvite, session, user } from '$lib/server/db/schema';
import { requirePermission } from '$lib/server/permissions';
import { eq, and, gte, gt, lte, sql, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'dashboard.view');

	const now = new Date();
	const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	const [draftCount] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(blogPost)
		.where(eq(blogPost.status, 'draft'));
	const [publishedCount] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(blogPost)
		.where(eq(blogPost.status, 'published'));
	const [scheduledCount] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(blogPost)
		.where(eq(blogPost.status, 'scheduled'));
	const [publishedLast24h] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(blogPost)
		.where(and(eq(blogPost.status, 'published'), gte(blogPost.publishedAt, yesterday)));
	const [programCount] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(program)
		.where(eq(program.status, 'published'));
	const [programDraftCount] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(program)
		.where(eq(program.status, 'draft'));
	const [changes24h] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(cmsAuditLog)
		.where(gte(cmsAuditLog.changedAt, yesterday));
	const [pendingInvitesCount] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(adminInvite)
		.where(and(eq(adminInvite.status, 'pending'), gt(adminInvite.expiresAt, now)));

	const withMissingImage = await db
		.select({ id: blogPost.id, title: blogPost.title, featuredImage: blogPost.featuredImage })
		.from(blogPost)
		.where(eq(blogPost.status, 'draft'));
	const needsImage = withMissingImage.filter((r) => !r.featuredImage?.trim());

	const expiredInvites = await db
		.select({ id: adminInvite.id, email: adminInvite.email })
		.from(adminInvite)
		.where(and(eq(adminInvite.status, 'pending'), lte(adminInvite.expiresAt, now)));

	const activeSessionRows = await db
		.select({ userId: session.userId })
		.from(session)
		.where(gt(session.expiresAt, now));
	const activeUserIds = [...new Set(activeSessionRows.map((s) => s.userId))];

	let activeAdminUsers = 0;
	if (activeUserIds.length > 0) {
		const adminRoles = ['super_admin', 'content_admin', 'page_editor', 'blog_editor', 'admin', 'editor'];
		const activeUsers = await db
			.select({ id: user.id, role: user.role, email: user.email })
			.from(user)
			.where(inArray(user.id, activeUserIds));
		activeAdminUsers = activeUsers.filter((u) => adminRoles.includes(u.role)).length;
	}

	let activeSiteUsers = 0;
	try {
		const response = await event.fetch('/api/active-users');
		if (response.ok) {
			const payload = (await response.json()) as { count?: unknown };
			activeSiteUsers = typeof payload.count === 'number' ? payload.count : 0;
		}
	} catch {
		activeSiteUsers = 0;
	}

	return {
		kpi: {
			draftPosts: draftCount?.count ?? 0,
			publishedPosts: publishedCount?.count ?? 0,
			scheduledPosts: scheduledCount?.count ?? 0,
			publishedLast24h: publishedLast24h?.count ?? 0,
			programsCount: programCount?.count ?? 0,
			programDrafts: programDraftCount?.count ?? 0,
			changes24h: changes24h?.count ?? 0,
			pendingInvites: pendingInvitesCount?.count ?? 0,
			activeSiteUsers,
			activeLoggedUsers: activeUserIds.length,
			activeAdminUsers
		},
		needsAttention: {
			draftsWithoutImage: needsImage,
			expiredInvites
		}
	};
};
