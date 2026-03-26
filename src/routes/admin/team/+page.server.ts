import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, adminInvite, userPermissionOverride } from '$lib/server/db/schema';
import { requirePermission, SUPER_ADMIN_EMAIL } from '$lib/server/permissions';
import { inArray, eq, desc, and, or } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { ROLES } from '$lib/server/permissions-model';
const ROLE_LABELS: Record<string, string> = {
	super_admin: 'Super Admin',
	content_admin: 'Admin',
	page_editor: 'Page Editor',
	blog_editor: 'Blog Editor'
};

const ADMIN_ROLES = [
	'super_admin',
	'content_admin',
	'page_editor',
	'blog_editor',
	'editor',
	'admin'
] as const;

const INVITE_EXPIRY_DAYS = 7;

function randomToken(): string {
	return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'team.view');
	const currentUserId = event.locals.user?.id ?? '';
	const isCurrentUserSuperAdmin = (event.locals.user?.email ?? '').toLowerCase() === SUPER_ADMIN_EMAIL;
	const adminUsers = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
			role: user.role
		})
		.from(user)
		.where(
			or(
				inArray(user.role, [...ADMIN_ROLES]),
				eq(user.email, SUPER_ADMIN_EMAIL),
				eq(user.id, currentUserId)
			)
		);
	const normalizedAdminUsers = adminUsers.map((u) =>
		u.email === SUPER_ADMIN_EMAIL
			? { ...u, role: 'super_admin' }
			: u.role === 'editor' || u.role === 'admin'
				? { ...u, role: 'content_admin' }
				: u
	);
	const overridesRows = await db.select().from(userPermissionOverride);
	const overridesByUser = new Map<string, { permissionKey: string; mode: string }[]>();
	for (const row of overridesRows) {
		const list = overridesByUser.get(row.userId) ?? [];
		list.push({ permissionKey: row.permissionKey, mode: row.mode });
		overridesByUser.set(row.userId, list);
	}
	const invites = await db
		.select()
		.from(adminInvite)
		.orderBy(desc(adminInvite.createdAt));
	const now = new Date();
	const invitesWithStatus = invites.map((inv) => ({
		...inv,
		effectiveStatus:
			inv.status !== 'pending'
				? inv.status
				: inv.expiresAt < now
					? 'expired'
					: 'pending'
	}));
	return {
		adminUsers: normalizedAdminUsers,
		isCurrentUserSuperAdmin,
		overridesByUser: Object.fromEntries(overridesByUser),
		invites: invitesWithStatus,
		roleOptions: ROLES.map((r) => ({
			value: r,
			label: ROLE_LABELS[r] ?? r.replace(/_/g, ' ')
		}))
	};
};

