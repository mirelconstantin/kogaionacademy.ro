/**
 * Ingest content and assets for the film-and-photo-advanced-learning program.
 * - Inserts program_section rows (RO) with full content from kogaionacademy.ro.
 * - Downloads the intro / benefits / gallery / location media to
 *   static/media/uploads/programe/film-and-photo-advanced-learning/
 * - Links mentors for this program.
 *
 * Source page: https://kogaionacademy.ro/programe/film-and-photo-advanced-learning/
 * The page has no "Beneficii secundare" and no "Meniu" block, so those sections
 * are intentionally not emitted. The cover image already exists on disk and is
 * referenced from src/lib/programs-data.ts, so it is not re-downloaded.
 *
 * Run: bun run scripts/ingest-film-photo-advanced.ts
 * Requires: DATABASE_URL, program and program_section tables. Run migrations first.
 */
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { program, programSection, programMentor, mentor } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const PROGRAM_SLUG = 'film-and-photo-advanced-learning';
const UPLOAD_DIR = join(
	process.cwd(),
	'static',
	'media',
	'uploads',
	'programe',
	'film-and-photo-advanced-learning'
);
const LOCAL_BASE = '/media/uploads/programe/film-and-photo-advanced-learning';

/**
 * Mentor slugs from the Film & Photo Advanced Learning page (order preserved).
 * The page lists 5 mentors and all 5 have matching rows in the mentor table.
 */
const MENTOR_SLUGS = [
	'andrei-stan',
	'roberto-stan',
	'madalina-gavrilescu',
	'constantin-caprioreanu',
	'alina-monica-antoci'
];

/** Image shown between the intro blocks (page banner of the intro section). */
const INTRO_IMAGE_URL = 'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL1674.jpg';

/** Main image shown under "Beneficii principale". */
const BENEFITS_MAIN_IMAGE_URL = 'https://kogaionacademy.ro/wp-content/uploads/2023/02/111.jpg';

/** Gallery image URLs, in the exact order listed on the page. */
const GALLERY_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/IMG-20180718-WA0324.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/IMG-20180718-WA0326.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/IMG-20180719-WA0018.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2019/05/Andrei-Stan-OFFroad-codrina-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2019/05/7-2.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2019/05/6-2.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL0287.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2532.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC00040.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG_4745-2-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSCF4849-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG-8239.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL1691-1.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2501-1.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL9941.jpg'
];

/** Main image of the "Locație" block (Pensiunea Mama Cozonacilor, Bran). */
const LOCATION_IMAGE_URL = 'https://kogaionacademy.ro/wp-content/uploads/2025/11/mama0.png';

/** Location grid images (6, as displayed under the Locație heading). */
const LOCATION_GRID_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/347623459.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/347623413.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/6.webp',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/3.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/co7.webp',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/8.jpg'
];

async function downloadAndConvertToWebp(url: string, localPath: string): Promise<void> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
	const buf = await res.arrayBuffer();
	await sharp(Buffer.from(buf)).webp({ quality: 84 }).toFile(localPath);
}

