import type { RequestEvent } from '@sveltejs/kit';
import { SESSION_COOKIE_FORMS } from '$lib/forms/types';

export function getOrCreateFormsSessionId(event: RequestEvent): string {
	let id = event.cookies.get(SESSION_COOKIE_FORMS);
	if (!id) {
		id = crypto.randomUUID();
		event.cookies.set(SESSION_COOKIE_FORMS, id, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			httpOnly: true,
			sameSite: 'lax',
			secure: event.url.protocol === 'https:'
		});
	}
	return id;
}

export function getClientIp(event: RequestEvent): string | null {
	try {
		const a = event.getClientAddress();
		return a || null;
	} catch {
		return null;
	}
}
