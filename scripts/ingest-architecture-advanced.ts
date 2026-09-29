/**
 * Ingest content and assets for the architecture-advanced-learning program.
 * - Inserts program_section rows (RO) with full content from kogaionacademy.ro.
 * - Downloads the intro / benefits / gallery / location media to
 *   static/media/uploads/programe/architecture-advanced-learning/
 * - Links mentors for this program.
 *
 * Source page: https://kogaionacademy.ro/programe/architecture-advanced-learning/
 * The page has no "Beneficii secundare" and no "Meniu" block, so those sections
 * are intentionally not emitted. The cover image already exists on disk and is
 * referenced from src/lib/programs-data.ts, so it is not re-downloaded.
 *
 * Run: bun run scripts/ingest-architecture-advanced.ts
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

const PROGRAM_SLUG = 'architecture-advanced-learning';
const UPLOAD_DIR = join(
	process.cwd(),
	'static',
	'media',
	'uploads',
	'programe',
	'architecture-advanced-learning'
);
const LOCAL_BASE = '/media/uploads/programe/architecture-advanced-learning';

/**
 * Mentor slugs from the Architecture Advanced Learning page (order preserved).
 * The page lists 8 mentors. "Adriana Niculina Sîngeap", "Vlad Andrei Răducanu"
 * and "Sara Iosub" have no matching row in the mentor table and are therefore
 * not linked.
 */
const MENTOR_SLUGS = [
	'george-grama',
	'alina-monica-antoci',
	'andrei-stan',
	'madalina-gavrilescu',
	'constantin-caprioreanu'
];

/** Image shown between the intro blocks. */
const INTRO_IMAGE_URL = 'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09787.jpg';

/** Main image shown under "Beneficii principale". */
const BENEFITS_MAIN_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09408-1.jpg';