function buildSectionPayloads(
	introImage: string | null,
	benefitsMainImage: string | null,
	galleryImageUrls: string[],
	locationImage: string | null,
	locationGridUrls: string[]
): Array<{ section: string; sortOrder: number; payload: Record<string, unknown> }> {
	return [
		{
			section: 'hero_highlights',
			sortOrder: 0,
			payload: {
				items: [
					'Fotografie & Editare foto',
					'Cinematografie & Editare video',
					'Portofoliu Foto',
					'Film de scurt metraj',
					'Drumeție off-road',
					'Comunicare strategică',
					'Coaching și mentorat individual',
					'Conectare în natură',
					'Comunitate & Debate',
					'Validarea vocației. Feedback de specialitate personalizat'
				]
			}
		},
		{
			section: 'hero_cta',
			sortOrder: 1,
			payload: {
				buttons: [
					{ label: 'Sună', type: 'tel', value: '0720529398' },
					{ label: 'Cere detalii', type: 'link', href: '/contact' },
					{ label: 'Formular de înscriere', type: 'link', href: '/contact' }
				]
			}
		},
		{
			section: 'intro',
			sortOrder: 2,
			payload: {
				blocks: [
					{
						body: '10 zile – O EXPERIENȚĂ PENTRU VIAȚĂ, în care adolescenții își DEZVOLTĂ PASIUNEA pentru ARTE VIZUALE dobândind pre-rechizite esențiale de ARTĂ FOTOGRAFICĂ, CINEMATOGRAFIE, PRELUCRARE FOTO și VIDEO, DEZVOLTARE PERSONALĂ și RELAȚIONARE POZITIVĂ'
					},
					{
						body: 'Tabăra își propune valorificarea cunoștințelor și abilităților copiilor cu pasiune pentru arta fotografică și cinematografie. Tabăra este dedicată scrierii, producerii, regiei și editării unui proiect de film, precum și realizării unui portofoliu de fotografii care se vor constitui într-o poveste de colaj. Adolescenții vor lucra în echipe de patru persoane pentru a finaliza fiecare film; când colegii lor regizează, ei experimentează, pe rând, rolul de gaffer, asistent cameră și director de imagine.'
					},
					{
						body: 'Adolescenții noștri aspiră să devină fotografi, reporteri, cameramani și alte meserii asemenea.'
					},
					{
						body: 'Tabăra se bazează pe metode de învățare și cunoaștere inovative cum ar fi schimbarea de viziune, colaborare în echipă, brainstorming.'
					},
					{
						body: 'cine: adolescenți 13 – 18 ani\nunde: Bran, Pensiunea Mama Cozonacilor, la poalele masivului Bucegi\ncând: 1–10 august 2026 , 10 zile'
					},
					{
						body: 'Participarea la o tabără educațională de excelență în film și fotografie reprezintă pentru un adolescent pasionat de arte vizuale sau aflat în explorare, un context de afirmare personală, rafinare artistică și orientare vocațională. Este o experiență educațională completă – de la viziune la imagine, de la emoție la montaj – în care învață să creeze conținut artistic relevant, să lucreze în echipă și să-și descopere potențialul creativ.'
					},
					{
						body: 'La sfârșitul taberei, părinții sunt invitați să admire expoziția de fotografii și să vizioneze filmele realizate de adolescenți, într-o proiecție deschisă.'
					}
				],
				imageBetweenBlocks: introImage ?? undefined,
				imageAfterBlockIndex: 6
			}
		},
		{
			section: 'curriculum_areas',
			sortOrder: 3,
			payload: {
				title: 'Activitățile taberei',
				areas: [
					{
						title:
							'Competențe vizuale, tehnică și expresivitate – Adolescenții învață principiile fotografiei profesionale – compoziție, lumină, perspectivă, expunere – și modul în care acestea se traduc în expresie vizuală. Prin exerciții practice, explorări în natură și analiză critică, dezvoltă un mod de a privi lumea cu atenție și intenție. Activitatea stimulează creativitatea, perseverența și abilitatea de a transforma o idee într-o imagine cu sens, consolidând atât competențe tehnice, cât și o formă de alfabetizare vizuală esențială în era digitală.'
					},
					{
						title:
							'Editare foto. Portofoliu digital și proces creativ – Adolescenții învață să corecteze, să stilizeze și să finalizeze imagini prin tehnici profesionale de editare. Ca proiect, ei construiesc un portofoliu de fotografii care reflectă identitatea lor vizuală, iar prin feedback ghidat își dezvoltă gândirea critică, esteticul personal și capacitatea de a lucra în etape, de la concept la execuție.'
					},
					{
						title:
							'Cinematografie și editare video. Proiect de scurtmetraj – Fiecare participant parcurge întregul proces de creație a unui film de scurt metraj: scenariu, regie, cadre, sunet, filmare și montaj. Activitatea dezvoltă competențe reale de comunicare, colaborare, leadership și project-management, fiind o experiență completă de lucru atât individual cât și în echipă. Adolescenții descoperă cum să transforme o idee într-o poveste vizuală coerentă, cum să gestioneze responsabilități diverse și cum să-și exprime viziunea artistică într-un format cinematografic autentic.'
					},
					{
						title:
							'Coaching, susținere emoțională și motivațională adaptată. Observare și intervenție individuală – Pe parcursul întregii tabere, un coach observă dinamica fiecărui participant și intervine individual atunci când este necesar, pentru a sprijini motivația, claritatea, încrederea și echilibrul emoțional. Acest rol asigură continuitatea procesului de învățare și a proiectelor, prevenind blocajele cauzate de stres, demotivare sau lipsă de încredere. Suportul este oferit personalizat, acolo unde apare o nevoie reală, creând un cadru sigur în care adolescenții se pot exprima, recalibra și avansa în propriul ritm.'
					},
					{
						title:
							'Bazele comunicării strategice – Activitatea introduce adolescenții în principiile comunicării clare, intenționate și eficiente, esențiale în contexte academice, profesionale și sociale. Ei învață să își structureze mesajele în funcție de obiectiv, public și context, să diferențieze opinia de argument și să utilizeze limbajul verbal și nonverbal în mod conștient. Prin exerciții aplicate și situații reale de comunicare, adolescenții își dezvoltă capacitatea de a se exprima coerent, de a convinge prin raționament și de a construi relații bazate pe încredere și claritate.'
					},
					{
						title:
							'Drumeție și conectare în natură. Explorare activă și jurnalism de teren – Traseele montane, exercițiile de observație, momentele de reflecție și experiența off-road pe ruta Prăpăstiile Zărnești – Măgura – Amfiteatrul Transilvania oferă un prilej de a surprinde cadre deosebite pentru cele 2 proiecte de fotografie și film. Adolescenții exersează competențe de reportaj și interviu în teren, dezvoltând atenția, empatia, curiozitatea și capacitatea de documentare. Natura devine un spațiu de învățare experiențială, în care corpul, mintea și creativitatea lucrează împreună.'
					},
					{
						title:
							'Validarea vocației. Feedback personalizat de specialitate – Fiecare participant poate primi la cerere feedback din partea mentorilor de specialitate, în ultima zi a taberei, ca urmare a observării lor pe tot parcursul taberei; feedback-ul se poate oferi și părinților prezenți la festivitatea de încheiere a taberei din ultima zi. Astfel, atât adolescenții, dar și părinții, prin discuții individuale, obțin claritate asupra direcțiilor posibile de studiu sau carieră. Procesul sprijină luarea deciziilor informate, creșterea autonomiei și încrederea în propriul potențial.'
					},
					{
						title:
							'Debate și seri de comunitate. Dialog, relaxare și apartenență – Sesiunile de debate cultivă gândirea critică, argumentarea logică și capacitatea de a susține un punct de vedere cu respect și claritate. Serile de relaxare, focul de tabără și momentele de muzică favorizează conectarea, deschiderea și autenticitatea. Adolescenții descoperă ce înseamnă să faci parte dintr-o comunitate în care ideile, talentele și diferențele sunt valorizate.'
					},
					{
						title:
							'Rețea de adolescenți cu interese comune – Tabăra devine un cadru de formare a unei comunități reale, în care tinerii se întâlnesc cu alți adolescenți care împărtășesc valori, pasiunii și direcții de explorare similare. Relațiile care se creează contribuie la sentimentul de apartenență, sprijin reciproc și dezvoltare pe termen lung. Este o experiență care continuă dincolo de tabără, prin prietenii, proiecte comune și un mediu social constructiv.'
					}
				]
			}
		},
		{
			section: 'benefits_main',
			sortOrder: 4,
			payload: {
				title: 'Beneficii principale',
				items: [
					'Dezvoltarea unui portofoliu vizual autentic, util pentru orientare vocațională în arte vizuale, media și design',
					'Formarea competențelor tehnice esențiale în fotografie, editare și cinematografie, aplicabile în industriile creative',
					'Consolidarea gândirii critice și estetice prin analiză vizuală și procese creative ghidate',
					'Exersarea comunicării, colaborării și leadershipului prin realizarea unui proiect de scurtmetraj',
					'Creșterea autonomiei și clarificarea identității personale prin coaching individual și reflecție',
					'Dezvoltarea observației, documentării și expresivității prin explorare activă în natură și jurnalism de teren'
				],
				image: benefitsMainImage ?? undefined
			}
		},
		{
			section: 'gallery',
			sortOrder: 6,
			payload: {
				title: 'Galerie foto',
				images: galleryImageUrls.map((url, idx) => ({
					url,
					alt: `Galerie Film & Photo Advanced Learning ${idx + 1}`
				}))
			}
		},
		{
			section: 'transport',
			sortOrder: 7,
			payload: {
				title: 'Transport',
				body: 'Transportul de la București până la Moieciu de Sus se face cu trenul (gratuit în baza carnetului de elev) și cu mijloace de transport în comun / microbuz de la gara Brașov până la pensiune, în funcție de numărul de copii, contra cost. Se asigură însoțitor. Pentru adolescenții care vin din alte localități cu trenul în gara Brasov, rugămintea este să o contactați pe Mădălina. Prețul aproximativ este de 60 lei dus-întors.',
				contact: 'Detalii Mădălina Gavrilescu +40744.491.634'
			}
		},
		{
			section: 'location',
			sortOrder: 9,
			payload: {
				eyebrow: 'Locație',
				title: 'Pensiunea Mama Cozonacilor 3***, Bran',
				body: 'Mama Cozonacilor este o pensiune de 3 stele situată în Bran, la poalele Muntilor Bucegi, la peste 900m altitudine, în apropierea pădurii. Are o curte privată cu teren de joacă, un foișor acoperit, 2 săli de conferințe, restaurant propriu, wi-fi. Camerele sunt dotate cu televizor, baie proprie cu duș, uscător de păr, pat matrimonial și unele cu balcon.',
				closing: '9,5 on — https://mamacozonacilor.ro/',
				amenities: [
					'Teren de joacă',
					'Foișor acoperit',
					'Săli de conferințe',
					'Restaurant',
					'Wi-fi',
					'Televizor',
					'Baie proprie cu duș',
					'Pat matrimonial',
					'Balcon'
				],
				image: locationImage ?? undefined,
				images: locationGridUrls.length > 0 ? locationGridUrls : undefined
			}
		},
		{
			section: 'enrollment',
			sortOrder: 10,
			payload: {
				title: 'Înscriere',
				intro:
					'Înscrierea în tabăra Kogaion Film & Photo Advanced Learning presupune o primă discuție cu reprezentanții Kogaion, pentru stabilirea împreună a măsurii în care tabăra este potrivită pentru copilul dvs. și pentru ghidarea către programul educațional care se potrivește cel mai bine copilului dvs.\n\nOfertă personalizată pentru grupuri de minim 5 copii.',
				steps: [],
				contactNote:
					'Te rugăm să completezi formularul de detalii pentru a fi contactat sau sună la 0720.529.398 (Diana Antoci – consultant educațional)',
				buttons: [
					{ label: 'Sună', type: 'tel', value: '0720529398' },
					{ label: 'Cere detalii', type: 'link', href: '/contact' },
					{ label: 'Formular de înscriere', type: 'link', href: '/contact' }
				]
			}
		}
	];
}

