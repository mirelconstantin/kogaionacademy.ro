import { json } from '@sveltejs/kit';
import { requirePermission } from '$lib/server/permissions';
import type { RequestHandler } from './$types';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import { db } from '$lib/server/db';
import { mediaAsset } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getMediaUsage } from '$lib/server/media-usage';

/** Validă că url e din /media/uploads/ și nu conține path traversal */
function validateMediaUrl(url: string): boolean {
	if (!url.startsWith('/media/uploads/')) return false;
	const withoutPrefix = url.slice('/media/uploads/'.length);
	if (withoutPrefix.includes('..') || withoutPrefix.startsWith('/')) return false;
	return true;
}

export const DELETE: RequestHandler = async (event) => {
	requirePermission(event, 'media.delete');
	const url = event.url.searchParams.get('url');
	if (!url || !validateMediaUrl(url)) {
		return json({ error: 'URL invalid. Trebuie să fie din /media/uploads/' }, { status: 400 });
	}
	const force = event.url.searchParams.get('force') === '1' || event.url.searchParams.get('force') === 'true';
	if (!force) {
		const { used, locations } = await getMediaUsage(url);
		if (used) {
			return json(
				{ error: 'Asset-ul este folosit și nu poate fi șters fără confirmare.', used: true, locations },
				{ status: 403 }
			);
		}
	}
	const baseDir = path.join(process.cwd(), 'static');
	const relPath = url.replace(/^\//, '').replace(/\\/g, '/');
	const filePath = path.join(baseDir, relPath);
	try {
		await unlink(filePath);
	} catch (e) {
		const code = (e as NodeJS.ErrnoException).code;
		if (code === 'ENOENT') {
			// Fișierul nu există – tot ștergem din DB dacă e cazul
		} else {
			return json({ error: 'Nu s-a putut șterge fișierul' }, { status: 500 });
		}
	}
	await db.delete(mediaAsset).where(eq(mediaAsset.url, url));
	return json({ ok: true });
};
