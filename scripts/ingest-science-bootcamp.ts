/**
 * Ingest content and assets for the kogaion-science-bootcamp program.
 *
 * Run: bun --env-file=.env scripts/ingest-science-bootcamp.ts
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

const PROGRAM_SLUG = 'kogaion-science-bootcamp';
const PROGRAM_DIR_SLUG = 'kogaion-science-bootcamp';
const UPLOAD_DIR = join(process.cwd(), 'static', 'media', 'uploads', 'programe', PROGRAM_DIR_SLUG);
const LOCAL_BASE = `/media/uploads/programe/${PROGRAM_DIR_SLUG}`;

const COVER_IMAGE_URL = 'https://kogaionacademy.ro/wp-content/uploads/2023/02/21-1110x393.png';
const INTRO_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-15-at-22.37.16-2.jpeg';
const ACTIVITIES_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-14-at-19.42.37-4.jpeg';
const BENEFITS_MAIN_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-18-at-17.03.58.jpeg';

const GALLERY_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-13-at-21.42.19-1-2048x1536.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG_6520-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/02/20240724_190833-2048x1152.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-29-at-18.53.03.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-17-at-16.36.15.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG_6164-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-29-at-18.53.05.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/04/IMG-20190726-WA0220.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/03/IMG_2236-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-17-at-16.36.15-1.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-15-at-18.35.37-2.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-17-at-00.30.10.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-15-at-22.37.16-1.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-31-at-18.59.28.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-17-at-00.25.51.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-15-at-22.19.39.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-15-at-22.17.59.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-15-at-18.38.01.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-14-at-19.42.37-5.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-14-at-19.42.37-2.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-14-at-19.42.37.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-30-at-16.32.20.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/WhatsApp-Image-2025-07-31-at-18.59.24.jpeg'
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
	'andreea-draghici',
	'vladimir-stefanescu',
	'constantin-caprioreanu',
	'irina-nicolaescu'
];

const MISSING_MENTORS = [
	{
		slug: 'vladimir-stefanescu',
		nameRo: 'Vladimir Ștefănescu',
		titleRo: 'Profesor și Coordonator Școala de Astronomie',
		image: '/media/uploads/mentori/vladimir-stefanescu.webp',
		sourceImageUrl:
			'https://kogaionacademy.ro/wp-content/uploads/2023/09/Poza-Vladimir-Stefanescu-1024x765.jpeg'
	}
] as const;

async function downloadAndConvertToWebp(url: string, localPath: string): Promise<void> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
	const buf = await res.arrayBuffer();
	await sharp(Buffer.from(buf)).webp({ quality: 84 }).toFile(localPath);
}

async function ensureMissingMentors(db: ReturnType<typeof drizzle>) {
	await mkdir(join(process.cwd(), 'static', 'media', 'uploads', 'mentori'), { recursive: true });

	for (const mm of MISSING_MENTORS) {
		const localPath = join(
			process.cwd(),
			'static',
			'media',
			'uploads',
			'mentori',
			`${mm.slug}.webp`
		);
		try {
			await downloadAndConvertToWebp(mm.sourceImageUrl, localPath);
		} catch (e) {
			console.warn('  Skip missing mentor image', mm.slug, e);
		}

		const existing = await db.select().from(mentor).where(eq(mentor.slug, mm.slug)).limit(1);
		if (existing.length > 0) continue;

		const now = new Date();
		await db.insert(mentor).values({
			slug: mm.slug,
			nameRo: mm.nameRo,
			nameEn: mm.nameRo,
			titleRo: mm.titleRo,
			titleEn: mm.titleRo,
			bioRo: '',
			bioEn: '',
			image: mm.image,
			sortOrder: 999,
			status: 'published',
			publishedAt: now
		});
		console.log('  Added missing mentor', mm.slug);
	}
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
					'Anatomie',
					'Biologie',
					'Astronomie'
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
						body: 'KOGAION SCIENCE BOOTCAMP este o călătorie prin știință, viață și cosmos, în care copiii învață să privească lumea cu uimire, logică și respect pentru tot ce trăiește. De la observarea stelelor și explorarea microcosmosului, până la înțelegerea propriului corp și a bucuriei de a trăi, tabăra le oferă experiențe care unesc cunoașterea și emoția, curiozitatea și echilibrul, știința și sensul. Aici, copilul descoperă nu doar cum funcționează Universul, ci și cum pulsează viața în el însuși.'
					},
					{
						body: 'KOGAION SCIENCE BOOTCAMP nu este doar o tabără de știință - este o experiență de viață care îi învață pe copii să privească lumea cu uimire, logică și recunoștință.'
					},
					{
						body: 'Taberele educaționale Kogaion pentru copii de 7-12 ani au structură triangulară unică și combină:\n- Cunoașterea de sine\n- Activitățile de enrichment experiențiale organizate ca proiecte multi și trans-disciplinare, cu curriculum propriu\n- Conectarea în natură'
					},
					{
						body: 'Taberele Kogaion pentru copii de 7-12 ani sunt locul unde copilul tău:\n- Învață aplicat, explorează conștient și își descoperă direcția personală de dezvoltare\n- Își antrenează inteligența emoțională, gândirea critică și capacitatea de exprimare autentică în cadrul unui program unic de cunoaștere de sine, „Semințele Bucuriei”\n- Se conectează cu natura și cu o comunitate bazată pe empatie și cooperare'
					}
				],
				imageBetweenBlocks: introImage ?? undefined
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
							'Astronomie aplicată - copiii participă la simulări ale bolții cerești, ale Sistemului Solar și ale Universului cu programe profesionale de astronomie, vizionează prezentări spectaculoase cu imagini și filme astronomice și dezbat teme precum găurile negre, stelele neutronice, galaxiile, evoluția universului, Big-Bang-ul, misiunile spațiale, sateliții artificiali, cometele, asteroizii și telescoapele. În plus, copiii vor avea două observări cu telescop profesional: o sesiune de observații astronomice solare cu filtru special și o sesiune de observații de seară (Luna, planeta Saturn, stele, stele duble, roiuri stelare, ploaia de meteoriți).'
					},
					{
						title:
							'Biologie experimentală. Microcosmos și Primul meu ierbar - copiii investighează lumea invizibilă prin microscop, folosind un set de 300 de preparate microscopice din lumea vegetală și animală. Copiii își creează propriul ierbar, observând, clasificând și conservând plante reale, dezvoltând răbdarea, observația și sensibilitatea față de diversitatea vieții.'
					},
					{
						title:
							'Anatomia corpului uman - proiect „De la celulă la sistem” - copiii explorează structura și funcțiile organismului uman prin activități interactive, modele didactice și exerciții de reconstrucție simbolică a relației dintre celule, organe și sisteme.'
					},
					{
						title:
							'Cunoaștere de sine. Proiect problem solving „Semințele Bucuriei” - copiii descoperă, prin joc, reflecție și creație, cum să recunoască și să mențină starea de bucurie autentică. Ei învață să transforme emoțiile, curiozitatea și experiențele vieții în resurse de echilibru, curaj și sens interior.'
					},
					{
						title:
							'Drumeție și conectare în natură - activitățile outdoor zilnice (înviorare de dimineață, trasee montane, momente de reflecție, jocuri de atenție și relaționare) creează un cadru de echilibru între corp și minte.'
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
					'Descoperă știința ca pe o aventură. Copilul învață să observe, să pună întrebări și să caute răspunsuri prin experiment, explorare și curiozitate autentică.',
					'Trăiește bucuria de a învăța și de a fi. Fiecare activitate - de la astronomie la biologie - îl ajută să transforme cunoașterea în entuziasm, încredere și echilibru interior.',
					'Înțelege legătura dintre viață și Univers. Copilul descoperă cum totul este interconectat - corpul uman, natura, planetele - și dobândește respect față de viață și față de lumea din jur.'
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
					'Antrenează atenția, răbdarea și perseverența. Prin observație, construcție și experimentare practică, învață că în știință răspunsurile se câștigă prin curiozitate și răbdare.',
					'Își dezvoltă cooperarea și exprimarea liberă. Lucrând în echipă și împărtășind idei, copilul capătă încredere în sine și în vocea sa creativă.',
					'Își echilibrează emoțiile și energia. Contactul zilnic cu natura și activitățile de reflecție din proiectul „Semințele Bucuriei” îl ajută să-și regăsească liniștea, curajul și bucuria de a trăi.'
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
					alt: `Galerie Science Bootcamp ${idx + 1}`
				}))
			}
		},
		{
			section: 'transport',
			sortOrder: 7,
			payload: {
				title: 'Transport',
				body: 'Prețul include transport cu trenul până la Brașov și autocar autorizat pe ruta Brașov - Moieciu de Sus și retur. Se poate asigura și transport cu autocarul de la localitatea de reședință și până la locație; prețul depinde de numărul de copii. Detalii: 0736.770.669 - Iulia.'
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
				intro: 'Înscrierea în tabăra Kogaion Science Bootcamp presupune o primă discuție cu reprezentanții Kogaion, pentru stabilirea împreună a măsurii în care tabăra este potrivită pentru copilul dvs. și pentru ghidarea către programul educațional care se potrivește cel mai bine copilului dvs.\n\nOferte personalizate pentru grupuri de minim 5 copii.',
				steps: [],
				contactNote: 'Te rugăm să completezi formularul de detalii pentru a fi contactat sau sună la 0720.529.398 (Diana Antoci - consultant educațional)',
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

	await ensureMissingMentors(db);

	await db
		.update(programLocale)
		.set({
			title: 'Kogaion Science Bootcamp',
			ageRange: 'copii 7-9 ani și 10-12 ani',
			datesText: '19–24 iulie 2026, 6 zile, Moieciu de Sus',
			durationText: '6 zile',
			locationText: 'Moieciu de Sus'
		})
		.where(and(eq(programLocale.programId, programId), eq(programLocale.locale, 'ro')));

	await db
		.update(programLocale)
		.set({
			title: 'Kogaion Science Bootcamp',
			ageRange: 'children 7-9 and 10-12 years',
			datesText: '19–24 July 2026, 6 days, Moieciu de Sus',
			durationText: '6 days',
			locationText: 'Moieciu de Sus'
		})
		.where(and(eq(programLocale.programId, programId), eq(programLocale.locale, 'en')));

	let coverImageUrl: string | null = null;
	{
		const name = 'kogaion-science-bootcamp-cover.webp';
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
		const name = 'kogaion-science-bootcamp-intro-main.webp';
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
		const name = 'kogaion-science-bootcamp-activities-main.webp';
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
		const name = 'kogaion-science-bootcamp-benefits-main.webp';
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
		const name = `kogaion-science-bootcamp-gallery-${String(i + 1).padStart(2, '0')}.webp`;
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
		const name = 'kogaion-science-bootcamp-location-main.webp';
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
		const name = `kogaion-science-bootcamp-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
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
