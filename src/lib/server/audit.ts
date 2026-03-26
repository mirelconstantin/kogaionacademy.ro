import { db } from '$lib/server/db';
import { cmsAuditLog } from '$lib/server/db/schema';
import type { RequestEvent } from '@sveltejs/kit';

type AuditParams = {
	entityType: string;
	entityId: string;
	userId: string | null;
	userName: string | null;
	action: string;
	payloadBefore?: Record<string, unknown> | null;
	payloadAfter?: Record<string, unknown> | null;
};

export async function logCmsAudit(params: AuditParams): Promise<void> {
	await db.insert(cmsAuditLog).values({
		entityType: params.entityType,
		entityId: params.entityId,
		userId: params.userId ?? undefined,
		userName: params.userName ?? undefined,
		action: params.action,
		payloadBefore: params.payloadBefore ?? undefined,
		payloadAfter: params.payloadAfter ?? undefined
	});
}

export function getUserDisplayName(user: { name?: string; email?: string } | null): string | null {
	if (!user) return null;
	return (user as { name?: string }).name ?? (user as { email?: string }).email ?? null;
}

function shortText(value: string, maxLen = 200): string {
	return value.length > maxLen ? `${value.slice(0, maxLen)}...` : value;
}

function sanitizeSearchParams(searchParams: URLSearchParams): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [key, value] of searchParams.entries()) {
		if (key.toLowerCase().includes('token') || key.toLowerCase().includes('password')) continue;
		out[key] = shortText(value, 400);
	}
	return out;
}

function getFormActionKey(searchParams: URLSearchParams): string | null {
	for (const [key] of searchParams.entries()) {
		if (key.startsWith('/')) return key.slice(1);
	}
	return null;
}

function humanizeActionKey(actionKey: string): string {
	return actionKey
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.trim()
		.toLowerCase();
}

function describeAdminAction(pathname: string, method: string, actionKey: string | null): string {
	if (pathname === '/admin/settings') {
		if (actionKey === 'updateProfile') return 'A actualizat profilul';
		if (actionKey === 'revokeSession') return 'A revocat o sesiune';
		if (actionKey === 'revokeOtherSessions') return 'A revocat toate celelalte sesiuni';
	}
	if (pathname === '/admin/login' || pathname === '/login') {
		if (actionKey === 'signOut') return 'S-a deconectat';
	}
	if (actionKey) return `A executat acțiunea „${humanizeActionKey(actionKey)}”`;
	if (pathname.startsWith('/admin/api/media/upload')) return 'A încărcat fișier media';
	if (pathname.startsWith('/admin/api/media/replace')) return 'A înlocuit un fișier media';
	if (pathname.startsWith('/admin/api/media/delete')) return 'A șters un fișier media';
	if (pathname.startsWith('/admin/api/media/metadata')) return 'A editat metadate media';
	if (pathname.startsWith('/admin/api/contact/socials')) return 'A actualizat linkurile de contact';
	if (pathname.startsWith('/admin/api/cms')) return 'A salvat modificări în CMS';
	if (pathname.includes('/admin/forms') && pathname.includes('/export')) return 'A exportat răspunsuri formular';
	return `${method} ${pathname}`;
}

function classifyAdminAction(pathname: string): { entityType: string; action: string; entityId: string } {
	if (pathname.startsWith('/admin/api/media/upload')) return { entityType: 'media', action: 'upload', entityId: pathname };
	if (pathname.startsWith('/admin/api/media/replace')) return { entityType: 'media', action: 'replace', entityId: pathname };
	if (pathname.startsWith('/admin/api/media/delete')) return { entityType: 'media', action: 'delete', entityId: pathname };
	if (pathname.startsWith('/admin/api/media/metadata')) return { entityType: 'media_metadata', action: 'update', entityId: pathname };
	if (pathname.startsWith('/admin/api/contact/socials')) return { entityType: 'contact_settings', action: 'update', entityId: pathname };
	if (pathname.startsWith('/admin/api/cms')) return { entityType: 'cms', action: 'update', entityId: pathname };
	if (pathname.includes('/admin/forms') && pathname.includes('/export'))
		return { entityType: 'forms_export', action: 'export', entityId: pathname };
	return { entityType: 'admin_action', action: 'execute', entityId: pathname };
}

export async function logAdminRequestAction(
	event: RequestEvent,
	status: number,
	outcome: 'success' | 'error'
): Promise<void> {
	const user = event.locals.user as { id?: string; name?: string; email?: string } | undefined;
	const { pathname, searchParams } = event.url;
	const method = event.request.method.toUpperCase();
	const actionKey = getFormActionKey(searchParams);
	const summary = describeAdminAction(pathname, method, actionKey);

	const base = classifyAdminAction(pathname);
	await logCmsAudit({
		entityType: base.entityType,
		entityId: `${method} ${base.entityId}`,
		action: base.action,
		userId: user?.id ?? null,
		userName: getUserDisplayName(user ?? null),
		payloadAfter: {
			summary,
			actionKey,
			method,
			pathname,
			searchParams: sanitizeSearchParams(searchParams),
			status,
			outcome,
			at: new Date().toISOString()
		}
	});
}
