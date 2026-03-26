/**
 * Ingest content and assets for the kogaion-architecture-bootcamp program.
 *
 * Run: bun --env-file=.env scripts/ingest-architecture-bootcamp.ts
 */
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import sharp from 'sharp';
import { mentor, program, programLocale, programMentor, programSection } from '../src/lib/server/db/schema';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const PROGRAM_SLUG = 'kogaion-architecture-bootcamp';
const PROGRAM_DIR_SLUG = 'kogaion-architecture-bootcamp';
const UPLOAD_DIR = join(process.cwd(), 'static', 'media', 'uploads', 'programe', PROGRAM_DIR_SLUG);
const LOCAL_BASE = `/media/uploads/programe/${PROGRAM_DIR_SLUG}`;

const COVER_IMAGE_URL = 'https://kogaionacademy.ro/wp-content/uploads/2025/02/Arca-lui-Noe-1110x393.jpg';
const INTRO_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-25-at-10.29.25.jpeg';
const ACTIVITIES_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-18-at-00.36.13-2-2048x1538.jpeg';
const BENEFITS_MAIN_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-16-at-12.21.42-2048x1538.jpeg';

const GALLERY_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-19-at-16.01.32-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-15-at-19.01.17-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-18-at-00.36.02-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-20-at-21.45.11-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-16-at-22.07.01-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-15-at-20.13.25-3-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-16-at-22.06.59-1-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL0823-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL1960-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL0761-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL0912-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL1099-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-18-at-00.36.13-2-1-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL1197-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-18-at-00.36.13-1-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2298-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2274-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-13-at-21.42.19-1-2048x1536.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2288-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2334-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL9862-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/Elemente-2-2048x1373.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-15-at-20.13.24-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-20-at-18.51.45-1-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-16-at-22.07.05-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-16-at-22.07.04-1-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-16-at-22.06.58-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-16-at-12.21.43-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-16-at-12.17.23.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-15-at-20.42.57.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-15-at-20.13.26-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-15-at-19.01.16-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-14-at-20.06.02-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-18-at-00.36.01-2048x1538.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/WhatsApp-Image-2025-07-18-at-00.36.13-2048x1538.jpeg'
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

