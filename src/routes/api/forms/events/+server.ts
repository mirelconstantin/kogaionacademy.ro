import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ingestFormEvent, type IncomingFormEvent } from '$lib/server/forms/events-service';

function isAllowedOrigin(request: Request, url: URL): boolean {
	const origin = request.headers.get('origin');
	if (!origin) return true;
	try {
		return new URL(origin).origin === url.origin;
	} catch {
		return false;
	}
}

export const POST: RequestHandler = async (event) => {
	if (!isAllowedOrigin(event.request, event.url)) {
		throw error(403, 'Forbidden');
	}
	let body: IncomingFormEvent;
	try {
		body = (await event.request.json()) as IncomingFormEvent;
	} catch {
		throw error(400, 'Invalid JSON');
	}
	if (!body?.formKey || !body?.eventType || !body?.pageUrl) {
		throw error(400, 'Missing fields');
	}
	const out = await ingestFormEvent(event, body);
	return json(out);
};