/** Gallery image URLs, in the exact order listed on the page. */
const GALLERY_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09410.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC00250.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09391.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09385.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC00254.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09375.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC00255.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09830.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09741.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09284.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC00252.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09838.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09327.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09371.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC00259.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09274.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC00263.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC00248.jpg'
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
					'Desen tehnic și de observație',
					'Proiectare arhitecturală',
					'Proiectare, construcție labirint',
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
						body: 'Un loc unde adolescenții își descoperă și validează menirea în viață.'
					},
					{
						body: '10 zile – O EXPERIENTĂ TRANSFORMAȚIONALĂ PENTRU VIAȚĂ, UN EXERCIȚIU DE VIZIUNE SPAȚIALĂ, CONSTRUCȚIE ȘI IDENTITATE ESTETICĂ, în care adolescenții își DEZVOLTĂ PASIUNEA pentru ARHITECTURĂ, dobândind pre-rechizite esențiale de DESEN, MACHETARE, CONSTRUCȚIE, DEZVOLTARE PERSONALĂ, COMUNICARE STRATEGICĂ și RELAȚIONARE POZITIVĂ.'
					},
					{
						body: 'Participarea la o tabără educațională de excelență în arhitectură reprezintă pentru orice adolescent pasionat sau nu de arte, design sau construcție o experiență transformațională, care potențează creativitatea, disciplina și spiritul explorator al fiecăruia.'
					},
					{
						body: 'cine: adolescenți 13 – 18 ani, Perioade: 1-10 august - SOLD OUT; 21-30 august 2026 - SOLD OUT\nunde: Bran, Pensiunea Mama Cozonacilor, la poalele masivului Bucegi\ncând: 21–30 august 2026 , 10 zile'
					},
					{
						body: 'Tabăra oferă un echilibru perfect între rigurozitatea formării arhitecturale și libertatea gândirii în natură, un context ideal pentru formarea viitorilor arhitecți, designeri sau lideri în industrii creative.'
					}
				],
				imageBetweenBlocks: introImage ?? undefined,
				imageAfterBlockIndex: 4
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
							'Desen tehnic (perspectivă și axonometrie), desen de observație – Atelierul îi introduce pe adolescenți în limbajul fundamental al arhitecturii: desenul ca instrument de analiză, comunicare și conceptualizare. Ei învață să observe spațiul cu acuratețe, să traducă volume în linii clare și proporții corecte și să lucreze cu diferite tipuri de perspectivă (frontală, oblică, aeriană). Exersarea desenului tehnic dezvoltă rigoarea, atenția la detaliu și gândirea tridimensională, în timp ce desenul de observație cultivă sensibilitatea vizuală, răbdarea și capacitatea de a surprinde structura unui obiect sau a unui peisaj. Este o bază esențială pentru orice tânăr interesat de arhitectură, design sau arte vizuale.'
					},
					{
						title:
							'Proiectare arhitecturală. Elaborare machetă la standarde universitare – Adolescenții parcurg procesul real al proiectării arhitecturale, de la concept și schiță la modelarea volumetrică și realizarea unei machete profesionale. Învață să analizeze contextul, să formuleze o idee de proiect, să gestioneze funcțiunile spațiului, circulațiile, proporțiile și relațiile dintre interior și exterior. Construirea machetei – cu materiale, tehnici și criterii utilizate în mediul universitar – dezvoltă disciplina, coordonarea, precizia, rezolvarea creativă a problemelor și capacitatea de a transpune gândirea abstractă într-o formă concretă. Este un exercițiu complet de arhitectură aplicată, care consolidează autonomia și viziunea personală.'
					},
					{
						title:
							'Construcție arhitecturală. Proiectarea și construcția unui labirint și a pavilioanelor sale din lemn și stuf la scara 1:1 – Participanții experimentează arhitectura la scară reală, proiectând și construind un labirint arhitectural și pavilioanele sale, utilizând lemn, stuf și tehnici tradiționale de structurare. Activitatea îi introduce în logica materialelor, în principiile de rezistență, stabilitate, volumetrie și organizare spațială. Lucrul în echipă, planificarea și execuția fizică le dezvoltă responsabilitatea, atenția la siguranță, coordonarea și încrederea în capacitatea lor de a crea structuri reale. Este o experiență unică, în care arhitectura devine tangibilă, iar adolescenții înțeleg forța creativă și transformatoare a designului construit în mediul natural.'
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
							'Drumeție și conectare în natură. Explorare activă – Drumețiile zilnice, exercițiile de observație și momentele de reflecție în aer liber oferă adolescenților un cadru natural de echilibru și autocunoaștere. Prin explorare activă ei își dezvoltă prezența, reziliența fizică și capacitatea de a rămâne ancorați în propriile resurse interioare. Activitatea stimulează adaptabilitatea, cooperarea și înțelegerea interdependenței dintre corp, minte și mediul înconjurător.'
					},
					{
						title:
							'Validarea vocației. Feedback personalizat de specialitate – Fiecare participant și părinte poate primi la cerere feedback din partea mentorilor de specialitate, în ultima zi a taberei, asupra abilităților și direcțiilor posibile de studiu sau carieră. Procesul sprijină luarea deciziilor informate, creșterea autonomiei și încrederea în propriul potențial.'
					},
					{
						title:
							'Debate și seri de comunitate. Dialog, relaxare și apartenență – Sesiunile de debate cultivă gândirea critică, argumentarea logică și capacitatea de a susține un punct de vedere cu respect și claritate. Serile de relaxare, focul de tabără și momentele de muzică favorizează conectarea, deschiderea și autenticitatea. Adolescenții descoperă ce înseamnă să faci parte dintr-o comunitate în care ideile, talentele și diferențele sunt valorizate.'
					},
					{
						title:
							'Rețea de adolescenți cu interese comune – Tabăra devine un cadru de formare a unei comunități reale, în care tinerii se întâlnesc cu alți adolescenți care împărtășesc valori, pasiuni și direcții de explorare similare. Relațiile care se creează contribuie la sentimentul de apartenență, sprijin reciproc și dezvoltare pe termen lung. Este o experiență care continuă dincolo de tabără, prin prietenii, proiecte comune și un mediu social constructiv.'
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
					'Dezvoltarea gândirii spațiale și a competențelor vizuale esențiale pentru arhitectură și design',
					'Formarea practicii de proiectare prin realizarea unei machete la standard universitar',
					'Experiență aplicată de construcție la scară reală, care consolidează autonomia tehnică și colaborarea',
					'Creșterea rigoarei, atenției la detaliu și capacității de rezolvare creativă a problemelor',
					'Clarificarea potențialului vocațional în arhitectură, urbanism și profesii conexe prin feedback specializat',
					'Dezvoltarea rezilienței, adaptabilității și observației prin explorare activă în natură'
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
					alt: `Galerie Architecture Advanced Learning ${idx + 1}`
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
					'Înscrierea în tabăra Kogaion Architecture Advanced Learning – presupune o primă discuție cu reprezentanții Kogaion, pentru stabilirea împreună a măsurii în care tabăra este potrivită pentru copilul dvs. și pentru ghidarea către programul educațional care se potrivește cel mai bine copilului dvs.\n\nOfertă personalizată pentru grupuri de minim 5 copii.',
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
		const name = 'architecture-advanced-learning-intro-main.webp';
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
		const name = 'architecture-advanced-learning-benefits-main.webp';
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
		const name = `architecture-advanced-learning-gallery-${String(i + 1).padStart(2, '0')}.webp`;
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
		const name = 'architecture-advanced-learning-location-main.webp';
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
		const name = `architecture-advanced-learning-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
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