const MENTOR_SLUGS = [
	'diana-antoci',
	'george-grama',
	'alin-mardare',
	'irina-nicolaescu',
	'constantin-caprioreanu'
];

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
					'Conectare în natură',
					'Problem solving',
					'Cunoaștere de sine',
					'Machetă arhitecturală',
					'Construcție Arca lui Noe'
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
						body: 'KOGAION ARCHITECTURE BOOTCAMP este o experiență educațională creativ-structurală, în care copiii devin arhitecți ai spațiului și ai propriei gândiri. Prin proiecte de construcție colaborativă - „Arca lui Noe” și „Orașul Kogaion” - ei învață să unească logica, imaginația și etica într-un mod concret de a construi lumea: echilibrată, sustenabilă și frumoasă. În contact cu natura și propriile emoții, copiii descoperă armonia dintre formă și viață, dezvoltă curajul, cooperarea și bucuria de a fi.'
					},
					{
						body: 'KOGAION ARCHITECTURE BOOTCAMP nu este doar o tabără despre clădiri - este o inițiere în arta de a construi lumea cu mintea, cu inima și cu sens.'
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
							'Carnavalul și serile la foc de tabără completează experiența educațională cu momente de joacă, dans și apartenență la o comunitate autentică.'
					},
					{
						title:
							'Drumeție și conectare în natură - Activitățile outdoor zilnice - înviorarea de dimineață, traseele montane, momentele de reflecție, jocurile de atenție și relaționare, creează un cadru de echilibru între corp și minte. Copiii învață să-și asculte corpul, să observe mediul înconjurător și să dezvolte o relație armonioasă cu lumea naturală.'
					},
					{
						title:
							'Cunoaștere de sine. Proiect problem solving „Semințele Bucuriei” - Copiii descoperă, prin joc, reflecție și creație, cum să recunoască și să mențină starea de bucurie autentică, indiferent de context. Ei învață să transforme emoțiile, curiozitatea și experiențele vieții în resurse de echilibru, curaj și sens interior, pe care le vor purta cu ei toată viața. Copiii dobândesc instrumente practice de autoreglare emoțională, autocunoaștere și reziliență.'
					},
					{
						title:
							'Arhitectură urbană - „Orașul Kogaion” - În rol de arhitecți și urbaniști, copiii proiectează și construiesc propria casă, parte componentă a unui oraș-model care valorifică logica spațială, gândirea sistemică și integrarea funcționalităților urbane esențiale (locuire, spații publice, infrastructură ecologică, relații sociale). Copiii experimentează procese reale de gândire urbană, învață principiile de organizare a unui spațiu comun și reflectă asupra modului în care putem construi comunități durabile, incluzive și armonioase.'
					},
					{
						title:
							'Construcție arhitecturală - „Arca lui Noe” - Copiii sunt implicați într-un proiect educațional complex de construcție colaborativă, cu o puternică valoare simbolică: „Arca lui Noe”. Ei explorează principii fundamentale ale arhitecturii - echilibru, simetrie, funcționalitate - într-o abordare integrată, etică și ecologică, își dezvoltă imaginația spațială, înțeleg concepte de sustenabilitate și învață cum structura și natura pot coexista armonios.'
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
					'Descoperă armonia dintre formă, natură și viață. Prin contact direct cu materialele, natura și simbolurile arhitecturale, copilul învață să perceapă lumea ca pe o rețea vie de relații - locul în care fiecare gest poate deveni o construcție a binelui.',
					'Dobândește capacitatea de a construi împreună. Proiectele colaborative - Arca lui Noe și Orașul Kogaion - dezvoltă spiritul de echipă, comunicarea, cooperarea și respectul pentru spațiul comun.',
					'Învață să gândească în structuri - logice, creative și etice. Copilul descoperă cum ordinea, frumusețea și responsabilitatea pot coexista: fiecare construcție devine o lecție despre echilibru între rațiune și sensibilitate.'
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
					'Dobândește încredere, răbdare și echilibru emoțional. Prin proiectul „Semințele Bucuriei”, copilul descoperă cum fiecare construcție exterioară reflectă o arhitectură interioară - a emoțiilor, a sensului și a stării de bucurie.',
					'Își cultivă responsabilitatea și conștiința ecologică. Înțelege ce înseamnă sustenabilitatea, reutilizarea resurselor și grija față de mediul în care trăim.',
					'Își dezvoltă gândirea vizual-spațială și simțul proporției. Copilul învață să lege matematica, geometria și arta într-un mod natural, intuitiv și aplicat.'
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
					alt: `Galerie Architecture Bootcamp ${idx + 1}`
				}))
			}
		},
		{
			section: 'transport',
			sortOrder: 7,
			payload: {
				title: 'Transport',
				body: 'Prețul include transport cu trenul până la Brașov și autocar autorizat pe ruta Brașov - Moieciu de Sus și retur. Se poate asigura și transport cu autocarul de la localitatea de reședință și până la locație; prețul depinde de numărul de copii.',
				contact: '0736.770.669 - Iulia'
			}
		},
		{
			section: 'menu',
			sortOrder: 8,
			payload: {
				title: 'Meniu',
				body: 'Meniul este prestabilit în 2 variante, una tradițională și una vegetariană. Mâncarea se gătește în bucătăria proprie a restaurantului. Pentru copiii cu alergii, se asigură meniu separat.',
				note: ''
			}
		},
		{
			section: 'location',
			sortOrder: 9,
			payload: {
				title: 'Locație',
				subtitle: 'Pensiunea Nicoleta Moieciu de Sus 3***, Moieciu de Sus',
				body: 'Pensiunea este localizata la poalele muntilor Bucegi, la 45 km. de Brasov, la 3 km. de intrarea in Parcul National Bucegi. Pensiunea dispune de 2 cladiri. Camerele sunt de 2 locuri cu paturi matrimoniale, 3 locuri cu un pat matrimonial si un pat single si apartamente de 4 locuri. Fiecare camera este dotata cu baie proprie cu dus, balcon, TV cu televiune prin cablu, internet wireless. In curtea pensiunii exista amenajat un spatiu de joaca pentru copii, un foisor, o sala de jocuri cu biliard, ping-pong, terasa, parcare, foisor suspendat, restaurant.',
				amenities: ['Terasă', 'Restaurant'],
				image: locationImage ?? undefined,
				images: locationGridUrls.length > 0 ? locationGridUrls : undefined,
				mapEmbedUrl:
					'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2799.4806759400667!2d25.338378376980906!3d45.439969071073676!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b3399ce553a2e1%3A0xae96c5429b8eb81e!2sPensiunea%20Nicoleta%20-%20Moieciu%20de%20Sus!5e0!3m2!1sen!2sro!4v1773683990236!5m2!1sen!2sro'
			}
		},
		{
			section: 'enrollment',
			sortOrder: 10,
			payload: {
				title: 'Înscriere',
				intro: 'Înscrierea în tabăra Kogaion Architecture Bootcamp presupune o primă discuție cu reprezentanții Kogaion, pentru stabilirea împreună a măsurii în care tabăra este potrivită pentru copilul dvs. și pentru ghidarea către programul educațional care se potrivește cel mai bine copilului dvs.\n\nOferte personalizate pentru grupuri de minim 5 copii.',
				steps: [],
				contactNote:
					'Te rugăm să completezi formularul de detalii pentru a fi contactat sau sună la 0720.529.398 (Diana Antoci - consultant educațional)',
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
			title: 'Kogaion Architecture Bootcamp',
			ageRange: 'copii 7-9 ani și 10-12 ani',
			datesText: '5–10 iulie 2026, 6 zile, Moieciu de Sus',
			durationText: '6 zile',
			locationText: 'Moieciu de Sus'
		})
		.where(and(eq(programLocale.programId, programId), eq(programLocale.locale, 'ro')));

	await db
		.update(programLocale)
		.set({
			title: 'Kogaion Architecture Bootcamp',
			ageRange: 'children 7-9 and 10-12 years',
			datesText: '5–10 July 2026, 6 days, Moieciu de Sus',
			durationText: '6 days',
			locationText: 'Moieciu de Sus'
		})
		.where(and(eq(programLocale.programId, programId), eq(programLocale.locale, 'en')));

	let coverImageUrl: string | null = null;
	{
		const name = 'kogaion-architecture-bootcamp-cover.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(COVER_IMAGE_URL, localPath);
			coverImageUrl = `${LOCAL_BASE}/${name}`;
			console.log('  Cover', name);
		} catch (e) {
			console.warn('  Skip cover', e);
		}
	}

	let introImage: string | null = null;
	{
		const name = 'kogaion-architecture-bootcamp-intro-main.webp';
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
		const name = 'kogaion-architecture-bootcamp-activities-main.webp';
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
		const name = 'kogaion-architecture-bootcamp-benefits-main.webp';
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
		const name = `kogaion-architecture-bootcamp-gallery-${String(i + 1).padStart(2, '0')}.webp`;
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
		const name = 'kogaion-architecture-bootcamp-location-main.webp';
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
		const name = `kogaion-architecture-bootcamp-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(url, localPath);
			locationGridUrls.push(`${LOCAL_BASE}/${name}`);
			console.log('  Location grid', name);
		} catch (e) {
			console.warn('  Skip location grid', name, e);
		}
	}

	if (coverImageUrl) {
		await db.update(program).set({ image: coverImageUrl }).where(eq(program.id, programId));
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
