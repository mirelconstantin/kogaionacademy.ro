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

const PROGRAM_SLUG = 'kogaion-family-bootcamp';
const UPLOAD_DIR = join(
	process.cwd(),
	'static',
	'media',
	'uploads',
	'programe',
	'kogaion-family-bootcamp'
);
const LOCAL_BASE = '/media/uploads/programe/kogaion-family-bootcamp';

const MENTOR_SLUGS = [
	'diana-antoci',
	'florin-munteanu',
	'andreea-draghici',
	'ovidiu-harbada',
	'andrei-stan'
];

const INTRO_VIDEO = {
	provider: 'youtube' as const,
	videoId: 'TxQy3GMgo0A',
	title: 'Kogaion Family Bootcamp 7-12 ani'
};

const INTRO_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL0031-2048x1365.jpg';
const BENEFITS_MAIN_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL2471-2048x1366.jpg';
const COVER_IMAGE_URL = 'https://kogaionacademy.ro/wp-content/uploads/2023/02/family-7-12-1024x576.jpg';

const GALLERY_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL4585-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL4929-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL9386-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2022/01/RDCL2672-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2022/01/RDCL4725-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2022/01/RDCL2591-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2022/02/RDCL2818-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL3914-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL4036-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL3701-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL3534-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL3509-1-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL2914-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL3354-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL2669-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL2538-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL2419-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL1599-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL1481-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL1466-2048x1365.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL1148-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL1225-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL0613-2048x1366.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL0453-2048x1365.jpg'
];