async function main() {
	await mkdir(UPLOAD_DIR, { recursive: true });

	const client = postgres(databaseUrl);
	const db = drizzle(client);

	const [p] = await db.select().from(program).where(eq(program.slug, PROGRAM_SLUG)).limit(1);
	if (!p) {
		console.error('Program not found:', PROGRAM_SLUG);
		process.exit(1);
	}
	const programId = p.id;

	let introImage: string | null = null;
	{
		const name = 'film-and-photo-advanced-learning-intro-main.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(INTRO_IMAGE_URL, localPath);
			introImage = `${LOCAL_BASE}/${name}`;
			console.log('  Intro image', name);
		} catch (e) {
			console.warn('  Skip intro image', e);
		}
	}

	let benefitsMainImage: string | null = null;
	{
		const name = 'film-and-photo-advanced-learning-benefits-main.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(BENEFITS_MAIN_IMAGE_URL, localPath);
			benefitsMainImage = `${LOCAL_BASE}/${name}`;
			console.log('  Benefits main', name);
		} catch (e) {
			console.warn('  Skip benefits image', e);
		}
	}

	const galleryImageUrls: string[] = [];
	for (let i = 0; i < GALLERY_IMAGE_URLS.length; i++) {
		const url = GALLERY_IMAGE_URLS[i];
		const name = `film-and-photo-advanced-learning-gallery-${String(i + 1).padStart(2, '0')}.webp`;
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(url, localPath);
			galleryImageUrls.push(`${LOCAL_BASE}/${name}`);
			console.log('  Gallery', name);
		} catch (e) {
			console.warn('  Skip gallery', name, e);
		}
	}

	let locationImage: string | null = null;
	{
		const name = 'film-and-photo-advanced-learning-location-main.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(LOCATION_IMAGE_URL, localPath);
			locationImage = `${LOCAL_BASE}/${name}`;
			console.log('  Location main', name);
		} catch (e) {
			console.warn('  Skip location image', e);
		}
	}

	const locationGridUrls: string[] = [];
	for (let i = 0; i < LOCATION_GRID_IMAGE_URLS.length; i++) {
		const url = LOCATION_GRID_IMAGE_URLS[i];
		const name = `film-and-photo-advanced-learning-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(url, localPath);
			locationGridUrls.push(`${LOCAL_BASE}/${name}`);
			console.log('  Location grid', name);
		} catch (e) {
			console.warn('  Skip location grid', name, e);
		}
	}

	console.log('Linking mentors...');
	await db.delete(programMentor).where(eq(programMentor.programId, programId));
	let linked = 0;
	for (const slug of MENTOR_SLUGS) {
		const [m] = await db.select().from(mentor).where(eq(mentor.slug, slug)).limit(1);
		if (m) {
			await db.insert(programMentor).values({ programId, mentorId: m.id });
			linked++;
		} else {
			console.warn('  Mentor slug not found:', slug);
		}
	}
	console.log('  Linked', linked, 'mentors');

	console.log('Upserting program sections (RO)...');
	await db.delete(programSection).where(eq(programSection.programId, programId));
	const sections = buildSectionPayloads(
		introImage,
		benefitsMainImage,
		galleryImageUrls,
		locationImage,
		locationGridUrls
	);
	for (const { section, sortOrder, payload } of sections) {
		await db.insert(programSection).values({
			programId,
			section,
			locale: 'ro',
			sortOrder,
			payload: payload as object
		});
	}
	console.log('  Inserted', sections.length, 'sections');

	await client.end();
	console.log('Done.');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
