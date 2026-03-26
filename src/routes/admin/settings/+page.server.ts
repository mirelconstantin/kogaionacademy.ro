import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { requirePermission, SUPER_ADMIN_EMAIL } from '$lib/server/permissions';
import { session, user } from '$lib/server/db/schema';
import { and, desc, eq, gt, ne, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'settings.view');
	if (!event.locals.session || !event.locals.user) error(401, 'Neautorizat.');

	const now = new Date();
	const currentUserId = event.locals.user.id;
	const currentSessionId = event.locals.session.id;
	const [currentUser] = await db.select().from(user).where(eq(user.id, currentUserId)).limit(1);
	const roleKey =
		currentUser?.email === SUPER_ADMIN_EMAIL
			? 'super_admin'
			: currentUser?.role === 'editor' || currentUser?.role === 'admin'
				? 'content_admin'
				: (currentUser?.role ?? 'user');
	const roleLabelMap: Record<string, string> = {
		super_admin: 'Super Admin',
		content_admin: 'Admin',
		page_editor: 'Page Editor',
		blog_editor: 'Blog Editor',
		user: 'User'
	};
	const [activeSessions] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(session)
		.where(and(eq(session.userId, currentUserId), gt(session.expiresAt, now)));
	const recentSessions = await db
		.select({
			id: session.id,
			createdAt: session.createdAt,
			expiresAt: session.expiresAt,
			ipAddress: session.ipAddress,
			userAgent: session.userAgent
		})
		.from(session)
		.where(and(eq(session.userId, currentUserId), gt(session.expiresAt, now)))
		.orderBy(desc(session.createdAt))
		.limit(20);

	const normalizedSessions = recentSessions.map((s) => ({
		...s,
		isCurrent: s.id === currentSessionId
	}));

	return {
		account: {
			name: currentUser?.name ?? '',
			email: currentUser?.email ?? '',
			role: roleLabelMap[roleKey] ?? roleKey
		},
		currentSessionId,
		activeSessions: activeSessions?.count ?? 0,
		recentSessions: normalizedSessions
	};
};

export const actions: Actions = {
	updateProfile: async (event) => {
		requirePermission(event, 'settings.edit');
		const formData = await event.request.formData();
		const name = (formData.get('name') as string | null)?.trim() ?? '';
		if (name.length < 2) {
			return fail(400, { error: 'Numele trebuie să aibă cel puțin 2 caractere.' });
		}
		await db
			.update(user)
			.set({ name, updatedAt: new Date() })
			.where(eq(user.id, event.locals.user.id));
		return { success: true, action: 'updateProfile' };
	},
	revokeSession: async (event) => {
		requirePermission(event, 'settings.edit');
		if (!event.locals.session || !event.locals.user) {
			return fail(401, { error: 'Neautorizat.', action: 'revokeSession' });
		}

		const formData = await event.request.formData();
		const targetSessionId = String(formData.get('sessionId') ?? '').trim();
		if (!targetSessionId) {
			return fail(400, { error: 'Sesiune invalidă.', action: 'revokeSession' });
		}
		if (targetSessionId === event.locals.session.id) {
			return fail(400, {
				error: 'Nu poți revoca sesiunea curentă din această listă.',
				action: 'revokeSession'
			});
		}

		await db
			.delete(session)
			.where(and(eq(session.id, targetSessionId), eq(session.userId, event.locals.user.id)));
		return { success: true, action: 'revokeSession' };
	},
	revokeOtherSessions: async (event) => {
		requirePermission(event, 'settings.edit');
		if (!event.locals.session || !event.locals.user) {
			return fail(401, { error: 'Neautorizat.', action: 'revokeOtherSessions' });
		}

		await db
			.delete(session)
			.where(
				and(
					eq(session.userId, event.locals.user.id),
					ne(session.id, event.locals.session.id)
				)
			);
		return { success: true, action: 'revokeOtherSessions' };
	}
};
