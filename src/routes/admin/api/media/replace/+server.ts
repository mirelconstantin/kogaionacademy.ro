import { json } from '@sveltejs/kit';
import { requirePermission } from '$lib/server/permissions';
import type { RequestHandler } from './$types';
import path from 'node:path';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

function runFfmpeg(args: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		let proc: ReturnType<typeof spawn>;
		try {
			proc = spawn('ffmpeg', args, { stdio: 'pipe' });
		} catch (e) {
			reject(e);
			return;
		}
		let stderr = '';
		proc.stderr?.on('data', (d) => { stderr += d.toString(); });
		proc.on('error', (e) => reject(e));
		proc.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-500)}`));
		});
	});
}

async function convertVideoToWebm(src: string, dest: string): Promise<boolean> {
	try {
		await runFfmpeg([
			'-i', src,
			'-c:v', 'libvpx-vp9',
			'-crf', '30',
			'-b:v', '0',
			'-an',
			'-y',
			dest
		]);
		return true;
	} catch {
		return false;
	}
}

/** Validă că url e din /media/uploads/ și nu conține path traversal */
function validateMediaUrl(url: string): boolean {
	if (!url.startsWith('/media/uploads/')) return false;
	const withoutPrefix = url.slice('/media/uploads/'.length);
	if (withoutPrefix.includes('..') || withoutPrefix.startsWith('/')) return false;
	return true;
}

export const POST: RequestHandler = async (event) => {
	requirePermission(event, 'media.upload');
	const formData = await event.request.formData();
	const file = formData.get('file') as File | null;
	const url = (formData.get('url') as string | null)?.trim();
	if (!file || !(file instanceof File) || !url) {
		return json({ error: 'Fișier sau URL lipsă' }, { status: 400 });
	}
	if (!validateMediaUrl(url)) {
		return json({ error: 'URL invalid. Trebuie să fie din /media/uploads/' }, { status: 400 });
	}
	if (!ALLOWED_TYPES.includes(file.type)) {
		return json({ error: 'Tip fișier neacceptat.' }, { status: 400 });
	}
	const isVideo = VIDEO_TYPES.includes(file.type);
	const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
	if (file.size > maxSize) {
		return json({ error: `Fișierul depășește ${isVideo ? '100' : '10'}MB` }, { status: 400 });
	}

	const baseDir = path.join(process.cwd(), 'static');
	const relPath = url.replace(/^\//, '').replace(/\\/g, '/');
	const destPath = path.join(baseDir, relPath);
	const destDir = path.dirname(destPath);
	await mkdir(destDir, { recursive: true });

	const buffer = Buffer.from(await file.arrayBuffer());
	const destExt = path.extname(destPath).toLowerCase();
	const isDestVideo = /\.(webm|mp4)$/i.test(destPath);

	if (isVideo) {
		const tempPath = path.join(destDir, `replace-${Date.now()}-${file.name}`);
		await writeFile(tempPath, buffer);
		if (destExt === '.webm') {
			const ok = await convertVideoToWebm(tempPath, destPath);
			await unlink(tempPath).catch(() => {});
			if (!ok) {
				await writeFile(destPath, buffer);
			}
		} else {
			await writeFile(destPath, buffer);
			await unlink(tempPath).catch(() => {});
		}
	} else if (file.type === 'image/svg+xml' && destExt === '.svg') {
		await writeFile(destPath, buffer);
	} else {
		await sharp(buffer)
			.rotate()
			.webp({ quality: 85 })
			.toFile(destPath);
	}

	return json({ url, success: true });
};
