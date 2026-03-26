import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { resolveUserPermissions } from '$lib/server/permissions';
import type { UserWithRole } from '$lib/server/permissions';
import { logAdminRequestAction } from '$lib/server/audit';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user as typeof event.locals.user & { role?: string };
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

const handleAdminGuard: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/admin')) {
		if (!event.locals.session || !event.locals.user) {
			throw redirect(302, '/login?callbackURL=' + encodeURIComponent(event.url.pathname));
		}
		const user = event.locals.user as UserWithRole;
		const permissions = await resolveUserPermissions(user);
		event.locals.permissions = permissions;
		if (!permissions.has('dashboard.view')) {
			throw redirect(302, '/');
		}
	}
	return resolve(event);
};

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const handleAdminActionAudit: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	if (!event.url.pathname.startsWith('/admin')) return response;
	if (!MUTATING_METHODS.has(event.request.method.toUpperCase())) return response;
	if (!event.locals.user) return response;

	const outcome = response.status >= 400 ? 'error' : 'success';
	try {
		await logAdminRequestAction(event, response.status, outcome);
	} catch (err) {
		console.error('Admin action audit failed', err);
	}
	return response;
};

export const handle: Handle = sequence(
	handleParaglide,
	handleBetterAuth,
	handleAdminGuard,
	handleAdminActionAudit
);
