import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const OUTPUT_DIR = join(
	process.cwd(),
	'static',
	'media',
	'uploads',
	'programe',
	'kogaion-family-bootcamp-4-6-ani'
);

const GALLERY_IMAGE_URLS = [
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC08102-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05196-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05200-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07735-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05310-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05325-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05374-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05386-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05391-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05393-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05406-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05510-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05629-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05727-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05757-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05760-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05800-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05804-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05814-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05848-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05863-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05936-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06025-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06053-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06083-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06128-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06172-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06183-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06205-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06219-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06238-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06242-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06272-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06288-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06302-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06316-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06351-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06371-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06600-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06624-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06751-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06782-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06795-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06902-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07032-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07042-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07084-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07149-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07197-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07208-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07230-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07264-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07298-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07407-1-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07432-1-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07440-1-2048x1366.jpg'
];

const BENEFITS_MAIN_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05304-2048x1366.jpg';

const LOCATION_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/Moeciu_de_Sus_Preda_Nicoleta_1500507016.10675311-768x432.jpg';

const LOCATION_GRID_IMAGE_URLS = [
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/3.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/5.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/foto_079-768x512.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/2-768x576.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/4.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/7-768x576.jpg'
];

async function downloadAndConvertToWebp(url: string, outputPath: string) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed ${response.status} for ${url}`);
	const buffer = Buffer.from(await response.arrayBuffer());
	await sharp(buffer).webp({ quality: 84 }).toFile(outputPath);
}

async function main() {
	await mkdir(OUTPUT_DIR, { recursive: true });

	for (let i = 0; i < GALLERY_IMAGE_URLS.length; i += 1) {
		const outputName = `kogaion-family-bootcamp-4-6-ani-gallery-${String(i + 1).padStart(2, '0')}.webp`;
		await downloadAndConvertToWebp(GALLERY_IMAGE_URLS[i], join(OUTPUT_DIR, outputName));
		console.log('gallery', outputName);
	}

	await downloadAndConvertToWebp(
		BENEFITS_MAIN_IMAGE_URL,
		join(OUTPUT_DIR, 'kogaion-family-bootcamp-4-6-ani-benefits-main.webp')
	);
	console.log('benefits', 'kogaion-family-bootcamp-4-6-ani-benefits-main.webp');

	await downloadAndConvertToWebp(
		LOCATION_IMAGE_URL,
		join(OUTPUT_DIR, 'kogaion-family-bootcamp-4-6-ani-location-main.webp')
	);
	console.log('location', 'kogaion-family-bootcamp-4-6-ani-location-main.webp');

	for (let i = 0; i < LOCATION_GRID_IMAGE_URLS.length; i += 1) {
		const outputName = `kogaion-family-bootcamp-4-6-ani-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
		await downloadAndConvertToWebp(LOCATION_GRID_IMAGE_URLS[i], join(OUTPUT_DIR, outputName));
		console.log('location-grid', outputName);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
