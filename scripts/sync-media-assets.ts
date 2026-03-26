import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { mentorsSeedData } from './mentors-seed-data';

const ROOT = 'c:/Users/mirel/Desktop/GitHub/Kogaion';
const MENTORS_HTML = path.join(ROOT, 'tmp-mentori.html');
const MENTORS_DIR = path.join(ROOT, 'static/media/mentori');
const PROGRAMS_OLD_DIR = path.join(ROOT, 'static/media/programs');
const PROGRAMS_NEW_DIR = path.join(ROOT, 'static/media/programe');
const PROGRAMS_DATA_FILE = path.join(ROOT, 'src/lib/programs-data.ts');
const MENTORS_SEED_FILE = path.join(ROOT, 'scripts/mentors-seed-data.ts');

function pickBestImageUrl(imgTag: string): string {
	const srcsetMatch = imgTag.match(/\ssrcset="([^"]+)"/i);
	if (srcsetMatch?.[1]) {
		const candidates = srcsetMatch[1]
			.split(',')
			.map((entry) => entry.trim())
			.filter(Boolean)
			.map((entry) => {
				const [url, widthRaw] = entry.split(/\s+/);
				const width = Number.parseInt((widthRaw ?? '').replace('w', ''), 10);
				return { url, width: Number.isFinite(width) ? width : 0 };
			})
			.filter((c) => Boolean(c.url));
		if (candidates.length > 0) {
			candidates.sort((a, b) => b.width - a.width);
			return candidates[0].url;
		}
	}

	const srcMatch = imgTag.match(/\ssrc="([^"]+)"/i);
	if (!srcMatch?.[1]) throw new Error(`Unable to extract src from tag: ${imgTag}`);
	return srcMatch[1];
}

function toAbsoluteUrl(url: string): string {
	if (url.startsWith('http://') || url.startsWith('https://')) return url;
	if (url.startsWith('/')) return `https://kogaionacademy.ro${url}`;
	return `https://kogaionacademy.ro/${url}`;
}

async function ensureCleanDir(dirPath: string): Promise<void> {
	await fs.rm(dirPath, { recursive: true, force: true });
	await fs.mkdir(dirPath, { recursive: true });
}

async function extractMentorImageUrls(html: string): Promise<string[]> {
	const imageTagRegex = /<img[^>]*class="vc_single_image-img attachment-thumbnail"[^>]*>/gi;
	const imageTags = [...html.matchAll(imageTagRegex)].map((m) => m[0]);
	if (imageTags.length !== mentorsSeedData.length) {
		throw new Error(`Expected ${mentorsSeedData.length} mentor images, found ${imageTags.length}.`);
	}
	return imageTags.map((tag) => toAbsoluteUrl(pickBestImageUrl(tag)));
}

async function downloadMentorImages(mentorImageUrls: string[]): Promise<void> {
	await ensureCleanDir(MENTORS_DIR);
	for (let i = 0; i < mentorsSeedData.length; i += 1) {
		const mentor = mentorsSeedData[i];
		const imageUrl = mentorImageUrls[i];
		const outputPath = path.join(MENTORS_DIR, `${mentor.slug}.webp`);
		const response = await fetch(imageUrl);
		if (!response.ok) {
			throw new Error(`Failed to download ${imageUrl} (${response.status})`);
		}
		const buffer = Buffer.from(await response.arrayBuffer());
		await sharp(buffer).rotate().webp({ quality: 85 }).toFile(outputPath);
	}
}

async function convertProgramsToWebp(): Promise<void> {
	await ensureCleanDir(PROGRAMS_NEW_DIR);
	const files = await fs.readdir(PROGRAMS_OLD_DIR, { withFileTypes: true });
	for (const file of files) {
		if (!file.isFile()) continue;
		const ext = path.extname(file.name).toLowerCase();
		if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
		const basename = path.basename(file.name, ext);
		const inPath = path.join(PROGRAMS_OLD_DIR, file.name);
		const outPath = path.join(PROGRAMS_NEW_DIR, `${basename}.webp`);
		await sharp(inPath).rotate().webp({ quality: 85 }).toFile(outPath);
	}
	await fs.rm(PROGRAMS_OLD_DIR, { recursive: true, force: true });
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function updateProgramsDataReferences(): Promise<void> {
	const content = await fs.readFile(PROGRAMS_DATA_FILE, 'utf8');
	const updated = content.replace(
		/\/media\/programs\/([A-Za-z0-9\-._ ]+)\.(jpg|jpeg|png|webp)/g,
		'/media/programe/$1.webp'
	);
	await fs.writeFile(PROGRAMS_DATA_FILE, updated, 'utf8');
}

async function updateMentorsSeedImagePaths(): Promise<void> {
	let content = await fs.readFile(MENTORS_SEED_FILE, 'utf8');
	for (const mentor of mentorsSeedData) {
		const blockRegex = new RegExp(
			`(slug:\\s*'${escapeRegExp(mentor.slug)}'[\\s\\S]*?image:\\s*)([^,]+)(,)`,
			'm'
		);
		content = content.replace(blockRegex, `$1'/media/mentori/${mentor.slug}.webp'$3`);
	}
	await fs.writeFile(MENTORS_SEED_FILE, content, 'utf8');
}

async function removeNonWebpMediaFiles(): Promise<void> {
	const mediaRoot = path.join(ROOT, 'static/media');
	const dirs = await fs.readdir(mediaRoot, { withFileTypes: true });
	for (const dir of dirs) {
		if (!dir.isDirectory()) continue;
		const dirPath = path.join(mediaRoot, dir.name);
		const files = await fs.readdir(dirPath, { withFileTypes: true });
		for (const file of files) {
			if (!file.isFile()) continue;
			const ext = path.extname(file.name).toLowerCase();
			if (ext !== '.webp') {
				await fs.rm(path.join(dirPath, file.name), { force: true });
			}
		}
	}
}

async function run(): Promise<void> {
	const html = await fs.readFile(MENTORS_HTML, 'utf8');
	const mentorImageUrls = await extractMentorImageUrls(html);

	await downloadMentorImages(mentorImageUrls);
	await convertProgramsToWebp();
	await updateProgramsDataReferences();
	await updateMentorsSeedImagePaths();
	await removeNonWebpMediaFiles();

	console.log(
		`Done: ${mentorImageUrls.length} mentor images downloaded + converted, programs converted to /media/programe/*.webp`
	);
}

run().catch((error) => {
	console.error(error);
	process.exit(1);
});
