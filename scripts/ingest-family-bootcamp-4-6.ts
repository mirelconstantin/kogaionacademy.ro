/**
 * Ingest content and assets for the kogaion-family-bootcamp-4-6-ani program.
 * - Inserts program_section rows (RO) with full content from kogaionacademy.ro.
 * - Optionally downloads gallery/location/hero assets to static/media/uploads/programe/kogaion-family-bootcamp-4-6-ani/
 * - Links mentors for this program.
 * - Sets program.videoUrl if HERO_VIDEO_URL is provided.
 *
 * Run: bun run scripts/ingest-family-bootcamp-4-6.ts
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

const PROGRAM_SLUG = 'kogaion-family-bootcamp-4-6-ani';
const UPLOAD_DIR = join(
	process.cwd(),
	'static',
	'media',
	'uploads',
	'programe',
	'kogaion-family-bootcamp-4-6-ani'
);
const LOCAL_BASE = '/media/uploads/programe/kogaion-family-bootcamp-4-6-ani';

/** Mentor slugs from the Family Bootcamp 4-6 ani page (order preserved). */
const MENTOR_SLUGS = [
	'diana-antoci',
	'florin-munteanu',
	'iulian-glita',
	'andra-nineta-nenciu',
	'luminita-muresan',
	'andreea-draghici'
];

/** Optional: set to a video URL to use as program hero video. */
const HERO_VIDEO_URL: string | null = null;

/** Optional: gallery image URLs from source (run scrape first or fill manually). */
const GALLERY_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC08102-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05196-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05200-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07735-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05310-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05325-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05374-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05386-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05391-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05393-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05406-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05510-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05629-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05727-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05757-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05760-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05800-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05804-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05814-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05848-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05863-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05936-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06025-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06053-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06083-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06128-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06172-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06183-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06205-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06219-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06238-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06242-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06272-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06288-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06302-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06316-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06351-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06371-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06600-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06624-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06751-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06782-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06795-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC06902-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07032-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07042-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07084-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07149-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07197-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07208-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07230-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07264-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07298-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07407-1-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07432-1-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07440-1-2048x1366.jpg'
];

/** Optional: main location image URL. */
const LOCATION_IMAGE_URL: string | null =
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/Moeciu_de_Sus_Preda_Nicoleta_1500507016.10675311-768x432.jpg';

/** Optional: location grid images (e.g. 6 for 3x2). */
const LOCATION_GRID_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/3.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/5.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/foto_079-768x512.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/2-768x576.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/4.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/7-768x576.jpg'
];

/** Intro media (between the first and second intro blocks). */
const INTRO_VIDEO = {
	provider: 'youtube' as const,
	videoId: 'fFiueIdMwPM',
	title: 'Kogaion Family Bootcamp 4-6 ani'
};

/** Main image shown under "Beneficii principale". */
const BENEFITS_MAIN_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC05304-2048x1366.jpg';

async function downloadAndConvertToWebp(url: string, localPath: string): Promise<void> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
	const buf = await res.arrayBuffer();
	await sharp(Buffer.from(buf)).webp({ quality: 84 }).toFile(localPath);
}

