import path from 'node:path';
import { json } from '@sveltejs/kit';
import { requirePermission } from '$lib/server/permissions';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { mediaAsset } from '$lib/server/db/schema';
import { inArray } from 'drizzle-orm';
import { scanMediaRecursive, UPLOAD_DIR, MEDIA_URL_PREFIX } from '$lib/server/media-list';

export const GET: RequestHandler = async (event) => {
	requirePermission(event, 'media.view');
	const uploadDir = path.join(process.cwd(), UPLOAD_DIR);
	const folder = event.url.searchParams.get('folder'); // '' = toate, 'home' = doar home
	let files = await scanMediaRecursive(uploadDir, uploadDir, MEDIA_URL_PREFIX);
	if (folder && folder !== '') {
		const prefix = folder + '/';
		files = files.filter((f) => f.name === folder || f.name.startsWith(prefix));
	}
	files.sort((a, b) => b.mtime - a.mtime);

	const urls = files.map((f) => f.url);
	const metadataRows =
		urls.length > 0
			? await db.select().from(mediaAsset).where(inArray(mediaAsset.url, urls))
			: [];
	const metaMap = new Map(metadataRows.map((r) => [r.url, r]));
	const filesWithMeta = files.map((f) => {
		const meta = metaMap.get(f.url);
		return {
			...f,
			title: meta?.title ?? null,
			alt: meta?.alt ?? null,
			caption: meta?.caption ?? null,
			description: meta?.description ?? null,
			tags: Array.isArray(meta?.tags) ? meta.tags : []
		};
	});
	return json({ files: filesWithMeta });
};
