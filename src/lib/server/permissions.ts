import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { userPermissionOverride, user as userTable } from '$lib/server/db/schema';
import {
	PERMISSION_KEYS,
	computeEffectivePermissions,
	getRolePermissionSet,
	type PermissionKey
} from '$lib/server/permissions-model';

export const EDITOR_ROLE = 'editor';
export const SUPER_ADMIN_EMAIL = 'pazalgroup@gmail.com';

export type UserWithRole = {
	id: string;
	name: string;
	email: string;
	image?: string | null;
	role?: string;
};

/**
 * Returns true if the current user is editor, admin, or super admin (pazalgroup@gmail.com).
 */
export function isEditor(user: unknown): user is UserWithRole {
	const u = user as UserWithRole | undefined;
	if (!u) return false;
	return u.email === SUPER_ADMIN_EMAIL || u.role === EDITOR_ROLE || u.role === 'admin' || u.role === 'super_admin';
}

/**
 * Resolve effective permissions for a user (role + overrides from DB).
 * Super admin email gets all permissions. Otherwise: effective = (role ∪ allow) ∖ deny.
 */
export async function resolveUserPermissions(user: UserWithRole): Promise<Set<PermissionKey>> {
	if (user.email === SUPER_ADMIN_EMAIL) {
		// Keep DB canonical for the super admin account.
		if (user.role !== 'super_admin') {
			await db
				.update(userTable)
				.set({ role: 'super_admin', updatedAt: new Date() })
				.where(eq(userTable.id, user.id));
		}
		return new Set(PERMISSION_KEYS);
	}
	const roleSet = getRolePermissionSet(user.role ?? 'user');
	const allow = new Set<PermissionKey>();
	const deny = new Set<PermissionKey>();
	const rows = await db
		.select({ permissionKey: userPermissionOverride.permissionKey, mode: userPermissionOverride.mode })
		.from(userPermissionOverride)
		.where(eq(userPermissionOverride.userId, user.id));
	for (const row of rows) {
		const key = row.permissionKey as PermissionKey;
		if (row.mode === 'allow') allow.add(key);
		else if (row.mode === 'deny') deny.add(key);
	}
	return computeEffectivePermissions(roleSet, allow, deny);
}

/** Check if a permission set includes the given key. */
export function hasPermission(permissions: Set<PermissionKey>, key: PermissionKey): boolean {
	return permissions.has(key);
}

/**
 * Requires an authenticated user and the given permission.
 * Redirects to login if not authenticated, to / if no permission.
 */
export function requirePermission(
	event: RequestEvent,
	key: PermissionKey
): asserts event is RequestEvent & {
	locals: {
		user: UserWithRole;
		session: NonNullable<RequestEvent['locals']['session']>;
		permissions: Set<PermissionKey>;
	};
} {
	const { locals } = event;
	if (!locals.session || !locals.user) {
		redirect(302, '/login?callbackURL=' + encodeURIComponent(event.url.pathname));
	}
	const permissions = locals.permissions;
	if (!permissions || !hasPermission(permissions, key)) {
		redirect(302, '/');
	}
}

/**
 * Requires an authenticated user and at least one of the given permissions.
 */
export function requireAnyPermission(
	event: RequestEvent,
	keys: PermissionKey[]
): asserts event is RequestEvent & {
	locals: {
		user: UserWithRole;
		session: NonNullable<RequestEvent['locals']['session']>;
		permissions: Set<PermissionKey>;
	};
} {
	const { locals } = event;
	if (!locals.session || !locals.user) {
		redirect(302, '/login?callbackURL=' + encodeURIComponent(event.url.pathname));
	}
	const permissions = locals.permissions;
	if (!permissions || !keys.some((k) => hasPermission(permissions, k))) {
		redirect(302, '/');
	}
}

/**
 * Requires an authenticated user with editor (or admin) role.
 * Redirects to login if not authenticated, or to home if not an editor.
 * Use in admin layout load or form actions.
 * Compatible with legacy flow: checks dashboard.view when permissions are present, else isEditor.
 */
export function requireEditor(
	event: RequestEvent
): asserts event is RequestEvent & {
	locals: { user: UserWithRole; session: NonNullable<RequestEvent['locals']['session']> };
} {
	const { locals } = event;
	if (!locals.session || !locals.user) {
		redirect(302, '/login?callbackURL=' + encodeURIComponent(event.url.pathname));
	}
	// If permissions were resolved (admin area), require at least dashboard.view
	if (locals.permissions) {
		if (!hasPermission(locals.permissions, 'dashboard.view')) {
			redirect(302, '/');
		}
		return;
	}
	if (!isEditor(locals.user)) {
		redirect(302, '/');
	}
}

/**
 * Safe check for editor role for use in load functions.
 * Returns true if the user is an editor; does not redirect.
 */
export function getIsEditor(event: RequestEvent): boolean {
	return isEditor(event.locals.user);
}