function buildSectionPayloads(
	galleryImageUrls: string[],
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
					'Armonizare relații în familie',
					'Psihoterapie',
					'Psihopedagogie',
					'Științele complexității',
					'Inteligențe multiple',
					'Observație specializată a copilului',
					'Feedback profesional',
					'Follow-up'
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
						body: 'În tabăra de dezvoltare personală Kogaion Family Bootcamp trecem, zi după zi, 7 PRAGURI DE METAMORFOZĂ EDUCAȚIONALĂ POZITIVĂ, într-un cadru de siguranță emoțională în care copilul se simte văzut și susținut, iar părintele își recapătă claritatea și calmul emotional. Creăm un mediu educațional de excelență, fundamentat pe PSIHOLOGIA DEZVOLTĂRII, NEUROȘTIINȚE ȘI PEDAGOGIE EXPERIENȚIALĂ, care conduce la ARMONIZAREA RELAȚIEI COPIL–PĂRINTE printr-un parcurs educațional integrat: copilul își construiește siguranța interioară, autonomia și bucuria de a învăța prin joc, natură și laboratoare senzoriale, iar părintele dobândește viziune educațională pentru lumea complexă și viitorul copiilor, claritate psihopedagogică și instrumente aplicate pentru limite blânde, ritualuri sănătoase, educația valorilor și comunicare conștientă, astfel încât relația copil–părinte să devină sursă de echilibru și performanță, nu de tensiune.'
					},
					{
						body: 'În intervalul 4–6 ani, calitatea relației copil–părinte, dată de Siguranță, Co-reglare, Dialog emoțional și Structură blândă este „infrastructura" care determină simultan: Sănătatea emoțională, Funcțiile executive și Pregătirea școlară, Motivația intrinsecă și Reziliența și caracterul.'
					},
					{
						body: 'Kogaion Family Bootcamp este primul program de conștientizare a potențialului familiei din Romania, inițiat in vara anului 2013, împreună cu prof. dr. Florian Colceag, susținătorul acestui concept educațional și continuat împreună cu prof. dr. Florin Munteanu. Este un program consacrat, aflat la ce-a de-a 19-a ediție, care își propune sa aducă în atenția părinților importanța valorilor autentice în viața familiei.'
					},
					{
						body: 'Tabăra oferă:\n- OBSERVAȚIE SPECIALIZATĂ\n- FEEDBACK PROFESIONIST\n- FOLLOW-UP\nastfel încât familia să poată aplica un plan concret, coerent și sustenabil, după plecarea din tabără, bazat pe alegerea familiei.'
					},
					{
						body: 'Programul operationalizează această educație integrată printr-un design unic, triadic:\n- COPIL\n- PĂRINTE\n- COPIL-PĂRINTE.'
					}
				],
				videoBetweenBlocks: INTRO_VIDEO
			}
		},
		{
			section: 'curriculum_areas',
			sortOrder: 3,
			payload: {
				title: 'Activitățile taberei',
				areas: [
					{ title: 'SIGURANȚĂ & APARTENENȚĂ – ACASĂ ÎN CETATE: Construim siguranță și apartenență prin reguli simple, ritualuri și comunitate, astfel încât copilul capătă încredere și liniște, părintele își consolidează o prezență fermă și calmă, iar familia dobândește coeziune și stabilitate.' },
					{ title: 'LIMITE BLÂNDE – CORPUL VIU: Învățăm limite ferme și blânde, susținute de autoreglare prin corp, simțuri și mișcare, astfel încât copilul devine mai cooperant și își crește autocontrolul, părintele aplică intervenții fără ridicarea tonului, iar familia reduce crizele și câștigă echilibru.' },
					{ title: 'RITM – SUNETUL CARE UNEȘTE: Stabilizăm ritmul familiei prin poveste, muzică și limbaj emoțional care conectează, astfel încât copilul își dezvoltă exprimarea și vocabularul emoțional, părintele comunică mai clar și repară mai ușor tensiunile, iar familia trăiește relații mai calde și tranziții mai line.' },
					{ title: 'COOPERARE – LUMINA ȘI DRUMURILE: Exersăm cooperarea prin orientare, jocuri de echipă și explorare ghidată în spațiu și natură, astfel încât copilul își dezvoltă abilitățile sociale și atenția, părintele ghidează fără control excesiv, iar familia își crește încrederea reciprocă și capacitatea de colaborare.' },
					{ title: 'DEMNITATE – TRANSFORMAREA: Consolidăm demnitatea prin procese reale de creație, hrană și contribuție în comunitate, astfel încât copilul își construiește o stimă de sine sănătoasă, părintele învață recunoașterea corectă a efortului, iar familia creează ritualuri comune care întăresc apartenența.' },
					{ title: 'ÎNȚELEGERE – EU POT: Dezvoltăm autonomia și curajul prin expresie, inițiativă și gândire flexibilă aplicată, astfel încât copilul capătă inițiativă și curaj social, părintele susține fără etichetare și fără supracontrol, iar familia echilibrează libertatea cu limite clare și respect reciproc.' },
					{ title: 'DĂRUIRE – RECUNOȘTINȚĂ: Integrăm experiența în recunoștință și ritualuri concrete de continuitate acasă, astfel încât copilul își dezvoltă sensul și bucuria contribuției, părintele pleacă cu un plan simplu de menținere, iar familia susține progresul pe termen lung.' }
				]
			}
		},
		{
			section: 'benefits_main',
			sortOrder: 4,
			payload: {
				eyebrow: 'Beneficii',
				title: 'Beneficiile Kogaion Family Bootcamp',
				intro:
					'În tabără, rezultatele se simt în relație: mai multă claritate între voi, instrumente simple pentru acasă și spațiu în care copilul și părintele cresc împreună. Mai jos sunt direcțiile pe care le urmărim în cele șapte zile.',
				items: [
					'conștientizarea părintelui asupra modului în care propriul comportament influențează atitudinea copilului față de succesul personal, școlar și social',
					'conștientizarea propriului model parental și a felului în care se proiectează în motivațiile copilului',
					'conștientizarea importanței atitudinilor pozitive și constructive ale părintelui, ancorate în valori universale, pentru încrederea în sine, performanță și succes la copil',
					'repere pentru o relație armonioasă copil–părinte–mentor',
					'dezvoltarea motivației copiilor prin cunoașterea pasiunilor și a punctelor forte, cu drum mai clar spre performanță',
					'formarea unei personalități armonioase prin învățare experiențială, care sprijină încrederea și stima de sine',
					'menținerea curiozității și dezvoltarea capacităților care susțin învățarea autentică, actualizabilă pe parcursul vieții',
					'dezvoltarea curajului de a se exprima prin gândire critică și consolidarea structurii volitiv-atitudinale'
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
					'descoperirea reperelor pentru identificarea și dezvoltarea potențialelor native, spre integrare socială și armonie în viața personală și de familie',
					'lărgirea orizontului de cunoaștere și îmbunătățirea comunicării copil–părinte–mentor, ca bază a relației dintre copil, părinte și mentor și sprijin pentru integrare socială și armonie familială',
					'dezvoltarea și consolidarea încrederii și stimei de sine, ca fundație pentru viitoarele demersuri de cunoaștere și comunicare la nivel personal, familial și social',
					'depășirea barierelor care limitează potențialul copiilor și adulților, prin conștientizarea forței interioare — de la ideea „Cunoaște-te pe tine însuți”',
					'eliminarea blocajelor de exprimare (fizic, emoțional, mental, social) prin conștientizarea rolului comunicării și a curajului de a exprima verbal și non-verbal, respectând specificul vârstei',
					'dezvoltarea unei rețele online între copiii cu aceleași pasiuni și părinții cu domenii comune de expertiză'
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
					alt: `Tabără Family Bootcamp Kogaion — familii și copii la munte, fotografie ${idx + 1}`
				}))
			}
		},
		{
			section: 'location',
			sortOrder: 7,
			payload: {
				eyebrow: 'Locație',
				title: 'Pensiunea Nicoleta 3***, Moieciu de Sus',
				intro:
					'Cazare la munte pentru familii: confort, natură aproape și ritm potrivit pentru programul Family Bootcamp 4–6 ani.',
				body: 'Pensiunea este situată la poalele munților Bucegi, la 45 km de Brașov și la 3 km de intrarea în Parcul Național Piatra Craiului. Are două clădiri. Camerele sunt pentru 2 persoane (pat matrimonial), 3 persoane (pat matrimonial și pat single) sau apartamente pentru 4 persoane. Fiecare cameră are baie proprie cu duș, balcon, televizor prin cablu și internet wireless. Accesul cu animale de companie nu este permis. Unele camere duble pot primi un pat suplimentar. În curte: spațiu de joacă pentru copii, foișor, sală de jocuri (biliard, ping-pong), terasă, parcare, foișor suspendat, restaurant. Se pot închiria ATV-uri.',
				amenities: ['Terasă', 'Restaurant'],
				image: locationImage ?? undefined,
				images: locationGridUrls.length > 0 ? locationGridUrls : undefined,
				mapEmbedUrl:
					'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2799.4806759400667!2d25.338378376980906!3d45.439969071073676!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b3399ce553a2e1%3A0xae96c5429b8eb81e!2sPensiunea%20Nicoleta%20-%20Moieciu%20de%20Sus!5e0!3m2!1sen!2sro!4v1773683990236!5m2!1sen!2sro'
			}
		},
		{
			section: 'enrollment',
			sortOrder: 8,
			payload: {
				title: 'Înscriere',
				intro: 'Înscrierea începe cu o conversație cu echipa Kogaion: verificăm împreună dacă formatul de tabără se potrivește familiei voastre și, dacă da, vă ghidăm spre pașii următori — fără presiune, cu claritate.',
				steps: [],
				contactNote: 'Te rugăm să completezi formularul de detalii pentru a fi contactat sau sună la 0720.529.398 (Diana Antoci)',
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

	const galleryImageUrls: string[] = [];
	for (let i = 0; i < GALLERY_IMAGE_URLS.length; i++) {
		const url = GALLERY_IMAGE_URLS[i];
		const name = `kogaion-family-bootcamp-4-6-ani-gallery-${String(i + 1).padStart(2, '0')}.webp`;
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
	if (LOCATION_IMAGE_URL) {
		const name = 'kogaion-family-bootcamp-4-6-ani-location-main.webp';
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
		const name = `kogaion-family-bootcamp-4-6-ani-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(url, localPath);
			locationGridUrls.push(`${LOCAL_BASE}/${name}`);
			console.log('  Location grid', name);
		} catch (e) {
			console.warn('  Skip location grid', name, e);
		}
	}

	let benefitsMainImage: string | null = null;
	{
		const name = 'kogaion-family-bootcamp-4-6-ani-benefits-main.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(BENEFITS_MAIN_IMAGE_URL, localPath);
			benefitsMainImage = `${LOCAL_BASE}/${name}`;
			console.log('  Benefits main', name);
		} catch (e) {
			console.warn('  Skip benefits image', e);
		}
	}

	if (HERO_VIDEO_URL) {
		await db.update(program).set({ videoUrl: HERO_VIDEO_URL }).where(eq(program.id, programId));
		console.log('  Set program hero video');
	}

	console.log('Linking mentors...');
	await db.delete(programMentor).where(eq(programMentor.programId, programId));
	let linked = 0;
	for (const slug of MENTOR_SLUGS) {
		const [m] = await db.select().from(mentor).where(eq(mentor.slug, slug)).limit(1);
		if (m) {
			await db.insert(programMentor).values({ programId, mentorId: m.id });
			linked++;
		}
	}
	console.log('  Linked', linked, 'mentors');

	console.log('Upserting program sections (RO)...');
	await db.delete(programSection).where(eq(programSection.programId, programId));
	const sections = buildSectionPayloads(
		galleryImageUrls,
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
