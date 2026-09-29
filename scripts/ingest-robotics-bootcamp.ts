/**
 * Ingest content and assets for the kogaion-robotics-bootcamp-2 program.
 *
 * Source of truth: https://kogaionacademy.ro/programe/kogaion-robotics-bootcamp-2/
 *
 * Run: bun --env-file=.env scripts/ingest-robotics-bootcamp.ts
 */
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import sharp from 'sharp';
import {
	mentor,
	program,
	programLocale,
	programMentor,
	programSection
} from '../src/lib/server/db/schema';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const PROGRAM_SLUG = 'kogaion-robotics-bootcamp-2';
const PROGRAM_DIR_SLUG = 'kogaion-robotics-bootcamp-2';
const UPLOAD_DIR = join(process.cwd(), 'static', 'media', 'uploads', 'programe', PROGRAM_DIR_SLUG);
const LOCAL_BASE = `/media/uploads/programe/${PROGRAM_DIR_SLUG}`;

/** Lead image of the intro narrative. */
const INTRO_IMAGE_URL = 'https://kogaionacademy.ro/wp-content/uploads/2024/06/H1R8478-1-scaled.jpg';
/** Image sitting directly above the „Activitățile taberei” heading. */
const ACTIVITIES_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/WhatsApp-Image-2024-02-13-at-19.21.45-1.jpeg';
/** Image closing the „Beneficii principale” block. */
const BENEFITS_MAIN_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-14-at-11.03.57.jpeg';

const GALLERY_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-29-at-18.53.05.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/09/20210226_150854-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG-20230121-WA0018.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2274.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/DSC09230-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/09/rob1-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-14-at-19.42.37-2.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-14-at-19.42.37.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-17-at-16.36.15.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-24.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240727_102730-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/IMG_5943-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2298-1.jpg'
];

const LOCATION_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/Moeciu_de_Sus_Preda_Nicoleta_1500507016.10675311.jpg';
const LOCATION_GRID_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/3.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/5.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/foto_079.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/7.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/4.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/2.jpg'
];

/**
 * Mentor slugs from the „Mentorii copilului tău” block (page order preserved).
 * NOT linked: Smaranda Andronic (profesor robotică)
 * — no matching mentor row in the database.
 */
const MENTOR_SLUGS = ['diana-antoci', 'alin-mardare', 'andrei-stan', 'constantin-caprioreanu'];

async function downloadAndConvertToWebp(url: string, localPath: string): Promise<void> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
	const buf = await res.arrayBuffer();
	await sharp(Buffer.from(buf)).webp({ quality: 84 }).toFile(localPath);
}

