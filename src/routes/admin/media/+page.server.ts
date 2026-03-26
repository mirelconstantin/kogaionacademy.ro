import path from 'node:path';
import { requirePermission } from '$lib/server/permissions';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { mediaAsset } from '$lib/server/db/schema';
import { scanMediaRecursive, UPLOAD_DIR, MEDIA_URL_PREFIX } from '$lib/server/media-list';
import { getAllUsedMediaUrls } from '$lib/server/media-usage';

type MediaFile = {
	name: string;
	url: string;
	mtime: number;
	title?: string;
	alt?: string;
	caption?: string;
	description?: string;
	tags?: string[];
};

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'media.view');
	const uploadDir = path.join(process.cwd(), UPLOAD_DIR);
	const scanned = await scanMediaRecursive(uploadDir, uploadDir, MEDIA_URL_PREFIX);
	scanned.sort((a, b) => b.mtime - a.mtime);

	const allMeta = await db.select().from(mediaAsset);
	const metaByUrl = new Map(allMeta.map((m) => [m.url, m]));

	const files: MediaFile[] = scanned.map((f) => {
		const meta = metaByUrl.get(f.url);
		return {
			...f,
			title: meta?.title ?? undefined,
			alt: meta?.alt ?? undefined,
			caption: meta?.caption ?? undefined,
			description: meta?.description ?? undefined,
			tags: Array.isArray(meta?.tags) ? meta.tags : undefined
		};
	});

	const usedUrls = await getAllUsedMediaUrls();

	// Strict env: canonical base for absolute media URLs (PUBLIC_SITE_URL first, then ORIGIN)
	const rawBase = process.env.PUBLIC_SITE_URL ?? process.env.ORIGIN ?? '';
	const publicSiteUrl = rawBase.trim().replace(/\/+$/, '') || '';
	return { files, publicSiteUrl, usedUrls: [...usedUrls] };
};
