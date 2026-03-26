import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'c:/Users/mirel/Desktop/GitHub/Kogaion';
const pages = ['https://kogaionacademy.ro/', 'https://kogaionacademy.ro/despre-noi/'];

const imagePatterns = [
	/<img[^>]+src=['"]([^'"]+)['"]/gi,
	/data-src=['"]([^'"]+)['"]/gi,
	/url\(([^)]+)\)/gi
];

function absolutize(url) {
	const clean = url.trim().replace(/^['"]|['"]$/g, '');
	if (!clean || clean.startsWith('data:')) return null;
	if (clean.startsWith('//')) return `https:${clean}`;
	if (clean.startsWith('/')) return `https://kogaionacademy.ro${clean}`;
	if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
	return null;
}

function fileNameFromUrl(url, idx) {
	try {
		const u = new URL(url);
		const base = path.basename(u.pathname) || `image-${idx}.jpg`;
		const safe = base.split('?')[0].replace(/[^a-zA-Z0-9._-]/g, '_');
		return safe || `image-${idx}.jpg`;
	} catch {
		return `image-${idx}.jpg`;
	}
}

async function run() {
	const outDir = path.join(ROOT, 'static', 'kogaion-source');
	const imgDir = path.join(outDir, 'images');
	await mkdir(imgDir, { recursive: true });

	const urls = new Set();

	for (const page of pages) {
		const html = await fetch(page).then((r) => r.text());
		for (const pattern of imagePatterns) {
			let match;
			while ((match = pattern.exec(html)) !== null) {
				const maybe = absolutize(match[1]);
				if (maybe) urls.add(maybe);
			}
		}
	}

	const urlList = [...urls].sort();
	await writeFile(path.join(outDir, 'image-urls.txt'), `${urlList.join('\n')}\n`, 'utf8');

	const downloaded = [];
	for (let i = 0; i < urlList.length; i++) {
		const url = urlList[i];
		try {
			const res = await fetch(url);
			if (!res.ok) continue;
			const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
			if (!contentType.startsWith('image/')) continue;
			const buffer = Buffer.from(await res.arrayBuffer());
			const name = `${String(i + 1).padStart(3, '0')}-${fileNameFromUrl(url, i + 1)}`;
			const filePath = path.join(imgDir, name);
			await writeFile(filePath, buffer);
			downloaded.push({ url, filePath: `static/kogaion-source/images/${name}` });
		} catch {
			// best effort scrape, skip invalid URLs
		}
	}

	const md = [
		'# Kogaion scraped assets',
		'',
		`Pages: ${pages.join(', ')}`,
		`Found image URLs: ${urlList.length}`,
		`Downloaded files: ${downloaded.length}`,
		'',
		'## Downloaded',
		...downloaded.map((entry) => `- ${entry.filePath} <- ${entry.url}`)
	].join('\n');

	await writeFile(path.join(outDir, 'README.md'), `${md}\n`, 'utf8');
	console.log(`Found ${urlList.length} image URLs`);
	console.log(`Downloaded ${downloaded.length} files to static/kogaion-source/images`);
}

run();
