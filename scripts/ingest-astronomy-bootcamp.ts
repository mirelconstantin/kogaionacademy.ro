/**
 * Ingest content and assets for the kogaion-astronomy-bootcamp program.
 *
 * Source of truth: https://kogaionacademy.ro/programe/kogaion-astronomy-bootcamp/
 *
 * Run: bun --env-file=.env scripts/ingest-astronomy-bootcamp.ts
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

const PROGRAM_SLUG = 'kogaion-astronomy-bootcamp';
const PROGRAM_DIR_SLUG = 'kogaion-astronomy-bootcamp';
const UPLOAD_DIR = join(process.cwd(), 'static', 'media', 'uploads', 'programe', PROGRAM_DIR_SLUG);
const LOCAL_BASE = `/media/uploads/programe/${PROGRAM_DIR_SLUG}`;

/** Lead image of the intro narrative. */
const INTRO_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-15-at-22.37.16-3-1.jpeg';
/** Image sitting directly above the „Activitățile taberei” heading. */
const ACTIVITIES_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-08-01-at-00.02.30.jpeg';
/** Image closing the „Beneficii principale” block. */
const BENEFITS_MAIN_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-14-at-11.03.57.jpeg';

const GALLERY_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-29-at-23.56.26-1-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2274.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/DSC09230-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-30-at-22.35.30.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/DSC09241-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-08-01-at-00.02.27.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/DSC09065-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2024-02-01-at-23.27.50-1.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-08-01-at-00.02.32.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-30-at-22.35.33-1-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-30-at-22.35.31-1-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/DSC09194-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL1428.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-30-at-22.35.31-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-30-at-22.35.30-1.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-29-at-23.56.25-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-29-at-23.56.24-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-29-at-23.56.22-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-29-at-23.56.20-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-29-at-18.53.01.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-28-at-22.44.10-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL1386.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-28-at-22.44.07-scaled.jpeg'
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
 * NOT linked: Minodora Carmen Lipcanu (Profesor Dr. în astronomie)
 * — no matching mentor row in the database.
 */
const MENTOR_SLUGS = ['diana-antoci', 'alin-mardare', 'irina-nicolaescu', 'constantin-caprioreanu'];

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
					'Astronomie',
					'Geometria naturii în artă',
					'Solidele platonice',
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
						body: 'KOGAION ASTRONOMY BOOTCAMP este o aventură educațională în care știința, arta și conștiința se întâlnesc pentru a trezi fascinația față de Univers și sensul apartenenței la el. Copiii explorează cerul nopții, descifrează limbajul geometriei în natură și își imaginează propria amprentă lăsată în univers, învățând că geometria, natura și viața pulsează după aceleași legi ale armoniei. Prin reflecție, creație și reconectare, ei descoperă bucuria de a fi ca parte dintr-un Univers viu.'
					},
					{
						body: 'KOGAION ASTRONOMY BOOTCAMP nu este o tabără despre stele, ci despre lumina care le unește și despre copilul care învață să o recunoască în sine.'
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
							'Astronomie aplicată – copiii participa la simulări ale bolții cerești, ale Sistemului Solar și ale Universului cu programe profesionale de astronomie, vor viziona prezentări spectaculoase cu imagini și filme astronomice, vor dezbate pe teme astronomice cum ar fi găurile negre și stelele neutronice, galaxiile și evoluția universului, Big-Bang-ul, misiunile spațiale, sateliții artificiali, misiuni spațiale și Stația Spațială Internațională, comete, asteroizi, Sistemul Solar, telescoape și accesorii astronomice. În plus, copiii vor avea 2 observări cu telescop profesional: o sesiune de observații astronomice solare folosind filtru special și o sesiune de observații astronomice de seară: Luna, planeta Saturn, stele, stele duble, roiuri stelare, ploaia de meteoriți. Discuțiile ghidate pe teme astronomice cultivă fascinația pentru cosmos și o perspectivă amplă asupra locului omului în Univers.'
					},
					{
						title:
							'Geometrie transdisciplinară. Solidele platonice. „My Blueprint” – Copiii vor crea lucrări bazate pe geometria naturii în artă, având la bază șirul lui Fibonacci și structuri fractale din natură, atât în 2D cât și în 3D, învățând cum formele fundamentale ale existenței sunt reflectate în natură, artă și arhitectură. Activitatea dezvoltă gândirea vizual-spațială, conexiunile simbolice și expresia personală prin construcții geometrice cu semnificație.'
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
					'**Înțelege armonia dintre știință, artă și viață.** Copilul descoperă că legile care guvernează stelele, natura și emoțiile sunt aceleași — învață să gândească integrat și să vadă unitatea dincolo de forme.',
					'**Își cultivă gândirea creativ-logică și conexiunile simbolice.** Lucrând cu forme geometrice sacre, el dezvoltă o gândire vizual-spațială, ordonată și intuitivă, învățând să transforme abstracția în expresie personală cu sens.',
					'**Trăiește bucuria apartenenței la un Univers viu.** Prin observații astronomice și reflecție ghidată, copilul simte mirarea de a fi parte dintr-un întreg inteligent, descoperind o formă de echilibru între cunoaștere și conștiință.'
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
					'**Antrenează curiozitatea științifică și perseverența cognitivă.** Învățarea devine experiență vie – fiecare întrebare devine un pas către sens, nu doar către răspuns.',
					'**Își rafinează sensibilitatea estetică și expresia personală.** Prin artă geometrică, învață să vadă frumusețea în ordine și ordine în frumusețe.',
					'**Dobândește calm interior și bucuria echilibrului.** Proiectul „Semințele Bucuriei” și drumețiile zilnice îl ajută să trăiască armonia dintre corp, minte și spirit – starea de prezență în care se naște adevărata înțelepciune.'
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
					alt: `Galerie Astronomy Bootcamp Kogaion ${idx + 1}`
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
					'Înscrierea în tabăra Kogaion Astronomy Bootcamp – presupune o primă discuție cu reprezentanții Kogaion, pentru stabilirea împreună a măsurii în care tabăra este potrivită pentru copilul dvs. și pentru ghidarea către programul educațional care se potrivește cel mai bine copilului dvs.\n\nOferte personalizate pentru grupuri de minim 5 copii.',
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
			title: 'Kogaion Astronomy Bootcamp',
			ageRange: 'copii 7-9 ani și 10-12 ani',
			datesText: '16–21 august 2026, 6 zile, Moieciu de Sus',
			durationText: '6 zile',
			locationText: 'Moieciu de Sus'
		})
		.where(and(eq(programLocale.programId, programId), eq(programLocale.locale, 'ro')));

	let introImage: string | null = null;
	{
		const name = 'kogaion-astronomy-bootcamp-intro-main.webp';
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
		const name = 'kogaion-astronomy-bootcamp-activities-main.webp';
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
		const name = 'kogaion-astronomy-bootcamp-benefits-main.webp';
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
		const name = `kogaion-astronomy-bootcamp-gallery-${String(i + 1).padStart(2, '0')}.webp`;
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
		const name = 'kogaion-astronomy-bootcamp-location-main.webp';
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
		const name = `kogaion-astronomy-bootcamp-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
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