function buildSectionPayloads(
	galleryImageUrls: string[],
	introImage: string | null,
	activitiesImage: string | null,
	locationImage: string | null,
	locationGridUrls: string[],
	benefitsMainImage: string | null
): Array<{ section: string; sortOrder: number; payload: Record<string, unknown> }> {
	return [
		{
			section: 'hero_highlights',
			sortOrder: 0,
			payload: {
				items: [
					'Robotică Arduino',
					'Fizică experimentală',
					'Cunoaștere de sine',
					'Problem solving',
					'Conectare în natură'
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
						body: 'KOGAION ROBOTICS BOOTCAMP este o experiență educațională integrată, în care știința, arta și natura devin mijloace prin care copiii învață să gândească logic, să creeze cu sens și să trăiască în echilibru. Prin robotică, fizică experimentală, proiecte de autocunoaștere și activități în natură, ei își dezvoltă curiozitatea, încrederea, perseverența și bucuria de a descoperi lumea – devenind exploratori ai cunoașterii și ai propriei lor vieți.'
					},
					{
						body: 'KOGAION ROBOTICS BOOTCAMP nu este doar o tabără de știință — este laboratorul viu unde copilul învață să gândească, să simtă și să creeze în armonie cu lumea din jurul lui.'
					},
					{
						body: 'Taberele educaționale Kogaion pentru copii de 7-12 ani au structură triangulară unică și combină:\n- Cunoașterea de sine\n- Activitățile de enrichment experiențiale organizate ca proiecte multi și trans-disciplinare, cu curriculum propriu\n- Conectarea în natură'
					},
					{
						body: 'Taberele Kogaion pentru copii de 7-12 ani sunt locul unde copilul tău …\n- Învață aplicat, explorează conștient și își descoperă direcția personală de dezvoltare\n- Își antrenează inteligența emoțională, gândirea critică și capacitatea de exprimare autentică în cadrul unui program unic de cunoaștere de sine, „Semințele Bucuriei”\n- Se conectează cu natura și cu o comunitate bazată pe empatie și cooperare'
					}
				],
				imageBetweenBlocks: introImage ?? undefined,
				imageAfterBlockIndex: 1
			}
		},
		{
			section: 'curriculum_areas',
			sortOrder: 3,
			payload: {
				title: 'Activitățile taberei',
				image: activitiesImage ?? undefined,
				areas: [
					{
						title:
							'Robotică și gândire algoritmică – Copiii învață să construiască și să programeze sisteme reale, folosind senzori, leduri, motoare și plăcuțe Arduino. Prin aplicarea principiilor de inginerie, electronică și logică algoritmică, își dezvoltă gândirea critică, perseverența, capacitatea de rezolvare a problemelor și încrederea în propriile abilități. Este un spațiu în care știința prinde viață în mâinile lor, transformându-i în creatori, nu doar în utilizatori de tehnologie.'
					},
					{
						title:
							'Fizică experimentală – Prin experimente interactive, copiii descoperă fenomenele care guvernează lumea – magnetismul, electricitatea, forțele, presiunea. Învață să observe, să formuleze ipoteze, să pună întrebări și să tragă concluzii, stimulându-le curiozitatea științifică și înțelegerea relației cauză–efect. Această abordare dezvoltă gândirea logică, dar și capacitatea de a face legături între știință și viața cotidiană.'
					},
					{
						title:
							'Cunoaștere de sine. Proiect problem solving „Semințele Bucuriei” – Copiii descoperă, prin joc, reflecție și creație, cum să recunoască și să mențină starea de bucurie autentică, indiferent de context. Ei învață să transforme emoțiile, curiozitatea și experiențele vieții în resurse de echilibru, curaj și sens interior, pe care le vor purta cu ei toată viața. Copiii dobândesc instrumente practice de autoreglare emoțională, autocunoaștere și reziliență.'
					},
					{
						title:
							'Drumeție și conectare în natură – Activitățile outdoor zilnice – înviorarea de dimineață, traseele montane, momentele de reflecție, jocurile de atenție și relaționare, creează un cadru de echilibru între corp și minte. Copiii învață să-și asculte corpul, să observe mediul înconjurător și să dezvolte o relație armonioasă cu lumea naturală. Acest tip de conectare directă favorizează prezența, liniștea interioară și adaptabilitatea.'
					},
					{
						title:
							'Carnavalul și serile la foc de tabără completează experiența educațională cu momente de joacă, dans și apartenență la o comunitate autentică.'
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
					'**Învață să gândească logic și creativ în același timp.** Copilul își formează o minte capabilă să lege rațiunea de imaginație: în robotică și fizică experimentează legile lumii, iar în artă le transformă în expresie personală.',
					'**Dobândește curajul de a explora și de a greși.** Activitățile practice și proiectele STEAM îl învață că fiecare încercare este o etapă în învățare – dezvoltând perseverență, autonomie și încredere în propriile capacități.',
					'**Descoperă bucuria de a învăța și de a trăi conștient.** Prin știință, reflecție și joc, copilul învață că lumea nu este doar de cunoscut, ci și de trăit cu sens, dezvoltând o relație sănătoasă între minte, corp și suflet.'
				],
				image: benefitsMainImage ?? undefined
			}
		},
		{
			section: 'benefits_secondary',
			sortOrder: 5,
			payload: {
				title: 'Beneficii secundare',
				items: [
					'**Își dezvoltă gândirea sistemică și atenția la detaliu.** Învață să observe legături între fenomene, să formuleze ipoteze și să găsească soluții prin raționament și experiment.',
					'**Își exprimă emoțiile și ideile prin forme vizuale și simbolice.** Arta și creativitatea devin instrumente de introspecție și comunicare autentică, sprijinind dezvoltarea inteligenței emoționale.',
					'**Își construiește echilibrul interior și prezența.** Activitățile outdoor, proiectul „Semințele Bucuriei” și momentele de reflecție îi oferă copilului instrumente de calm, concentrare și reziliență.'
				]
			}
		},
		{
			section: 'gallery',
			sortOrder: 6,
			payload: {
				title: 'Galerie foto',
				images: galleryImageUrls.map((url, idx) => ({
					url,
					alt: `Galerie Robotics Bootcamp Kogaion ${idx + 1}`
				}))
			}
		},
		{
			section: 'transport',
			sortOrder: 7,
			payload: {
				title: 'Transport',
				body: 'Transportul de la București până la Moieciu de Sus se face cu trenul (gratuit în baza carnetului de elev) și cu mijloace de transport în comun / microbuz de la gara Brașov până la pensiune, în funcție de numărul de copii, contra cost. Se asigură însoțitor. Prețul aproximativ este de 60 lei dus-întors.',
				contact: 'Mădălina Gavrilescu +40744.491.634'
			}
		},
		{
			section: 'menu',
			sortOrder: 8,
			payload: {
				title: 'Meniu',
				body: 'Meniul este prestabilit în 2 variante, una tradițională și una vegetariană. Mâncarea se gătește în bucătăria proprie a restaurantului. Pentru copiii cu alergii, se asigură meniu separat.'
			}
		},
		{
			section: 'location',
			sortOrder: 9,
			payload: {
				title: 'Locație',
				subtitle: 'Pensiunea Nicoleta Moieciu de Sus 3***, Moieciu de Sus',
				address: 'Moieciu de Sus, Pensiunea Nicoleta Moieciu de Sus, la poalele masivului Bucegi',
				body: 'Pensiunea este localizata la poalele muntilor Bucegi, la 45 km. de Brasov, la 3 km. de intrarea in Parcul National Bucegi. Pensiunea dispune de 2 cladiri. Camerele sunt de 2 locuri cu paturi matrimoniale, 3 locuri cu un pat matrimonial si un pat single si apartamente de 4 locuri. Fiecare camera este dotata cu baie proprie cu dus, balcon, TV cu televiune prin cablu, internet wireless. In curtea pensiunii exista amenajat un spatiu de joaca pentru copii, un foisor, o sala de jocuri cu biliard, ping-pong, terasa, parcare, foisor suspendat, restaurant.',
				amenities: ['Terasă', 'Restaurant'],
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
					'Înscrierea în tabăra Kogaion Robotics Bootcamp – presupune o discuție cu un reprezentant Kogaion Academy, pentru stabilirea împreună a măsurii în care tabăra este potrivită pentru copilul dvs. și pentru ghidarea către programul educațional care se potrivește cel mai bine copilului dvs.',
				steps: [],
				contactNote:
					'Te rugăm să completezi formularul de detalii pentru a fi contactat sau sună la +40744.988.330 (Irina Nicolaescu – consultant)',
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

	await db
		.update(programLocale)
		.set({
			title: 'Kogaion Robotics Bootcamp',
			ageRange: 'copii 7-9 ani și 10-12 ani',
			datesText: '21–26 iunie 2026, 6 zile, Moieciu de Sus',
			durationText: '6 zile',
			locationText: 'Moieciu de Sus'
		})
		.where(and(eq(programLocale.programId, programId), eq(programLocale.locale, 'ro')));

	let introImage: string | null = null;
	{
		const name = 'kogaion-robotics-bootcamp-2-intro-main.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(INTRO_IMAGE_URL, localPath);
			introImage = `${LOCAL_BASE}/${name}`;
			console.log('  Intro image', name);
		} catch (e) {
			console.warn('  Skip intro image', e);
		}
	}

	let activitiesImage: string | null = null;
	{
		const name = 'kogaion-robotics-bootcamp-2-activities-main.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(ACTIVITIES_IMAGE_URL, localPath);
			activitiesImage = `${LOCAL_BASE}/${name}`;
			console.log('  Activities image', name);
		} catch (e) {
			console.warn('  Skip activities image', e);
		}
	}

	let benefitsMainImage: string | null = null;
	{
		const name = 'kogaion-robotics-bootcamp-2-benefits-main.webp';
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
		const name = `kogaion-robotics-bootcamp-2-gallery-${String(i + 1).padStart(2, '0')}.webp`;
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
		const name = 'kogaion-robotics-bootcamp-2-location-main.webp';
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
		const name = `kogaion-robotics-bootcamp-2-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
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
		galleryImageUrls,
		introImage,
		activitiesImage,
		locationImage,
		locationGridUrls,
		benefitsMainImage
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
