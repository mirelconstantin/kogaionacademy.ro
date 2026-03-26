import { json } from '@sveltejs/kit';
import { requirePermission } from '$lib/server/permissions';
import type { RequestHandler } from './$types';
import { getMediaUsage } from '$lib/server/media-usage';

function isValidMediaUrl(url: string): boolean {
	return typeof url === 'string' && url.startsWith('/media/uploads/') && !url.includes('..');
}

export const GET: RequestHandler = async (event) => {
	requirePermission(event, 'media.view');
	const url = event.url.searchParams.get('url');
	if (!url || !isValidMediaUrl(url)) {
		return json({ error: 'URL invalid' }, { status: 400 });
	}
	const { used, locations } = await getMediaUsage(url);
	return json({ used, locations });
};
