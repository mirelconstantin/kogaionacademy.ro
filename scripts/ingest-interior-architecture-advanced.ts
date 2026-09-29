/**
 * Ingest content and assets for the interior-architecture-advanced-learning program.
 * - Inserts program_section rows (RO) with full content from kogaionacademy.ro.
 * - Downloads the intro / gallery / location media to
 *   static/media/uploads/programe/interior-architecture-advanced-learning/
 * - Links mentors for this program.
 *
 * Source page: https://kogaionacademy.ro/programe/interior-architecture-advanced-learning/
 * The page has no "Beneficii principale", no "Meniu" block and no hero cover
 * image of its own, so those are intentionally not emitted. The cover image
 * already exists on disk and is referenced from src/lib/programs-data.ts, so it
 * is not re-downloaded.
 *
 * Run: bun run scripts/ingest-interior-architecture-advanced.ts
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

const PROGRAM_SLUG = 'interior-architecture-advanced-learning';
const UPLOAD_DIR = join(
	process.cwd(),
	'static',
	'media',
	'uploads',
	'programe',
	'interior-architecture-advanced-learning'
);
const LOCAL_BASE = '/media/uploads/programe/interior-architecture-advanced-learning';

/**
 * Mentor slugs from the Interior Architecture Advanced Learning page (order
 * preserved). The page lists 5 mentors and all 5 have matching rows in the
 * mentor table.
 */
const MENTOR_SLUGS = [
	'george-grama',
	'andrei-stan',
	'alina-monica-antoci',
	'madalina-gavrilescu',
	'constantin-caprioreanu'
];

/** Image shown between the intro blocks. */
const INTRO_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-1.jpeg';

/** Gallery image URLs, in the exact order listed on the page. */
const GALLERY_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09375.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-26.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09830.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC09274.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-1.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-2.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-4.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-5.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-6.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-7.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-8.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-9.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-12.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-14.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-17.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-24.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-25.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-27.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-15.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-16.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-06-at-20.04.54-13.jpg'
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
					'Proiectare arhitecturală design interior',
					'Proiectare, construcție, design interior dom',
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
						body: '10 zile – O EXPERIENTĂ TRANSFORMAȚIONALĂ PENTRU VIAȚĂ, UN EXERCIȚIU DE VIZIUNE SPAȚIALĂ, CONSTRUCȚIE ȘI IDENTITATE ESTETICĂ, în care adolescenții își DEZVOLTĂ PASIUNEA pentru ARHITECTURĂ DE INTERIOR, dobândind pre-rechizite esențiale de DESEN, MACHETARE, CONSTRUCȚIE, DEZVOLTARE PERSONALĂ, COMUNICARE STRATEGICĂ și RELAȚIONARE POZITIVĂ.'
					},
					{
						body: 'Participarea la o tabără educațională de excelență în arhitectură de interior reprezintă pentru orice adolescent pasionat sau nu de arte, design sau spațiu construit o experiență transformațională, care cultivă o viziune estetică superioară, gândirea spațială critică și sensibilitatea funcțională.'
					},
					{
						body: 'cine: adolescenți 13 – 18 ani\nunde: Bran, Pensiunea Mama Cozonacilor, la poalele masivului Bucegi\ncând: 11–20 august 2026 , 10 zile'
					},
					{
						body: 'Tabăra oferă un echilibru între rigoarea procesului arhitectural și libertatea expresiei creative, într-un cadru ce favorizează accentuarea propriei identități vizuale și formarea competențelor esențiale pentru viitorii designeri de interior, arhitecți sau profesioniști ai mediului construit.'
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
							'Desen tehnic (perspectivă și axonometrie), desen de observație – Atelierul introduce adolescenții în limbajul vizual specific arhitecturii de interior, unde desenul devine un instrument de analiză a spațiilor, volumelor și proporțiilor. Ei învață să folosească perspectiva pentru a reprezenta realist interiorul, axonometria pentru a explica structuri și relații funcționale, iar desenul de observație pentru a surprinde detalii, texturi și dinamica spațiului construit. Activitatea dezvoltă gândirea structurală, disciplina, precizia și inteligența spațială.'
					},
					{
						title:
							'Proiectare arhitecturală. Elaborare machetă design interior la standarde universitare – Participanții explorează arhitectura interioară ca proces complet: analiză, concept, funcționalitate, circulații, lumină, materialitate și ergonomie. Ei proiectează un spațiu interior coerent și adaptat unei teme reale, pe care îl transformă ulterior într-o machetă realizată la criterii și precizie de nivel universitar. Procesul îi ajută să gândească spațiul ca experiență și să își exprime ideile vizuale în mod profesionist. Activitatea dezvoltă gândirea sistemică, atenția la detalii și abilitatea de a transforma o idee într-un artefact arhitectural clar și funcțional.'
					},
					{
						title:
							'Construcție arhitecturală de interior. Proiectare, construcție și design interior a unui dom din lemn și alte materiale naturale la scara 1:1 – Adolescenții proiectează și construiesc un dom arhitectural la scară reală, utilizând lemn și materiale naturale, experimentând astfel atât principiile structurilor geodezice, cât și designul interior al unui spațiu complet funcțional. Activitatea le oferă ocazia să înțeleagă relația dintre formă, rezistență, proporție și utilizarea responsabilă a resurselor. Adolecenții dobândesc competențe practice, colaborative și tehnice, învățând cum se creează un spațiu tridimensional cu propriile mâini.'
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
			section: 'benefits_secondary',
			sortOrder: 5,
			payload: {
				title: 'Beneficii secundare',
				items: [
					'networking cu adolescenți cu aceleași pasiuni',
					'experiență în lucrul individual și în echipă alături de alți adolescenți cu pasiuni și abilități similare și conștientizarea rolului fiecăruia și valorificarea unicității în diversitate pentru realizarea proiectelor taberei',
					'valorificarea abilităților și a potențialelor proprii vizuo-spațiale',
					'observarea și descoperirea inteligenței și pattern-urilor naturii și naturii umane și translatarea acestora în structuri arhitecturale în mărime naturală',
					'reflectarea asupra progresului lor, asupra proceselor de gândire pe care le-au dezvoltat care vor genera curiozități suplimentare privind domeniul și crearea pasiunii pentru arhitectură'
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
					alt: `Galerie Interior Architecture Advanced Learning ${idx + 1}`
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
					'Înscrierea în tabăra Kogaion Interior Architecture Advanced Learning presupune o primă discuție cu reprezentanții Kogaion, pentru stabilirea împreună a măsurii în care tabăra este potrivită pentru copilul dvs. și pentru ghidarea către programul educațional care se potrivește cel mai bine copilului dvs.\n\nOfertă personalizată pentru grupuri de minim 5 copii.',
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
		const name = 'interior-architecture-advanced-learning-intro-main.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(INTRO_IMAGE_URL, localPath);
			introImage = `${LOCAL_BASE}/${name}`;
			console.log('  Intro image', name);
		} catch (e) {
			console.warn('  Skip intro image', e);
		}
	}

	const galleryImageUrls: string[] = [];
	for (let i = 0; i < GALLERY_IMAGE_URLS.length; i++) {
		const url = GALLERY_IMAGE_URLS[i];
		const name = `interior-architecture-advanced-learning-gallery-${String(i + 1).padStart(2, '0')}.webp`;
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
		const name = 'interior-architecture-advanced-learning-location-main.webp';
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
		const name = `interior-architecture-advanced-learning-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
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
