import path from 'node:path';
import { readdir, stat } from 'node:fs/promises';

export const MEDIA_EXTENSIONS = new Set([
	'.jpg',
	'.jpeg',
	'.png',
	'.gif',
	'.webp',
	'.svg',
	'.mp4',
	'.webm'
]);

export type ScannedMediaFile = { name: string; url: string; mtime: number };

/**
 * Recursively scan a directory for media files and return name, url, mtime.
 * Used by admin media page and /admin/api/media/list.
 */
export async function scanMediaRecursive(
	dir: string,
	baseDir: string,
	urlPrefix: string
): Promise<ScannedMediaFile[]> {
	const entries: ScannedMediaFile[] = [];
	try {
		const items = await readdir(dir);
		for (const name of items) {
			if (name.startsWith('.')) continue;
			const fp = path.join(dir, name);
			const st = await stat(fp);
			if (st.isDirectory()) {
				const sub = await scanMediaRecursive(fp, baseDir, urlPrefix);
				entries.push(...sub);
			} else if (st.isFile()) {
				const ext = path.extname(name).toLowerCase();
				if (!MEDIA_EXTENSIONS.has(ext)) continue;
				const rel = path.relative(baseDir, fp).replace(/\\/g, '/');
				entries.push({
					name: rel,
					url: `${urlPrefix}/${rel}`,
					mtime: st.mtimeMs
				});
			}
		}
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
			throw e;
		}
	}
	return entries;
}

export const UPLOAD_DIR = 'static/media/uploads';
export const MEDIA_URL_PREFIX = '/media/uploads';