const LOCATION_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/Moeciu_de_Sus_Preda_Nicoleta_1500507016.10675311.jpg';
const LOCATION_GRID_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/3.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/5.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/foto_079.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/2.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/4.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2025/11/7.jpg'
];

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
	benefitsMainImage: string | null,
	introImage: string | null
) {
	return [
		{
			section: 'hero_highlights',
			sortOrder: 0,
			payload: {
				items: [
					'Follow-up',
					'Feedback profesional',
					'Observație specializată a copilului',
					'Inteligențe multiple',
					'Științele complexității',
					'Psihopedagogie',
					'Psihoterapie',
					'Armonizare relație copil-părinte'
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
						body: 'În Kogaion Family Bootcamp 7–12 ani, familia parcurge 7 PRAGURI DE METAMORFOZĂ EDUCAȚIONALĂ POZITIVĂ într-un cadru de siguranță psihologică, provocare cognitivă sănătoasă și bucurie de a trăi. Programul operaționalizează un design triadic: – COPIL (enrichment structurat pe inteligențe multiple) – PĂRINTE (psihologie și psihopedagogie aplicată, științele complexității) și – COPIL – PĂRINTE (ateliere ghidate zilnic, observate). Fiecare prag devine o zi de antrenament relațional și cognitiv, în care atelierele COPIL–PĂRINTE sunt ghidate de mentori și observate pentru feedback, iar părinții consolidează prin sesiuni aplicate principiile și instrumentele zilei, astfel încât schimbarea să fie învățată în tabără și transferată sustenabil acasă.'
					},
					{
						body: 'Kogaion Family Bootcamp este primul program de conștientizare a potențialului familiei din Romania, inițiat in vara anului 2013, împreună cu prof. dr. Florian Colceag, susținătorul acestui concept educațional și continuat pentru al treilea an împreună cu prof. dr. Florin Munteanu.'
					},
					{
						body: 'Este un program consacrat, aflat la ce-a de-a 43-a ediție, care își propune sa aducă în atenția părinților importanța valorilor autentice în viața familiei.'
					},
					{
						body: 'Creăm un mediu educațional de excelență, fundamentat pe PSIHOLOGIA DEZVOLTĂRII, NEUROȘTIINȚE și PEDAGOGIE EXPERIENȚIALĂ, ȘTIINȚELE COMPLEXITĂȚII și ACTIVITĂȚI DE TIP ENRICHMENT, structurate pe INTELIGENȚE MULTIPLE, care conduce la ARMONIZAREA RELAȚIEI COPIL–PĂRINTE printr-un parcurs educațional integrat:\n- părintele dobândește viziune educațională pentru lumea complexă în care trăim, claritate, leadership familial aplicat și instrumente de parenting conștient aplicate pentru provocările acestei vârste (limite inteligente, comunicare fără escaladare, motivare fără presiune toxică, rutine sănătoase, contract digital, reparație după conflict)\n- copilul își antrenează competențele care îl ajută în viața reală – autoreglarea, atenția, gândirea flexibilă, perseverența și relațiile sănătoase, prin proiecte valoroase aplicate (știință, artă, natură, tehnologie)'
					},
					{
						body: 'Rezultatul este o familie care funcționează mai mult ca o echipă stabilă, în care relația devine sursă de echilibru și performanță sănătoasă.'
					}
				],
				videoBetweenBlocks: INTRO_VIDEO,
				imageBetweenBlocks: introImage ?? undefined
			}
		},
		{
			section: 'curriculum_areas',
			sortOrder: 3,
			payload: {
				title: 'Activitățile taberei',
				areas: [
					{ title: 'APARTENENȚĂ CONȘTIENTĂ – „Contractul care creează siguranță”: Construim siguranță psihologică și apartenență prin reguli cu sens, ritualuri și un contract de familie și grup, astfel încât copilul se simte văzut și inclus fără conformism, părintele își consolidează fermitatea calmă și consecventă, iar familia capătă coeziune, predictibilitate și încredere reciprocă.' },
					{ title: 'LIMITE INTELIGENTE – „Ferm și blând, fără escaladare”: Învățăm limite ferme și blânde, cu limbaj de reparație și protocoale de “pauză” în conflict, astfel încât copilul își dezvoltă autocontrolul și respectul pentru reguli, devenind mai cooperant, părintele învață intervenții eficiente fără ridicarea tonului și fără rușinare, iar familia reduce crizele, negocierile infinite și tensiunea zilnică.' },
					{ title: 'AUTOREGLARE – „Corpul ca bază pentru minte”: Stabilizăm atenția și emoțiile prin corp, ritm, somn, mișcare și instrumente scurte de resetare, astfel încât copilul câștigă energie bună și disponibilitate pentru învățare, părintele își regăsește prezența și capacitatea de co-reglare, iar familia își îmbunătățește tranzițiile, clima emoțională și reziliența.' },
					{ title: 'RELAȚII ȘI STATUT – „Prietenie, frați, grup”: Exersăm cooperarea, negocierea și repararea conflictului în contexte de echipă, astfel încât copilul își dezvoltă inteligența socială și demnitatea în grup, părintele învață când să ghideze și când să lase copilul să învețe responsabil, iar familia își crește capacitatea de colaborare și reduce rivalitatea și competiția toxică.' },
					{ title: 'COMPETENȚĂ ȘI PERSEVERENȚĂ – „Eu pot”: Construim competență prin proiecte aplicate, feedback și strategii de finalizare, astfel încât copilul își crește încrederea în învățare și toleranța la frustrare, părintele dobândește un cadru sănătos pentru motivație și rutină de lucru, iar familia transformă performanța din presiune în bucurie a efortului.' },
					{ title: 'IDENTITATE ȘI LUME DIGITALĂ – „Atenție, AI, Tehnologie, Alegeri”: Așezăm relația cu tehnologia pe discernământ, contract și creație, astfel încât copilul își protejează atenția și demnitatea, părintele capătă reguli coerente și aplicabile fără conflict permanent, iar familia echilibrează libertatea cu limite clare, folosind tehnologia ca instrument, nu ca substitut relațional.' },
					{ title: 'SENS ȘI DĂRUIRE – „Recunoștință, valori, continuitate acasă”: Integrăm experiența în valori, recunoștință și ritualuri concrete de continuitate, astfel încât copilul își dezvoltă orientarea către sens și contribuție, părintele pleacă cu un plan de menținere și intervenție în criză, iar familia consolidează schimbarea pe termen lung prin obiceiuri mici, stabile și asumate.' }
				]
			}
		},
		{
			section: 'benefits_main',
			sortOrder: 4,
			payload: {
				title: 'Beneficii principale',
				items: [
					'conștientizarea părintelui asupra implicațiilor comportamentului propriu în dezvoltarea atitudinilor pozitive ale copilului față de succesul personal, școlar și social',
					'conștientizarea propriului model parental și proiecția acestuia în construirea motivațiilor personale ale copilului',
					'conștientizarea importanței dezvoltării atitudinilor pozitive, constructive ale părintelui, fundamentate pe valori universale și rolul acestora în fundamentarea încrederii în sine la copil, a performanței și succesului',
					'repere în construirea unei relații armonioase copil-părinte-mentor',
					'dezvoltarea motivației copiilor, prin susținerea cunoașterii legată atât de domeniul de pasiune cât și de abilitățile predominante, netezind drumul spre performanță',
					'formarea unei personalități armonioase prin învățare experiențială, generatoare de creșterea încrederii și a stimei de sine',
					'menținerea unei curiozități vii și dezvoltarea capacitaților psihice care să construiască mecanisme de învățare autentică, ce vor putea fi actualizate pe parcursul întregii vieți',
					'dezvoltarea curajului de auto-expresie prin dezvoltarea gândirii critice și a structurii volitiv-atitudinale a personalității'
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
					'descoperirea reperelor privind identificarea potentialelor ascunse si dezvoltarea potentialelor native in scopul realizarii acestor potentiale, pentru atingerea unui grad cat mai mare de integrare sociala a viitorului adult, gasirea resorturilor de indeplinire a menirii fiecarei persoane si a armoniei in viata personala si de familie',
					'largirea orizontului de cunoastere si imbunatatirea comunicarii copil-parinte-mentor, ca fundament al relatiei umane ce se creaza intre copil si parinte pe de o parte si intre copil si mentor pe de alta parte, relatie care contribuie intr-o masura definitorie la integrarea sociala si la armonia familiala',
					'dezvoltarea si consolidarea increderii si stimei de sine, pentru asigurarea unei fundatii care sa stea la baza viitoarelor constructe de cunoastere si comunicare in plan personal, familial si social',
					'demolarea barierelor ce stau in calea maximizarii potentialelor native ale copiilor si adultilor prin cunoasterea fortei interioare, plecand de la sintagma: „Cunoaste-te pe tine insuti”',
					'eliminarea blocajelor de exprimare la nivel fizic, emotional, mental si social prin constientizarea rolului comunicarii in viata noastra, a curajului exprimarii atat la nivel verbal cat si non-verbal, urmarind caracteristicile fiecarei varste',
					'dezvoltarea unei retele on line printre copiii cu aceleasi pasiuni si parintii cu aceleasi arii de expertiza'
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
					alt: `Galerie Family Bootcamp 7-12 ${idx + 1}`
				}))
			}
		},
		{
			section: 'transport',
			sortOrder: 7,
			payload: {
				title: 'Transport',
				body: 'Transportul la și de la locație se asigură de părinți.'
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
				subtitle: 'Pensiunea Nicoleta 3***, Moieciu de Sus',
				body: 'Pensiunea este localizata la poalele muntilor Bucegi, la 45 km. de Brasov, la 3 km. de intrarea in Parcul National Piatra Craiului. Pensiunea dispune de 2 cladiri. Camerele sunt de 2 locuri cu paturi matrimoniale, 3 locuri cu un pat matrimonial si un pat single si apartamente de 4 locuri. Fiecare camera este dotata cu baie proprie cu dus, balcon, TV cu televiune prin cablu, internet wireless. Accesul cu animale de companie este interzis. Unele camere duble pot fi completate cu un pat suplimentar. In curtea pensiunii exista amenajat un spatiu de joaca pentru copii, un foisor, o sala de jocuri cu biliard, ping-pong, terasa, parcare, foisor suspendat, restaurant. Exista posibilitatea de a inchiria ATV-uri.',
				amenities: ['Terasă', 'Restaurant'],
				image: locationImage ?? undefined,
				images: locationGridUrls.length > 0 ? locationGridUrls : undefined,
				mapEmbedUrl:
					'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2799.4806759400667!2d25.338378376980906!3d45.439969071073676!2m3!1f0!2f0!3f0!2m3!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b3399ce553a2e1%3A0xae96c5429b8eb81e!2sPensiunea%20Nicoleta%20-%20Moieciu%20de%20Sus!5e0!3m2!1sen!2sro!4v1773683990236!5m2!1sen!2sro'
			}
		},
		{
			section: 'enrollment',
			sortOrder: 10,
			payload: {
				title: 'Înscriere',
				intro: 'Înscrierea în tabăra Kogaion Family Bootcamp presupune o primă discuție cu reprezentanții Kogaion, pentru stabilirea împreună a măsurii în care tabăra este potrivită nevoilor familiei dvs. și pentru ghidarea către programul educațional care se potrivește cel mai bine familiei sau copilului dvs.',
				steps: [],
				contactNote:
					'Te rugăm să completezi formularul de detalii pentru a fi contactat sau sună la 0720.529.398 (Diana Antoci)',
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

	let coverImageUrl: string | null = null;
	{
		const name = 'kogaion-family-bootcamp-cover.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(COVER_IMAGE_URL, localPath);
			coverImageUrl = `${LOCAL_BASE}/${name}`;
			console.log('  Cover', name);
		} catch (e) {
			console.warn('  Skip cover', e);
		}
	}

	const galleryImageUrls: string[] = [];
	for (let i = 0; i < GALLERY_IMAGE_URLS.length; i++) {
		const url = GALLERY_IMAGE_URLS[i];
		const name = `kogaion-family-bootcamp-gallery-${String(i + 1).padStart(2, '0')}.webp`;
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
		const name = 'kogaion-family-bootcamp-location-main.webp';
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
		const name = `kogaion-family-bootcamp-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
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
		const name = 'kogaion-family-bootcamp-benefits-main.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(BENEFITS_MAIN_IMAGE_URL, localPath);
			benefitsMainImage = `${LOCAL_BASE}/${name}`;
			console.log('  Benefits main', name);
		} catch (e) {
			console.warn('  Skip benefits image', e);
		}
	}

	let introImage: string | null = null;
	{
		const name = 'kogaion-family-bootcamp-intro-main.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(INTRO_IMAGE_URL, localPath);
			introImage = `${LOCAL_BASE}/${name}`;
			console.log('  Intro image', name);
		} catch (e) {
			console.warn('  Skip intro image', e);
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
		locationImage,
		locationGridUrls,
		benefitsMainImage,
		introImage
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
