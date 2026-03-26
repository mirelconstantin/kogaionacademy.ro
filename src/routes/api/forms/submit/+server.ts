import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ingestFormSubmit, type SubmitBody } from '$lib/server/forms/submit-service';

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
	let body: SubmitBody;
	try {
		body = (await event.request.json()) as SubmitBody;
	} catch {
		throw error(400, 'Invalid JSON');
	}
	if (!body?.formKey || body.formVersion == null || !body?.pageUrl || !body?.values) {
		throw error(400, 'Missing fields');
	}
	const result = await ingestFormSubmit(event, body);
	if (!result.ok) {
		return json(result, { status: 400 });
	}
	return json(result);
};
