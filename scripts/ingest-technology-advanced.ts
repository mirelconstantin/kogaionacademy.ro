/**
 * Ingest content and assets for the technology-advanced-learning program.
 * - Inserts program_section rows (RO) with full content from kogaionacademy.ro.
 * - Downloads the intro / benefits / gallery / location media to
 *   static/media/uploads/programe/technology-advanced-learning/
 * - Links mentors for this program.
 *
 * Source page: https://kogaionacademy.ro/programe/technology-advanced-learning/
 * The page has no "Beneficii secundare" and no "Meniu" block, so those sections
 * are intentionally not emitted. The cover image already exists on disk and is
 * referenced from src/lib/programs-data.ts, so it is not re-downloaded.
 *
 * Run: bun run scripts/ingest-technology-advanced.ts
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

const PROGRAM_SLUG = 'technology-advanced-learning';
const UPLOAD_DIR = join(
	process.cwd(),
	'static',
	'media',
	'uploads',
	'programe',
	'technology-advanced-learning'
);
const LOCAL_BASE = '/media/uploads/programe/technology-advanced-learning';

/**
 * Mentor slugs from the Technology Advanced Learning page (order preserved).
 * The page lists 6 mentors. "Petre Butunoi-Olteanu" has no matching row in the
 * mentor table and is therefore not linked.
 */
const MENTOR_SLUGS = [
	'iulian-glita',
	'andrei-stan',
	'alina-monica-antoci',
	'madalina-gavrilescu',
	'constantin-caprioreanu'
];

/** Image shown between the intro blocks. */
const INTRO_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.12-4-scaled.jpeg';

/** Main image shown under "Beneficii principale". */
const BENEFITS_MAIN_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.22-76.jpeg';

