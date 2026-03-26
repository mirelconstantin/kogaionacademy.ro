/**
 * Mută toate imaginile/video din static în media/uploads, convertite în webp/webm.
 * Structură: media/uploads/home | about | contact | blog | brand | badges | mentori | programe
 *
 * Rulează: bun run scripts/migrate-media-to-uploads.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const ROOT = process.cwd();
const UPLOADS = path.join(ROOT, 'static', 'media', 'uploads');
const KOGAION = path.join(ROOT, 'static', 'kogaion-source', 'images');
const MEDIA_MENTORI = path.join(ROOT, 'static', 'media', 'mentori');
const MEDIA_PROGRAME = path.join(ROOT, 'static', 'media', 'programe');
const MEDIA_HOME = path.join(ROOT, 'static', 'media', 'home');

interface Mapping {
	old: string;
	new: string;
}

const mappings: Mapping[] = [];

async function ensureDir(p: string) {
	await fs.mkdir(p, { recursive: true });
}

async function convertToWebp(src: string, dest: string): Promise<void> {
	await ensureDir(path.dirname(dest));
	await sharp(src)
		.rotate()
		.webp({ quality: 85 })
		.toFile(dest);
}

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
	await ensureDir(path.dirname(dest));
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
	} catch (e) {
		console.warn('FFmpeg indisponibil sau eroare – păstrăm video original. Instalează ffmpeg pentru conversie webm.');
		return false;
	}
}

async function migrateKogaionImages() {
	const folders: Record<string, string[]> = {
		['media/uploads/brand']: ['001-logo.jpg'],
		['media/uploads/about']: [
			'002-Florian-Colceag.jpg',
			'003-DSC05800.jpg',
			'004-DSC07149.jpg',
			'007-Poza-Diana-2.jpg',
			'009-DSC07735.jpg'
		],
		['media/uploads/blog']: ['005-DSC07197.jpg'],
		['media/uploads/badges']: ['010-anpc-sal-mic-Copy.png', '011-anpc-sol-mic.png']
	};

	const renames: Record<string, string> = {
		'001-logo.jpg': 'logo.webp',
		'002-Florian-Colceag.jpg': 'founder-florian.webp',
		'003-DSC05800.jpg': 'age-3-6.webp',
		'004-DSC07149.jpg': 'age-7-12.webp',
		'005-DSC07197.jpg': 'hero.webp',
		'007-Poza-Diana-2.jpg': 'founder-diana.webp',
		'009-DSC07735.jpg': 'age-13-18.webp',
		'010-anpc-sal-mic-Copy.png': 'anpc-sal.webp',
		'011-anpc-sol-mic.png': 'anpc-sol.webp'
	};

	for (const [folder, files] of Object.entries(folders)) {
		const outDir = path.join(ROOT, 'static', folder);
		await ensureDir(outDir);
		for (const f of files) {
			const srcPath = path.join(KOGAION, f);
			try {
				await fs.access(srcPath);
			} catch {
				continue;
			}
			const outName = renames[f] ?? f.replace(/\.[a-z]+$/i, '.webp');
			const destPath = path.join(outDir, outName);
			await convertToWebp(srcPath, destPath);
			const oldUrl = `/kogaion-source/images/${f}`;
			const newUrl = `/${folder}/${outName}`;
			mappings.push({ old: oldUrl, new: newUrl });
			console.log(`  ${f} -> ${folder}/${outName}`);
		}
	}
}

async function migrateHeroVideo() {
	const src = path.join(MEDIA_HOME, 'hero-learning.mp4');
	try {
		await fs.access(src);
	} catch {
		return;
	}
	const outDir = path.join(UPLOADS, 'home');
	await ensureDir(outDir);
	const destWebm = path.join(outDir, 'hero.webm');
	const converted = await convertVideoToWebm(src, destWebm);
	const newVideoUrl = '/media/uploads/home/hero.webm';
	mappings.push({ old: '/media/home/hero-learning.mp4', new: newVideoUrl });
	mappings.push({ old: '/media/home/hero-no-people.mp4', new: newVideoUrl });
	if (converted) {
		console.log('  hero-learning.mp4 -> media/uploads/home/hero.webm');
	} else {
		const destMp4 = path.join(outDir, 'hero.mp4');
		await fs.copyFile(src, destMp4);
		mappings.push({ old: '/media/home/hero-learning.mp4', new: '/media/uploads/home/hero.mp4' });
		mappings.push({ old: '/media/home/hero-no-people.mp4', new: '/media/uploads/home/hero.mp4' });
		console.log('  hero-learning.mp4 -> media/uploads/home/hero.mp4 (copiat, ffmpeg inexistent)');
	}
}

async function migrateMentoriPrograme() {
	const mentoriDest = path.join(UPLOADS, 'mentori');
	const programeDest = path.join(UPLOADS, 'programe');
	await ensureDir(mentoriDest);
	await ensureDir(programeDest);

	for (const dir of [MEDIA_MENTORI, MEDIA_PROGRAME]) {
		const sub = dir === MEDIA_MENTORI ? 'mentori' : 'programe';
		const destDir = path.join(UPLOADS, sub);
		await ensureDir(destDir);
		try {
			const files = await fs.readdir(dir);
			for (const f of files) {
				if (!/\.(webp|jpg|jpeg|png|gif)$/i.test(f)) continue;
				const srcPath = path.join(dir, f);
				const stat = await fs.stat(srcPath);
				if (!stat.isFile()) continue;
				const ext = path.extname(f);
				const base = path.basename(f, ext);
				const destName = ext.toLowerCase() === '.webp' ? f : `${base}.webp`;
				const destPath = path.join(destDir, destName);
				if (ext.toLowerCase() === '.webp') {
					await fs.copyFile(srcPath, destPath);
				} else {
					await convertToWebp(srcPath, destPath);
				}
				const oldUrl = `/media/${sub}/${f}`;
				const newUrl = `/media/uploads/${sub}/${destName}`;
				mappings.push({ old: oldUrl, new: newUrl });
				console.log(`  ${sub}/${f} -> media/uploads/${sub}/${destName}`);
			}
		} catch (e) {
			if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
		}
	}
}

async function copyHeroPoster() {
	const src = path.join(KOGAION, '008-RDCL5971-scaled.jpg');
	const destDir = path.join(UPLOADS, 'home');
	const destPath = path.join(destDir, 'hero-poster.webp');
	try {
		await fs.access(src);
	} catch {
		return;
	}
	await ensureDir(destDir);
	await convertToWebp(src, destPath);
	mappings.push({ old: '/kogaion-source/images/008-RDCL5971-scaled.jpg', new: '/media/uploads/home/hero-poster.webp' });
}

function buildContactAboutBlogHeroMapping() {
	mappings.push(
		{ old: '/kogaion-source/images/008-RDCL5971-scaled.jpg', new: '/media/uploads/home/hero-poster.webp' }
	);
}

async function main() {
	console.log('Migrare media -> media/uploads (webp/webm)...\n');

	await ensureDir(UPLOADS);

	console.log('1. Conversie kogaion-source -> webp (categorii)...');
	await migrateKogaionImages();

	console.log('\n2. Poster hero home...');
	await copyHeroPoster();

	console.log('\n3. Video hero -> webm...');
	await migrateHeroVideo();

	console.log('\n4. Mutare mentori + programe...');
	await migrateMentoriPrograme();

	buildContactAboutBlogHeroMapping();

	const unique = [...new Map(mappings.map((m) => [m.old, m.new])).entries()];
	await fs.writeFile(
		path.join(ROOT, 'scripts', 'media-url-mapping.json'),
		JSON.stringify(Object.fromEntries(unique), null, 2)
	);
	console.log('\nMapare salvată în scripts/media-url-mapping.json');
	console.log('\nActualizează referințele în cod folosind acest mapping.');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
