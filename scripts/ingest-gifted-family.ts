/**
 * Ingest content and assets for the kogaion-gifted-family program.
 * - Inserts/updates program_locale (RO/EN fallback strings) and program_section rows
 * - Downloads source assets, converts to .webp and stores them under:
 *   static/media/uploads/programe/kogaion-gifted-family/
 * - Links mentors in source order
 *
 * Run: bun --env-file=.env scripts/ingest-gifted-family.ts
 */
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, eq } from 'drizzle-orm';
import { program, programLocale, programSection, programMentor, mentor } from '../src/lib/server/db/schema';
import sharp from 'sharp';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const PROGRAM_SLUG = 'kogaion-gifted-family';
const PROGRAM_DIR_SLUG = 'kogaion-gifted-family';
const UPLOAD_DIR = join(process.cwd(), 'static', 'media', 'uploads', 'programe', PROGRAM_DIR_SLUG);
const LOCAL_BASE = `/media/uploads/programe/${PROGRAM_DIR_SLUG}`;

const COVER_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/father-and-son__sunset-1024x576.jpg';
const INTRO_IMAGE_URL = 'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC08183-1.jpg';
const BENEFITS_MAIN_IMAGE_URL = 'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07930.jpg';

const GALLERY_IMAGE_URLS: string[] = [
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC08145.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_0513-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_1011-1-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_1011-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC08183.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_1017-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_0048-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL2480-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/08/DSC_0056-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_0163-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_0010-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_0205-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_0244-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_0288-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/12/RDCL2538-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_0554-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_0575-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_0673-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/DSC_0742-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07740-1.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07833.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07882.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07894.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07896.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07902.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07918.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC07930.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC08148.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC08152.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC08190.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC08432.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC08496.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC08793.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DSC08965.jpg'
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

const INTRO_VIDEO = {
	provider: 'youtube' as const,
	videoId: 'kdf_mI1SP3M',
	title: 'Kogaion Gifted Family'
};

const MENTOR_SLUGS = [
	'diana-antoci',
	'florin-munteanu',
	'luminita-muresan',
	'ovidiu-harbada',
	'iulian-glita',
	'andra-nineta-nenciu',
	'doru-tatar'
];

const MISSING_MENTORS = [
	{
		slug: 'luminita-muresan',
		nameRo: 'Luminița Mureșan',
		titleRo: 'Psiholog clinician, Psihoterapeut, Mediator Feuerstein',
		image: '/media/uploads/mentori/luminita-muresan.webp',
		sourceImageUrl: 'https://kogaionacademy.ro/wp-content/uploads/2026/01/Luminita-Muresan.jpg'
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
					'Conștientizarea nevoilor și particularităților copiilor gifted',
					'Educația abilităților înalte și valorificarea dăruirii',
					'Cunoaștere de sine: emoții și relații interumane',
					'Tehnologie inovativă: Omul ființă multidimensională',
					'Explorarea universului interior prin comunicare și arta colajului',
					'Incursiune în lumea științelor: biologie experimentală, fizică experimentală, anatomia corpului uman',
					'Inovație - rol decisiv pentru împlinirea copiilor',
					'Armonie relațională în familie',
					'Modele umane pentru copiii gifted. Rolul părinților',
					'Povestea mea. Creativitate',
					'Calitatea vieții. Conștientizare loc și rost în lume'
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
						body: 'Tabăra este dedicată tuturor familiilor care își doresc o experiență inedită, copiilor și părinților open-minded, care sunt pregătiți să exploreze complexitatea vieții, sunt deschiși să își depășească limitele și să iasă din zona de confort, sunt deschiși provocărilor și sunt pregătiți să apese acele butoane care să le aducă noi perspective asupra vieții.'
					},
					{
						body: 'Copiilor și părinților le oferim experiențe de neuitat, concepute pentru a inspira dragoste de învățare pe tot parcursul vieții și pentru a-i încuraja să-și mențină interes ridicat și capacitate înaltă pentru pasiunile lor.'
					},
					{
						body: 'Tabăra are menirea de a aprinde o scânteie, ce va continua să crească pe tot parcursul vieții copilului, dar și a părintelui.'
					},
					{
						body: 'Kogaion Gifted Family este primul program de conștientizare a potențialului familiei gifted din Romania, inițiat in vara anului 2019, împreună cu prof. dr. Florian Colceag, susținătorul acestui concept educațional și continuat împreună cu prof. dr. Florin Munteanu și echipa actuală de mentori.'
					},
					{
						body: 'Este un program consacrat, aflat la cea de-a 7-a ediție, care își propune sa aducă în atenția părinților importanța valorilor autentice în viața familiilor cu copii gifted.'
					},
					{
						body: 'În tabăra Kogaion Gifted Family urmărim dezvoltarea interioară a părinților prin conștientizarea momentelor de dizarmonie în familie și în relație cu copilul, oferirea de soluții și „aha moments”, cunoașterea mai bună a copilului în medii din afara casei, prin monitorizarea comportamentului lui în diverse contexte de învățare cu sarcini academice multidisciplinare și în interacțiune cu ceilalți, oferirea de feedback de specialitate despre copil, atât în grup cât și individual, precum și prin oferirea unei radiografii a societății în care trăim cu translatare asupra viitorului în care copiii noștri vor fi mari, o viziune unică, integrată, asupra dinamicii lumii în care trăim.'
					},
					{
						body: 'O experiență transformațională pentru copii și părinți!\n\nEste o tabără despre:\n- arta de A FI, de A TRĂI FRUMOS, despre Tine în relație cu Sine, cu Familia ta, cu Ceilalți și cu Mediul in care trăiești\n- cunoaștere, conștientizare si reflecție asupra nevoilor si potențialelor de vârstă ale copiilor gifted: cognitiv, emoțional, social, spiritual\n- dezvoltare personală și schimb de bune practici între oameni cu aceleași valori\n\nTabăra constituie o provocare puternică pentru copii și părinți, din multiple perspective: conștientizare si reflecție asupra nevoilor de vârstă ale copiilor, atenție asupra dezvoltării potențialelor familiei, colaborare și empatie în relațiile de familie, observarea pattern-urilor negative repetitive și găsirea căilor de depășire a situațiilor dificile și a blocajelor, punerea de întrebări pentru aflarea soluțiilor optime în luarea deciziilor.\n\nCopiii și părinții vor câștiga pre-rechizite importante pentru dezvoltarea lor integrată și armonioasă.'
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
				groups: [
					{
						title: 'Copiii',
						areas: [
							{ title: 'Științele complexității împreună cu dr. Florin Munteanu – derulare proiect Tehnologie inovativă.' },
							{ title: 'Fizică experimentală împreună cu Dumitru Bădilă.' },
							{ title: 'Biologie experimentală împreună cu Andreea Drăghici.' },
							{ title: 'Anatomia corpului uman împreună cu Andreea Drăghici.' },
							{ title: 'Cunoaștere de sine împreună cu Cristina Dinu-Popa, având ca temă Creație de detensionare, povești și boardgames.' },
							{ title: 'Atenție și creativitate împreună cu Andrei Stan.' }
						]
					},
					{
						title: 'Părinții',
						areas: [
							{
								title:
									'Științele complexității împreună cu dr. Florin Munteanu: Cum să fim părinți/învățători mai buni? De ce ar trebui să ne schimbăm viziunea față de realitate? Ce este de făcut? Știință – între necesitate și respingere; Programe STEM și STEAM; Programul NEXUS-Kogaion.'
							},
							{ title: 'Științele complexității împreună cu dr. Florin Munteanu: Aplicație – Dacă aș fi părintele lui Chopin, ce aș face?' },
							{
								title:
									'Științele complexității împreună cu dr. Florin Munteanu: Prezentare proiect tehnologie inovativă. Pregătirea pentru desfășurarea părții experimentale, definirea protocolului experimental, cunoașterea echipamentelor, formarea atelierelor.'
							},
							{ title: 'Armonie interioară și relațională împreună cu Cristina Dinu-Popa: Workshop dezvoltare personală prin experiență și mișcare.' },
							{ title: 'Armonie interioară și relațională împreună cu Cristina Dinu-Popa: Workshop dezvoltare personală. Integrarea experienței.' },
							{
								title:
									'Omul și relația dintre generații. Oportunități și provocări în educația adultului de mâine, împreună cu Diana Antoci.'
							},
							{
								title:
									'Cultivarea și educarea dăruirii împreună cu Diana Antoci: Cunoaște-mă, înțelege-mă, simte-mă, inspiră-mă – copilul gifted și particularitățile lui.'
							},
							{
								title:
									'Cultivarea și educarea dăruirii împreună cu Diana Antoci: Capacitățile și darurile – doar potențiale. Cultivarea și educarea dăruirii. Oportunități și provocări în valorificarea dăruirii.'
							},
							{
								title:
									'Cultivarea și educarea dăruirii împreună cu Diana Antoci: Teoria lui Dabrowski. Importanța moralei și eticii pentru educația abilităților înalte la copii.'
							},
							{
								title:
									'Cultivarea și educarea dăruirii împreună cu Diana Antoci: Rolul părintelui și importanța modelului uman. Întrebări și răspunsuri.'
							},
							{ title: 'Explorarea universului interior prin artă, împreună cu Andrei Stan.' },
							{ title: 'Atenție și creativitate împreună cu Andrei Stan.' },
							{ title: 'Inovația – cheia împlinirii copiilor împreună cu Dumitru Bădilă.' }
						]
					},
					{
						title: 'Copiii și Părinții',
						areas: [
							{ title: 'Armonie relațională în familie, Atelierul lui Împreună, împreună cu Cristina Dinu-Popa.' },
							{
								title:
									'Prezentare proiect tehnologie inovativă, împreună cu dr. Florin Munteanu: Colectarea și centralizarea datelor obținute prin măsurători preliminare, realizate cu copiii în zilele anterioare; Desfășurarea experimentului „obiectivarea rezistenței la efort prin măsurarea tonusului muscular”; Analiză întregii baze de date și pregătirea posterului final.'
							},
							{ title: 'Prezentare proiect tehnologie inovativă, împreună cu dr. Florin Munteanu: Prezentarea rezultatelor în cadrul unei „mini sesiuni științifice”.' },
							{ title: 'Atenție și creativitate, împreună cu Andrei Stan.' },
							{ title: 'Drumeție în Parcul Național Bucegi.' },
							{ title: 'Carnaval.' },
							{ title: 'Foc de tabără.' },
							{ title: 'Festivitate încheiere. Mesaj copil-părinte-mentor.' }
						]
					}
				],
				areas: [
					{ title: 'Copiii: Științele complexității cu dr. Florin Munteanu – derulare proiect Tehnologie inovativă.' },
					{ title: 'Copiii: Fizică experimentală cu Dumitru Bădilă.' },
					{ title: 'Copiii: Biologie experimentală cu Andreea Drăghici.' },
					{ title: 'Copiii: Anatomia corpului uman cu Andreea Drăghici.' },
					{ title: 'Copiii: Cunoaștere de sine cu Cristina Dinu-Popa (Creație de detensionare, povești și boardgames).' },
					{ title: 'Copiii: Atenție și creativitate cu Andrei Stan.' },
					{ title: 'Părinții: Științele complexității cu dr. Florin Munteanu – proiect tehnologie inovativă, protocol experimental, STEM/STEAM, Programul NEXUS-Kogaion.' },
					{ title: 'Părinții: Armonie interioară și relațională cu Cristina Dinu-Popa – workshop dezvoltare personală prin experiență și mișcare + integrarea experienței.' },
					{ title: 'Părinții: Omul și relația dintre generații. Oportunități și provocări în educația adultului de mâine, cu Diana Antoci.' },
					{ title: 'Părinții: Cultivarea și educarea dăruirii cu Diana Antoci – copilul gifted, Dabrowski, etică, rolul modelului uman.' },
					{ title: 'Părinții: Explorarea universului interior prin artă cu Andrei Stan.' },
					{ title: 'Părinții: Atenție și creativitate cu Andrei Stan.' },
					{ title: 'Părinții: Inovația – cheia împlinirii copiilor cu Dumitru Bădilă.' },
					{ title: 'Copiii și părinții: Armonie relațională în familie, Atelierul lui Împreună, cu Cristina Dinu-Popa.' },
					{ title: 'Copiii și părinții: Prezentare proiect tehnologie inovativă cu dr. Florin Munteanu (colectare/centralizare date, experiment, analiză, poster, mini sesiune științifică).' },
					{ title: 'Copiii și părinții: Atenție și creativitate cu Andrei Stan.' },
					{ title: 'Copiii și părinții: Drumeție în Parcul Național Bucegi.' },
					{ title: 'Copiii și părinții: Carnaval.' },
					{ title: 'Copiii și părinții: Foc de tabără.' },
					{ title: 'Copiii și părinții: Festivitate încheiere. Mesaj copil-părinte-mentor.' }
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
				images: galleryImageUrls.map((url, idx) => ({ url, alt: `Galerie Gifted Family ${idx + 1}` }))
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
					'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2799.4806759400667!2d25.338378376980906!3d45.439969071073676!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b3399ce553a2e1%3A0xae96c5429b8eb81e!2sPensiunea%20Nicoleta%20-%20Moieciu%20de%20Sus!5e0!3m2!1sen!2sro!4v1773683990236!5m2!1sen!2sro'
			}
		},
		{
			section: 'enrollment',
			sortOrder: 10,
			payload: {
				title: 'Înscriere',
				intro: 'Înscrierea în tabăra Kogaion Gifted Family presupune o primă discuție cu reprezentanții Kogaion, pentru stabilirea împreună a măsurii în care tabăra este potrivită nevoilor familiei dvs. și pentru ghidarea către programul educațional care se potrivește cel mai bine familiei sau copilului dvs.',
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
	await ensureMissingMentors(db);

	await db
		.update(programLocale)
		.set({
			title: 'Kogaion Gifted Family',
			ageRange: 'copii gifted 7-12 ani și părinți',
			datesText: '29 august – 4 septembrie 2026, 7 zile, Moieciu de Sus',
			durationText: '7 zile',
			locationText: 'Moieciu de Sus'
		})
		.where(and(eq(programLocale.programId, programId), eq(programLocale.locale, 'ro')));

	await db
		.update(programLocale)
		.set({
			title: 'Kogaion Gifted Family',
			ageRange: 'gifted children 7-12 years and parents',
			datesText: '29 August – 4 September 2026, 7 days, Moieciu de Sus',
			durationText: '7 days',
			locationText: 'Moieciu de Sus'
		})
		.where(and(eq(programLocale.programId, programId), eq(programLocale.locale, 'en')));

	let coverImageUrl: string | null = null;
	{
		const name = 'kogaion-gifted-family-cover.webp';
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
		const name = `kogaion-gifted-family-gallery-${String(i + 1).padStart(2, '0')}.webp`;
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(url, localPath);
			galleryImageUrls.push(`${LOCAL_BASE}/${name}`);
			console.log('  Gallery', name);
		} catch (e) {
			console.warn('  Skip gallery', name, e);
		}
	}

	let introImage: string | null = null;
	{
		const name = 'kogaion-gifted-family-intro-main.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(INTRO_IMAGE_URL, localPath);
			introImage = `${LOCAL_BASE}/${name}`;
			console.log('  Intro image', name);
		} catch (e) {
			console.warn('  Skip intro image', e);
		}
	}

	let benefitsMainImage: string | null = null;
	{
		const name = 'kogaion-gifted-family-benefits-main.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(BENEFITS_MAIN_IMAGE_URL, localPath);
			benefitsMainImage = `${LOCAL_BASE}/${name}`;
			console.log('  Benefits main', name);
		} catch (e) {
			console.warn('  Skip benefits image', e);
		}
	}

	let locationImage: string | null = null;
	{
		const name = 'kogaion-gifted-family-location-main.webp';
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
		const name = `kogaion-gifted-family-location-grid-${String(i + 1).padStart(2, '0')}.webp`;
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