export const actions: Actions = {
	invite: async (event) => {
		requirePermission(event, 'team.invite');
		if ((event.locals.user?.email ?? '').toLowerCase() !== SUPER_ADMIN_EMAIL) {
			return fail(403, { error: 'Doar Super Admin poate seta roluri.', action: 'invite' });
		}
		const formData = await event.request.formData();
		const email = (formData.get('email') as string)?.trim()?.toLowerCase();
		const role = (formData.get('role') as string)?.trim() || 'blog_editor';
		if (!email) return fail(400, { error: 'Email obligatoriu', action: 'invite' });
		if (!ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) {
			return fail(400, { error: 'Rol invalid', action: 'invite' });
		}
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
		const token = randomToken();
		const userId = event.locals.user?.id ?? null;
		try {
			await db.insert(adminInvite).values({
				email,
				role,
				token,
				status: 'pending',
				expiresAt,
				invitedBy: userId
			});
		} catch (e) {
			const msg = (e as { message?: string })?.message ?? '';
			if (msg.includes('unique') || msg.includes('duplicate')) {
				return fail(400, { error: 'Există deja o invitație pentru acest email', action: 'invite' });
			}
			throw e;
		}
		const hasMailTransport = !!(
			process.env.RESEND_API_KEY ||
			process.env.SMTP_URL ||
			process.env.INVITE_MAIL_TRANSPORT
		);
		if (!hasMailTransport) {
			return {
				success: true,
				warning:
					'Invitația a fost creată, dar email-ul nu a fost trimis (transmiterea de email nu este configurată).',
				action: 'invite'
			};
		}
		return { success: true, action: 'invite' };
	},
	revokeInvite: async (event) => {
		requirePermission(event, 'team.invite');
		const formData = await event.request.formData();
		const id = parseInt(formData.get('id') as string, 10);
		if (Number.isNaN(id)) return fail(400, { error: 'ID invalid', action: 'revokeInvite' });
		await db.update(adminInvite).set({ status: 'revoked' }).where(eq(adminInvite.id, id));
		return { success: true, action: 'revokeInvite' };
	},
	resendInvite: async (event) => {
		requirePermission(event, 'team.invite');
		const formData = await event.request.formData();
		const id = parseInt(formData.get('id') as string, 10);
		if (Number.isNaN(id)) return fail(400, { error: 'ID invalid', action: 'resendInvite' });
		const [inv] = await db.select().from(adminInvite).where(eq(adminInvite.id, id)).limit(1);
		if (!inv || inv.status !== 'pending') return fail(400, { error: 'Invitație invalidă', action: 'resendInvite' });
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
		await db
			.update(adminInvite)
			.set({ token: randomToken(), expiresAt })
			.where(eq(adminInvite.id, id));
		return { success: true, action: 'resendInvite' };
	},
	updateUserRole: async (event) => {
		requirePermission(event, 'team.edit_roles');
		if ((event.locals.user?.email ?? '').toLowerCase() !== SUPER_ADMIN_EMAIL) {
			return fail(403, { error: 'Doar Super Admin poate modifica roluri.', action: 'updateUserRole' });
		}
		const formData = await event.request.formData();
		const userId = (formData.get('userId') as string)?.trim();
		const role = (formData.get('role') as string)?.trim();
		if (!userId) return fail(400, { error: 'userId obligatoriu', action: 'updateUserRole' });
		if (!role || !ROLES.includes(role as (typeof ROLES)[number])) {
			return fail(400, { error: 'Rol invalid', action: 'updateUserRole' });
		}
		const [targetUser] = await db
			.select({ id: user.id, email: user.email })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);
		if (!targetUser) return fail(404, { error: 'Utilizator negăsit', action: 'updateUserRole' });
		if ((targetUser.email ?? '').toLowerCase() === SUPER_ADMIN_EMAIL) {
			return fail(403, { error: 'Rolul Super Admin este blocat.', action: 'updateUserRole' });
		}
		await db.update(user).set({ role }).where(eq(user.id, userId));
		return { success: true, action: 'updateUserRole' };
	},
	setOverride: async (event) => {
		requirePermission(event, 'team.override_permissions');
		const formData = await event.request.formData();
		const targetUserId = (formData.get('userId') as string)?.trim();
		const permissionKey = (formData.get('permissionKey') as string)?.trim();
		const mode = (formData.get('mode') as string)?.trim(); // 'allow' | 'deny' | '' (remove)
		if (!targetUserId || !permissionKey) {
			return fail(400, { error: 'userId și permissionKey obligatorii', action: 'setOverride' });
		}
		if (mode === '') {
			await db
				.delete(userPermissionOverride)
				.where(
					and(
						eq(userPermissionOverride.userId, targetUserId),
						eq(userPermissionOverride.permissionKey, permissionKey)
					)
				);
		} else if (mode === 'allow' || mode === 'deny') {
			await db
				.insert(userPermissionOverride)
				.values({ userId: targetUserId, permissionKey, mode })
				.onConflictDoUpdate({
					target: [userPermissionOverride.userId, userPermissionOverride.permissionKey],
					set: { mode }
				});
		} else {
			return fail(400, { error: 'mode trebuie să fie allow, deny sau gol', action: 'setOverride' });
		}
		return { success: true, action: 'setOverride' };
	}
};
