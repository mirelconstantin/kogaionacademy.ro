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
const SAFE_FOLDER = /^[a-z0-9_-]+$/;

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

export const POST: RequestHandler = async (event) => {
	requirePermission(event, 'media.upload');
	const formData = await event.request.formData();
	const file = formData.get('file') as File | null;
	const folder = (formData.get('folder') as string | null)?.trim() || 'general';
	if (!file || !(file instanceof File)) {
		return json({ error: 'Fișier lipsă' }, { status: 400 });
	}
	if (!ALLOWED_TYPES.includes(file.type)) {
		return json({ error: 'Tip fișier neacceptat. Folosiți imagini (JPEG, PNG, GIF, WebP, SVG) sau video (MP4, WebM).' }, { status: 400 });
	}
	if (!SAFE_FOLDER.test(folder)) {
		return json({ error: 'Folder invalid. Doar litere, cifre, _ și -.' }, { status: 400 });
	}
	const isVideo = VIDEO_TYPES.includes(file.type);
	const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
	if (file.size > maxSize) {
		return json({ error: `Fișierul depășește ${isVideo ? '100' : '10'}MB` }, { status: 400 });
	}

	const baseUploadDir = path.join(process.cwd(), 'static', 'media', 'uploads');
	const targetDir = path.join(baseUploadDir, folder);
	await mkdir(targetDir, { recursive: true });

	const baseName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
	const ext = path.extname(baseName).toLowerCase();
	const nameWithoutExt = path.basename(baseName, ext) || 'file';
	const timestamp = Date.now();
	const buffer = Buffer.from(await file.arrayBuffer());
	const tempPath = path.join(targetDir, `temp-${timestamp}-${baseName}`);

	let finalUrl: string;
	let finalName: string;

	if (file.type === 'image/svg+xml') {
		finalName = `${timestamp}-${nameWithoutExt}.svg`;
		const destPath = path.join(targetDir, finalName);
		await writeFile(destPath, buffer);
		finalUrl = `/media/uploads/${folder}/${finalName}`;
	} else if (isVideo) {
		await writeFile(tempPath, buffer);
		const destWebm = path.join(targetDir, `${timestamp}-${nameWithoutExt}.webm`);
		const converted = await convertVideoToWebm(tempPath, destWebm);
		await unlink(tempPath).catch(() => {});
		if (converted) {
			finalName = path.basename(destWebm);
			finalUrl = `/media/uploads/${folder}/${finalName}`;
		} else {
			finalName = `${timestamp}-${nameWithoutExt}${ext || '.mp4'}`;
			const destPath = path.join(targetDir, finalName);
			await writeFile(destPath, buffer);
			finalUrl = `/media/uploads/${folder}/${finalName}`;
		}
	} else {
		finalName = `${timestamp}-${nameWithoutExt}.webp`;
		const destPath = path.join(targetDir, finalName);
		await sharp(buffer)
			.rotate()
			.webp({ quality: 85 })
			.toFile(destPath);
		finalUrl = `/media/uploads/${folder}/${finalName}`;
	}

	return json({ url: finalUrl, name: finalName });
};