/** Gallery image URLs, in the exact order listed on the page. */
const GALLERY_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.23-97.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/10/IMG_5109-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.46-113-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/10/DSC04738-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/10/DSC04428-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/10/20231105_000039-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2023-05-13-at-09.19.56.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/10/DSC04755-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG_3729-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/10/DSC04322-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.47-122-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.04.54-23.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.04.54-22.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-24.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.46-109-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-23.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-22.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-21.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-11.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-20.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-19.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-18.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-17.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-16.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-15.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-14.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-11.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-9.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-8.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-7.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-6.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-5.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-4.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-3.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-05-06-at-20.00.18-2.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.12-8-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.12-10-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.14-35-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.15-50-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.22-76.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.22-77.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.22-81.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.46-109-scaled.png',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.46-110-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.46-111-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.46-112-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.24.46-115-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.25.00-123-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.25.00-124-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.25.00-125-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.25.00-126-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.25.00-128-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.25.21-130-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.25.22-134-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2026-04-24-at-18.25.22-139-scaled.jpeg'
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
					'Programare Python, C++',
					'Robotică Arduino',
					'Electronică digitală & analogică',
					'Spectacol de teatru',
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
						body: 'Activitățile taberei se desfășoară la nivel academic și sunt potrivite pentru adolescenții care caută să își valideze direcția de pasiune și pentru cei care vin să își dezvolte abilitățile de tehnologie: programare, robotică, electronică.'
					},
					{
						body: '10 zile – O EXPERIENTĂ TRANSFORMAȚIONALĂ PENTRU VIAȚĂ, UN EXERCIȚIU DE VIZIUNE, CONSTRUCȚIE ȘI IDENTITATE'
					},
					{
						body: 'Participarea la o tabără academică de excelență reprezintă pentru adolescenții pasionați de tehnologie o experiență transformatoare complexă, ce le oferă oportunitatea de a integra cunoașterea teoretică și practică prin proiecte multi și transdisciplinare, care facilitează validarea vocației personale și dezvoltarea abilităților tehnologice, sociale și personale prin învățare experiențială, colaborare și mentorat academic, într-un mediu inovativ și orientat spre performanță.'
					},
					{
						body: 'cine: adolescenți 13 – 18 ani\nunde: Bran, Pensiunea Mama Cozonacilor, la poalele masivului Bucegi\ncând: 21–30 august 2026 , 10 zile'
					},
					{
						body: 'Contribuția taberei la parcursul vocațional, creativ și personal al adolescentului:'
					},
					{
						body: '1. Clarificarea direcției vocaționale prin expunere directă la domeniul de specialitate și mentorat aplicat'
					},
					{
						body: '2. Dezvoltarea gândirii critice, analitice și creative prin proiecte complexe și inovative'
					},
					{
						body: '3. Consolidarea autonomiei și încrederii în sine prin proiecte colaborative, asumarea responsabilității și exprimării personale'
					},
					{
						body: '4. Formarea unei mentalități orientate spre excelență'
					},
					{
						body: '5. Susținerea dezvoltării personale și emoționale prin coaching, mentorat și reflecție ghidată'
					},
					{
						body: '6. Cultivarea echilibrului interior și a conexiunii cu natura ca fundamente ale rezilienței și adaptabilității'
					}
				],
				imageBetweenBlocks: introImage ?? undefined,
				imageAfterBlockIndex: 10
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
							'Proiect transdisciplinar „CASA SMART” – Adolescenții vor lucra în echipe pentru a construi o machetă funcțională de casă inteligentă, unde vor integra tot ce au învățat: Sisteme electronice și senzori • Programe care controlează funcțiile casei • Elemente de automatizare și reacție la mediu • Integrare AI pentru eficiență și autonomie'
					},
					{
						title:
							'Electronică analogică și digitală – Adolescenții vor învăța cum funcționează circuitele electrice de bază și cum pot fi acestea folosite pentru a controla lumini, senzori sau motoare. Vor folosi componente tehnice precum plăci Arduino, ESP32, motoare, senzori cu diferite funcționalități, leduri și multe multe altele, și vor înțelege cum să conecteze și să folosească aceste piese pentru a construi sisteme electronice simple și eficiente.'
					},
					{
						title:
							'Programare Python și C++ – cum gândește un calculator – Adolescenții vor învăța cum se scrie un program, cum se face o automatizare și cum se corectează greșelile din cod, vor crea programe care controlează funcții reale din machetele construite – aprinderea unei lumini, măsurarea temperaturii sau deschiderea unei uși inteligente.'
					},
					{
						title:
							'Robotică – viață pentru proiectele lor – Adolescenții vor învăța să dea „viață” proiectelor lor, folosind proiecte simple sau sisteme automate create cu plăci de dezvoltare (Arduino). Vor înțelege cum pot face un sistem să răspundă la comenzi sau la informații din mediu – de exemplu, să aprindă o lumină când este întuneric sau să transmită date despre eventuale condiții nefavorabile sau periculoase pentru un nivel optim de confort.'
					},
					{
						title:
							'Inteligență Artificială – ce este și cum o putem folosi – Adolescenții vor învăța cum putem folosi inteligența artificială pentru a dezvolta și îmbunătăți programele pe care le folosim în proiectele lor. Vor descoperi cum AI poate identifica erori din cod, poate propune soluții mai eficiente, cum ne poate ajuta să facem modificări mai rapid și mai clar, devenind un sprijin real în procesul de construire și optimizare a proiectelor tehnice.'
					},
					{
						title:
							'Punerea în scenă a spectacolului „Visul unei nopți de vară”, W. Shakespeare – În paralel cu explorările tehnologice, adolescenții lucrează la un proiect artistic inspirat din „Visul unei nopți de vară”, care le dezvoltă expresivitatea, lucrul în echipă, comunicarea și capacitatea de a transforma un text clasic într-o experiență scenică actuală. Ei explorează roluri, dinamici relaționale, gestualitate, voce și construcția emoției pe scenă. Această activitate echilibrează formarea tehnică și deschide un spațiu pentru imaginație, sensibilitate și leadership creativ.'
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
					'Dezvoltarea competențelor digitale avansate (programare, robotică, AI) aplicate în proiecte reale',
					'Formarea gândirii inginerești prin proiectarea și realizarea unei case smart funcționale',
					'Consolidarea logicii algoritmice și a capacității de rezolvare a problemelor complexe',
					'Exersarea creativității tehnice și colaborării prin integrarea soluțiilor inteligente în sisteme funcționale',
					'Dezvoltarea comunicării, expresivității și leadershipului creativ prin proiectul de artă dramatică',
					'Clarificarea direcției vocaționale în inginerie, IT, robotică și industrii creative prin feedback specializat'
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
					alt: `Galerie Technology Advanced Learning ${idx + 1}`
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
					'Înscrierea în tabăra Kogaion Technology Advanced Learning presupune o primă discuție cu reprezentanții Kogaion, pentru stabilirea împreună a măsurii în care tabăra este potrivită pentru copilul dvs. și pentru ghidarea către programul educațional care se potrivește cel mai bine copilului dvs.\n\nOfertă personalizată pentru grupuri de minim 5 copii.',
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
		const name = 'technology-advanced-learning-intro-main.webp';
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
		const name = 'technology-advanced-learning-benefits-main.webp';
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
		const name = `technology-advanced-learning-gallery-${String(i + 1).padStart(2, '0')}.webp`;
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
		const name = 'technology-advanced-learning-location-main.webp';
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
		const name = `technology-advanced-learning-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
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
