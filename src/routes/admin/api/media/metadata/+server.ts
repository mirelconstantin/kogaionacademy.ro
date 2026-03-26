import { json } from '@sveltejs/kit';
import { requirePermission } from '$lib/server/permissions';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { mediaAsset } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	requirePermission(event, 'media.view');
	const url = event.url.searchParams.get('url');
	if (!url || !url.startsWith('/media/uploads/')) {
		return json({ error: 'URL invalid' }, { status: 400 });
	}
	const [row] = await db.select().from(mediaAsset).where(eq(mediaAsset.url, url)).limit(1);
	return json({
		url,
		title: row?.title ?? '',
		alt: row?.alt ?? '',
		caption: row?.caption ?? '',
		description: row?.description ?? '',
		type: row?.type ?? null,
		tags: Array.isArray(row?.tags) ? row.tags : [],
		updatedAt: row?.updatedAt ?? null
	});
};

export const PATCH: RequestHandler = async (event) => {
	requirePermission(event, 'media.edit_metadata');
	let body: { url: string; title?: string; alt?: string; caption?: string; description?: string; tags?: string[] };
	try {
		body = await event.request.json();
	} catch {
		return json({ error: 'Body JSON invalid' }, { status: 400 });
	}
	const { url, title, alt, caption, description, tags } = body;
	if (!url || !url.startsWith('/media/uploads/')) {
		return json({ error: 'URL invalid' }, { status: 400 });
	}
	const [existing] = await db.select().from(mediaAsset).where(eq(mediaAsset.url, url)).limit(1);
	const currentTags = Array.isArray(existing?.tags) ? existing.tags : [];
	const payload = {
		title: title ?? existing?.title ?? null,
		alt: alt ?? existing?.alt ?? null,
		caption: caption ?? existing?.caption ?? null,
		description: description ?? existing?.description ?? null,
		tags: Array.isArray(tags) ? tags : currentTags,
		updatedAt: new Date()
	};
	if (existing) {
		await db.update(mediaAsset).set(payload).where(eq(mediaAsset.id, existing.id));
	} else {
		await db.insert(mediaAsset).values({
			url,
			title: payload.title,
			alt: payload.alt,
			caption: payload.caption,
			description: payload.description,
			tags: payload.tags,
			type: url.match(/\.(webm|mp4)$/i) ? 'video' : 'image'
		});
	}
	return json({ ok: true });
};
