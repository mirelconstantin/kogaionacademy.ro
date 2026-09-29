/**
 * Ingest content and assets for the conectom-advanced-learning-2 program.
 * - Inserts program_section rows (RO) with full content from kogaionacademy.ro.
 * - Downloads the location media to static/media/uploads/programe/conectom-advanced-learning-2/
 * - Links mentors for this program.
 *
 * Source page: https://kogaionacademy.ro/programe/conectom-advanced-learning-2/
 * The page has no "Beneficii secundare", no "Galerie foto" and no "Meniu" block,
 * so those sections are intentionally not emitted.
 *
 * Run: bun run scripts/ingest-conectom-advanced.ts
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

const PROGRAM_SLUG = 'conectom-advanced-learning-2';
const UPLOAD_DIR = join(
	process.cwd(),
	'static',
	'media',
	'uploads',
	'programe',
	'conectom-advanced-learning-2'
);
const LOCAL_BASE = '/media/uploads/programe/conectom-advanced-learning-2';

/**
 * Mentor slugs from the Conectom Advanced Learning page.
 * The page lists 9 mentors; "Dragoș Claudiu Borugă" has no matching row in the
 * mentor table and is therefore not linked.
 */
const MENTOR_SLUGS = [
	'diana-antoci',
	'florin-munteanu',
	'alina-monica-antoci',
	'andrei-stan',
	'ovidiu-harbada',
	'george-grama',
	'madalina-gavrilescu',
	'constantin-caprioreanu'
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
	locationImage: string | null,
	locationGridUrls: string[]
): Array<{ section: string; sortOrder: number; payload: Record<string, unknown> }> {
	return [
		{
			section: 'hero_highlights',
			sortOrder: 0,
			payload: {
				items: [
					'Identitate & Neuroștiințe',
					'Reziliență & Corp',
					'Gândire sistemică',
					'Inovație',
					'Comunicare',
					'Leadership colaborativ',
					'Conectare cu natura',
					'Comunitate',
					'Feedback de specialitate individual'
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
						body: 'Participarea la programul ConectOM reprezintă pentru adolescenți o experiență transformatoare care le armonizează identitatea personală, reziliența corp–minte, gândirea sistemică și capacitatea de inovare printr-un parcurs educațional integrat.'
					},
					{
						body: 'cine: adolescenți 13 – 18 ani\nunde: Bran, Pensiunea Mama Cozonacilor, la poalele masivului Bucegi\ncând: 11–20 august 2026, 10 zile'
					},
					{
						body: 'ConectOM le oferă oportunitatea de a dezvolta proiecte reale, transdisciplinare, de a-și exersa vocea publică și capacitatea de leadership în contexte complexe, cultivându-le autonomia, discernământul, echilibrul interior și aptitudinile necesare pentru a naviga matur lumea de mâine.'
					}
				]
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
							'Identitate și neuroștiințe. Autocunoaștere, metacogniție, neuroplasticitate, arhitectura atenției – Atelierul îi ghidează pe adolescenți în înțelegerea propriului „profil interior": cum funcționează atenția, memoria, emoțiile și procesele decizionale. Prin concepte din neuroștiințe și psihologia dezvoltării, tinerii descoperă cum se formează identitatea, ce rol are neuroplasticitatea în schimbare și cum pot folosi metacogniția pentru a-și gestiona învățarea, obiceiurile și direcțiile personale. Ei exersează strategii de autoreglare, clarificare a valorilor și observare a propriilor tipare, obținând o hartă de sine coerentă, esențială pentru autonomia adolescenței.'
					},
					{
						title:
							'Reziliență și corp. Somn, respirație, nutriție, mișcare, reglare emoțională, natura ca mentor – Adolescenții învață să își cunoască organismul nu doar ca suport biologic, ci ca sistem integrat care influențează direct atenția, emoțiile, energia și capacitatea de învățare. Atelierul include rutine de respirație, tehnici de stabilizare emoțională, înțelegerea ritmurilor somnului, principiile unei nutriții echilibrate și forme de mișcare adaptate corpului lor în creștere. Natura este folosită ca mentor – un spațiu care modelează calmul, prezența și adaptabilitatea. Activitatea consolidează reziliența fizică și emoțională, responsabilitatea față de propriul corp și abilitatea de a lua decizii sănătoase.'
					},
					{
						title:
							'Gândire de sistem și științele complexității. Rețele, fluxuri și modele ale lumii reale – Adolescenții sunt expuși la concepte riguroase din științele complexității – cum funcționează rețelele, dinamica sistemelor, feedback-ul, emergența, adaptarea și comportamentele colective. Ei analizează probleme din lumea reală (climă, tehnologie, orașe, sănătate, social media) pentru a înțelege cum sunt conectate și de ce soluțiile simple sunt rareori suficiente. Activitatea dezvoltă gândirea critică, capacitatea de analiză, abilitatea de a vizualiza relații invizibile și competența de a lucra cu situații ambigue, neliniare și multidimensionale — competențe de vârf pentru societatea viitorului.'
					},
					{
						title:
							'Proiect de inovație și prototipare. Problem framing, design etic și soluții aplicate – Pornind de la o problemă reală identificată de participanți, adolescenții trec prin toate etapele unui proces de inovare: formularea problemei (problem framing), analiza stakeholderilor, generarea de idei, construcția unui concept etic și realizarea unui prototip low-fi. Ei exersează gândirea convergentă și divergentă, înțeleg ce înseamnă să creezi soluții responsabile pentru oameni și comunități și dobândesc experiență cu metode moderne de design thinking. Atelierul cultivă curajul intelectual, spiritul antreprenorial, responsabilitatea socială și capacitatea de a transforma ideile în proiecte reale.'
					},
					{
						title:
							'Retorică, comunicare și pitch public. Argumentare logică și storytelling academic – Adolescenții descoperă cum să își structureze gândurile în argumente clare, susținute logic, etic și persuasiv. Învață să folosească tehnici de storytelling, structurare academică, construcție de discurs și comunicare nonverbală pentru a transmite idei complexe într-un mod convingător. În finalul taberei, fiecare participant susține un pitch public al proiectului său de inovație. Activitatea dezvoltă încrederea în sine și abilități esențiale pentru viața academică și profesională.'
					},
					{
						title:
							'Leadership colaborativ, negociere și gestionarea conflictului – Tinerii învață cum funcționează leadershipul în contexte reale – nu ca autoritate, ci ca formă de coordonare inteligentă a unui grup. Exersează negocierea, ascultarea activă, empatia, medierea situațiilor tensionate și luarea deciziilor în echipă. Descoperă dinamica rolurilor (facilitator, analist, mediator, vizionar, organizator) și cum se manifestă inteligența colectivă atunci când membrii se sprijină reciproc. Atelierul întărește abilitățile sociale avansate, competența de colaborare și maturitatea emoțională.'
					},
					{
						title:
							'Conectare cu natura și explorare. Ecologie aplicată și reflecție outdoor – Natura este integrată ca spațiu de învățare, observație și reglare. Prin drumeții, exerciții de atenție, explorări ecologice și momente de reflecție în aer liber, tinerii învață să observe modele naturale care se regăsesc în sisteme umane și tehnologice. Activitatea dezvoltă prezența, adaptabilitatea, curiozitatea și capacitatea de a înțelege lumea ca ansamblu interdependent. Este și un spațiu de reechilibrare fizică și mentală, care ancorează procesele de învățare în experiență directă.'
					},
					{
						title:
							'Comunitate și peer learning. Dinamici de grup și ritualuri de echipă – Tabăra devine un laborator social în care adolescenții experimentează învățarea între egali, construirea ritualurilor de echipă, schimbul de resurse și sprijinul reciproc. Această dimensiune cultivă sentimentul de apartenență, responsabilitatea față de grup și capacitatea de a crea comunități sănătoase și funcționale. Participanții învață că evoluția personală și evoluția grupului sunt profund interconectate.'
					},
					{
						title:
							'Feedback de specialitate despre adolescent – observarea comportamentului și a abilităților de specialitate în diverse contexte de învățare cu sarcini exploratorii multidisciplinare și în interacțiune cu ceilalți; se oferă adolescenților și părinților oral, la cerere, în ultima zi a taberei.'
					},
					{
						title:
							'Follow-up la 6 luni, 1 an, 2 ani – observare, conectare și consolidare; evaluare parcurs identitar'
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
					'💞 Clarificarea identității și dezvoltarea metacogniției ca fundament al autonomiei personale și academice',
					'📚 Formarea rezilienței fizice și emoționale prin practici validate din neuroștiințe și ecologie aplicată',
					'🌱 Dezvoltarea gândirii sistemice și a capacității de a analiza probleme complexe ale lumii reale',
					'💬 Inovare responsabilă prin proiecte de prototipare, design etic și soluții aplicate',
					'🎨 Perfecționarea comunicării academice și a discursului public prin retorică, storytelling și pitch final',
					'🌍 Dezvoltarea leadershipului colaborativ, a empatiei și a maturității relaționale prin dinamici de grup și peer learning'
				]
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
					'Înscrierea în tabăra Kogaion ConectOM Advanced Learning – presupune o primă discuție cu reprezentanții Kogaion, pentru stabilirea împreună a măsurii în care tabăra este potrivită pentru copilul dvs. și pentru ghidarea către programul educațional care se potrivește cel mai bine copilului dvs.',
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

	let locationImage: string | null = null;
	{
		const name = 'conectom-advanced-learning-2-location-main.webp';
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
		const name = `conectom-advanced-learning-2-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
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
	const sections = buildSectionPayloads(locationImage, locationGridUrls);
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
