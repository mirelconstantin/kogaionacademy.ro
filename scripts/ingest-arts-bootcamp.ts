/**
 * Ingest content and assets for the kogaion-arts-bootcamp-2 program.
 *
 * Source of truth: https://kogaionacademy.ro/programe/kogaion-arts-bootcamp-2/
 *
 * Run: bun --env-file=.env scripts/ingest-arts-bootcamp.ts
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

const PROGRAM_SLUG = 'kogaion-arts-bootcamp-2';
const PROGRAM_DIR_SLUG = 'kogaion-arts-bootcamp-2';
const UPLOAD_DIR = join(process.cwd(), 'static', 'media', 'uploads', 'programe', PROGRAM_DIR_SLUG);
const LOCAL_BASE = `/media/uploads/programe/${PROGRAM_DIR_SLUG}`;

/** Lead image of the intro narrative. */
const INTRO_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/06/WhatsApp-Image-2023-06-15-at-20.15.19-2.jpeg';
/** Image sitting directly above the „Activitățile taberei” heading. */
const ACTIVITIES_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/40D42EAF-3B0A-4EDE-9894-4A42507B1981-scaled.jpeg';
/** Image closing the „Beneficii principale” block. */
const BENEFITS_MAIN_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/06/RDCL0031-2048x1365-1.jpg';

const GALLERY_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2025/06/DSC08531.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/06/DSC_0205-scaled-1.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL1960.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL0761.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL0818.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/06/DSC08616.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL0912.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/06/WhatsApp-Image-2025-02-10-at-20.09.29.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL1099.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/06/DSC08331.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL1197.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/06/DSC08565.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2298.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2274.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/06/DSC_0244-2048x1369-1.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2288.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/06/RDCL0613-scaled-1.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/06/DSC08582.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2334.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/06/DSC08559.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/Elemente-2-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/Elemente-3-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/06/DSC08353.jpg'
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
 * NOT linked: Bianca Gabriela Bălan (artist multidisciplinar, creator de muzică, mobilier, design vestimentar)
 * — no matching mentor row in the database.
 */
const MENTOR_SLUGS = ['diana-antoci', 'iulian-glita', 'andrei-stan', 'constantin-caprioreanu'];

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
					'Teatru de păpuși și improvizație',
					'Pictură',
					'Dans',
					'Canto',
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
						body: 'KOGAION ARTS BOOTCAMP este o experiență de transformare creativă, în care arta devine cunoaștere, emoția devine limbaj, iar copilul învață să se exprime conștient, autentic și liber. Prin teatru, pictură, dans și muzică, copiii descoperă cum fiecare gest, culoare și sunet oglindește lumea interioară și o reînnoiește pe cea exterioară. Tabăra este un spațiu de reconectare între corp, minte și spirit — locul în care sensibilitatea devine forță, iar bucuria de a trăi devine artă.'
					},
					{
						body: 'KOGAION ARTS BOOTCAMP nu este doar o tabără de artă — este o școală a inimii, unde copilul învață că a crea înseamnă a trăi în bucurie și în lumină.'
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
							'Teatru de păpuși și improvizație – Copiii explorează prin joc scenic și spontaneitate lumea emoțiilor, rolurilor și poveștilor. Învăță să asculte, să se exprime, să-și gestioneze emoțiile și să transforme experiențele în narațiune. Arta teatrală devine o oglindă a conștiinței și o școală a empatiei.'
					},
					{
						title:
							'Atelier de pictură. Limbajul culorii și al formei vii – Copiii pătrund în lumea picturii ca într-un spațiu al libertății și al revelației. Ei pictează pe pânză, carton sau lemn, desenează cu cărbune, cu pigmenți naturali sau cu elemente din natură — frunze, pământ, flori, apă, lumină — descoperind că materia este un limbaj viu al spiritului. Prin fiecare culoare, ei învață să exprime ceea ce nu se poate spune în cuvinte: o stare, o amintire, un vis, o emoție, iar actul picturii se transformă într-un dialog între interior și exterior, între copil și lume. Pictura devine meditație în culoare, exercițiu de prezență și poartă către bucuria de a fi.'
					},
					{
						title:
							'Dans – Mișcarea devine instrument al conștienței corporale. Copiii învață coordonarea, ritmul, expresivitatea și relația cu spațiul. Dansul devine geometria sufletului în mișcare.'
					},
					{
						title:
							'Canto – Explorarea vocii ca instrument de cunoaștere de sine și de legătură cu ceilalți. Respirația, tonul și vibrația devin exerciții de prezență și bucurie. Vocea devine puntea dintre interior și lume.'
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
							'Carnavalul și serile la foc de tabără completează experiența educațională cu momente de joacă, dans și apartenență la o comunitate autentică. Aici arta se reîntoarce la sursă — viața trăită ca expresie a recunoștinței.'
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
					'**Își descoperă și își exprimă autentic vocea interioară.** Copilul învață să se exprime liber, conștient și creativ — să transforme emoțiile în forme, sunete și mișcare, dezvoltând încredere și coerență interioară.',
					'**Cultivă empatia, ascultarea și prezența prin arta relației.** Fiecare activitate implică interacțiune, colaborare și oglindire: copilul învață să înțeleagă și să respecte spațiul celuilalt, dezvoltând inteligența emoțională și socială.',
					'**Trăiește arta ca formă de bucurie, echilibru și conștiință.** Arta devine o cale de autocunoaștere și armonizare – copilul descoperă că frumusețea nu e doar de privit, ci de trăit, iar actul artistic e o formă de prezență vie în lume.'
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
					'**Dezvoltă coordonarea, atenția și disciplina expresivă.** Prin dans, desen și teatru, copilul își rafinează motricitatea, atenția și capacitatea de concentrare.',
					'**Își antrenează imaginația și gândirea simbolică.** Activitățile artistice îl ajută să lege emoția de concept, esteticul de sens, cultivând gândirea complexă și flexibilă.',
					'**Dobândește bucuria lucrului în comunitate.** Carnavalul, teatrul și corul îl învață să creeze împreună, să se bucure de diversitate și să trăiască sentimentul apartenenței autentice.'
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
					alt: `Galerie Arts Bootcamp Kogaion ${idx + 1}`
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
					'Înscrierea în tabăra Kogaion Arts Bootcamp – presupune o primă discuție cu reprezentanții Kogaion, pentru stabilirea împreună a măsurii în care tabăra este potrivită pentru copilul dvs. și pentru ghidarea către programul educațional care se potrivește cel mai bine copilului dvs.\n\nOferte personalizate pentru grupuri de minim 5 copii.',
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
			title: 'Kogaion Arts Bootcamp',
			ageRange: 'copii 7-9 ani și 10-12 ani',
			datesText: '29 iunie – 4 iulie 2026, 6 zile, Moieciu de Sus',
			durationText: '6 zile',
			locationText: 'Moieciu de Sus'
		})
		.where(and(eq(programLocale.programId, programId), eq(programLocale.locale, 'ro')));

	let introImage: string | null = null;
	{
		const name = 'kogaion-arts-bootcamp-2-intro-main.webp';
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
		const name = 'kogaion-arts-bootcamp-2-activities-main.webp';
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
		const name = 'kogaion-arts-bootcamp-2-benefits-main.webp';
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
		const name = `kogaion-arts-bootcamp-2-gallery-${String(i + 1).padStart(2, '0')}.webp`;
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
		const name = 'kogaion-arts-bootcamp-2-location-main.webp';
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
		const name = `kogaion-arts-bootcamp-2-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
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
