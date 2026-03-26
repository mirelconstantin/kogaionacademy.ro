/**
 * Scrape assets from the afterschool program page.
 * Run: bun run scripts/scrape-afterschool-assets.ts
 * Output: JSON with imageUrls, galleryImageUrls (slideshow only), and videoIds.
 */
const URL = 'https://kogaionacademy.ro/programe/afterschool-kogaion-self-mastery/';

async function main() {
	const res = await fetch(URL);
	const html = await res.text();

	const imageUrls: string[] = [];
	const imgRe = /(?:href|src)=["'](https?:\/\/[^"']*wp-content\/uploads[^"']+)["']/gi;
	let m: RegExpExecArray | null;
	while ((m = imgRe.exec(html)) !== null) {
		const url = m[1].replace(/-\d+x\d+\./, '.').replace(/\?.*$/, '');
		if (!imageUrls.includes(url)) imageUrls.push(url);
	}

	// Extract gallery slideshow images: section between "Galerie foto" / "galerie" and "Transport"
	const gallerySection =
		html.match(
			/Galerie foto[\s\S]*?<\/h2>([\s\S]*?)(?=<h2[^>]*>Transport|<section|$)/i
		)?.[1] ?? '';
	const galleryImageUrls: string[] = [];
	const galleryImgRe = /(?:href|src|data-src)=["'](https?:\/\/[^"']*wp-content\/uploads[^"']+)["']/gi;
	while ((m = galleryImgRe.exec(gallerySection)) !== null) {
		const url = m[1].replace(/-\d+x\d+\./, '.').replace(/\?.*$/, '');
		if (!galleryImageUrls.includes(url) && !url.includes('cropped-icon')) galleryImageUrls.push(url);
	}
	// Fallback: use all non-mentor images if gallery extraction yields few
	const mentorPattern = /(Poza-Diana|Rodica-Bealcu|Iulian-Glita|Andreea-Draghici|Gabriel-Esanu|Andreea-Faur|Anca-Muicu|Vladimir-Stefanescu|Dumitru-Badila|Nicolae-Cruceru|Constantin-Caprioreanu|Christopher-Hermann|Flavian-Glont|Carlos-Catana)/i;
	const slideshowImages =
		galleryImageUrls.length >= 20
			? galleryImageUrls
			: imageUrls.filter((u) => !mentorPattern.test(u) && !u.includes('cropped-icon'));

	const videoIds: string[] = [];
	const ytRe = /(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/g;
	while ((m = ytRe.exec(html)) !== null) {
		if (!videoIds.includes(m[1])) videoIds.push(m[1]);
	}

	const out = { imageUrls, galleryImageUrls: slideshowImages, videoIds };
	console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
