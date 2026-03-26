/**
 * Convertește static/logo.png în webp cu transparență păstrată.
 * Salvează în static/media/uploads/brand/logo.webp (suprascrie fișierul existent).
 */
import sharp from 'sharp';
import * as fs from 'node:fs';
import * as path from 'node:path';

const srcPath = path.join(process.cwd(), 'static', 'logo.png');
const destDir = path.join(process.cwd(), 'static', 'media', 'uploads', 'brand');
const destPath = path.join(destDir, 'logo.webp');

async function main() {
	if (!fs.existsSync(srcPath)) {
		console.error('Fișierul sursă nu există:', srcPath);
		process.exit(1);
	}
	fs.mkdirSync(destDir, { recursive: true });

	await sharp(srcPath)
		.webp({ alphaQuality: 100, lossless: false, quality: 90 })
		.toFile(destPath);

	console.log('Logo convertit cu succes:', destPath);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
