/**
 * Ingest content and assets for the kogaion-engineer-bootcamp-2 program.
 *
 * Source of truth: https://kogaionacademy.ro/programe/kogaion-engineer-bootcamp-2/
 * Cross-checked against blogs/references/Program_Kogaion_Engineer_Bootcamp_Advanced_Reference.{md,json}.
 *
 * Run: bun --env-file=.env scripts/ingest-engineer-bootcamp.ts
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

const PROGRAM_SLUG = 'kogaion-engineer-bootcamp-2';
const PROGRAM_DIR_SLUG = 'kogaion-engineer-bootcamp-2';
const UPLOAD_DIR = join(process.cwd(), 'static', 'media', 'uploads', 'programe', PROGRAM_DIR_SLUG);
const LOCAL_BASE = `/media/uploads/programe/${PROGRAM_DIR_SLUG}`;

/** Lead image of the intro narrative. */
const INTRO_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240728_104146-scaled.jpg';
/** Image sitting directly above the „Activitățile taberei” heading. */
const ACTIVITIES_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/WhatsApp-Image-2025-07-25-at-10.27.20-scaled.jpeg';
/** Image closing the „Beneficii principale” block. */
const BENEFITS_MAIN_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-23-at-00.02.56-scaled.jpeg';

const GALLERY_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240728_112148-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240728_104751-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240802_204043-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2298-1.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/11/017-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/Elemente-3-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240802_191014-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/11/IMG_20210710_203838-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240729_105128-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/11/20210724_204423-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/11/2021-07-12_17.36.04-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240728_114138-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/11/060-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/07/oven-1.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/07/1720800139612-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/11/2021-07-12_11.25.42-1-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/07/1720800139698-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/07/1720800139822-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/07/1720800139786-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/07/oven-2.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/07/at-work-6.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/07/at-work-5.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/07/at-work-4.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/07/at-work-3.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_0163-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240727_104742-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240727_111138-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240727_114052-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240728_102854-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240728_111837-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240728_114738-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240729_114425-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20240801_163706-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/IMG_20210715_105836-scaled.jpg'
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
 * NOT linked: Fabian-Andrei Stoica (mentor programare, robotică și fizică experimentală)
 * — no matching mentor row in the database.
 */
const MENTOR_SLUGS = ['diana-antoci', 'irina-nicolaescu', 'alin-mardare', 'constantin-caprioreanu'];

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
					'Construcție',
					'Inginerie',
					'Fizică',
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
						body: 'KOGAION ENGINEER BOOTCAMP este o experiență educațională de construcție și inginerie, de reconectare cu elementele vieții — pământul, focul, aerul și apa — prin care copiii descoperă cum știința, natura și munca în echipă pot da sens acțiunilor noastre și redescoperă bucuria de a trăi. De la construcția unui cuptor de lut și experimente de fizică, până la reflecție, drumeție și joacă, fiecare activitate le dezvoltă gândirea practică, încrederea, cooperarea și bucuria de a crea cu propriile mâini și cu propria inimă.'
					},
					{
						body: 'KOGAION ENGINEER BOOTCAMP nu este doar o tabără despre natură — este o reîntoarcere la ordinea vieții, unde copilul învață să construiască, să simtă și să trăiască în armonie cu tot ce există.'
					}
				],
				imageBetweenBlocks: introImage ?? undefined,
				imageAfterBlockIndex: 0
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
							'Construcții / Inginerie. Construcția unui Cuptor de lut – Copiii participă la proiectarea și realizarea unui cuptor funcțional din lut, învățând despre proprietățile materialelor naturale, procesele fizice implicate în construcții și principiile de eficiență termică. Activitatea cultivă coordonarea practică, gândirea inginerească aplicată și spiritul de echipă, într-un context autentic de lucru manual cu resurse naturale și responsabilitate ecologică.'
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
							'Drumeție și conectare în natură – Activitățile outdoor zilnice – înviorarea de dimineață, traseele montane, momentele de reflecție, jocurile de atenție și relaționare, creează un cadru de echilibru între corp și minte. Copiii învață să-și asculte corpul, să observe mediul înconjurător și să dezvolte o relație armonioasă cu lumea naturală.'
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
					'**Redescoperă legătura vie dintre om și elementele naturii.** Copilul trăiește experiențe autentice cu pământul, focul, aerul și apa, învățând prin acțiune cum fiecare element devine profesor de echilibru, logică și simțire.',
					'**Învață să creeze și să construiască cu sens.** Prin proiecte de inginerie practică – cum este construirea cuptorului de lut – copilul dezvoltă coordonarea, perseverența și încrederea în propriile forțe, experimentând satisfacția lucrului împlinit cu mâinile sale.',
					'**Dobândește echilibru între gândire, emoție și acțiune.** Îmbinarea dintre experimente, reflecție și activități în natură formează o inteligență completă – științifică și intuitivă, curioasă și calmă, logică și empatică.'
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
					'**Învață să gândească aplicat și sistemic.** Copilul descoperă legătura dintre cauză și efect, dintre natură și tehnologie, transformând observația în înțelegere reală.',
					'**Își dezvoltă spiritul de echipă și capacitatea de cooperare.** Activitățile de construcție și de rezolvare în grup îi cultivă răbdarea, empatia și conștiința că lucrurile mari se construiesc împreună.',
					'**Își găsește ritmul interior și starea de bucurie naturală.** Prin „Semințele Bucuriei” și contactul cu elementele naturii, copilul învață să-și regleze emoțiile, să se reconecteze cu corpul și să trăiască starea de bine din prezent.'
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
					alt: `Galerie Engineer Bootcamp Kogaion ${idx + 1}`
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
					'Înscrierea în tabăra Kogaion Engineer Bootcamp – presupune o primă discuție cu reprezentanții Kogaion, pentru stabilirea împreună a măsurii în care tabăra este potrivită pentru copilul dvs. și pentru ghidarea către programul educațional care se potrivește cel mai bine copilului dvs.\n\nOferte personalizate pentru grupuri de minim 5 copii.',
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
			title: 'Kogaion Engineer Bootcamp',
			ageRange: 'copii 7-9 ani și 10-12 ani',
			datesText: '12–17 iulie 2026, 6 zile, Moieciu de Sus',
			durationText: '6 zile',
			locationText: 'Moieciu de Sus'
		})
		.where(and(eq(programLocale.programId, programId), eq(programLocale.locale, 'ro')));

	let introImage: string | null = null;
	{
		const name = 'kogaion-engineer-bootcamp-2-intro-main.webp';
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
		const name = 'kogaion-engineer-bootcamp-2-activities-main.webp';
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
		const name = 'kogaion-engineer-bootcamp-2-benefits-main.webp';
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
		const name = `kogaion-engineer-bootcamp-2-gallery-${String(i + 1).padStart(2, '0')}.webp`;
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
		const name = 'kogaion-engineer-bootcamp-2-location-main.webp';
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
		const name = `kogaion-engineer-bootcamp-2-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
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
