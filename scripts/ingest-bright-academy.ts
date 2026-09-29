/**
 * Ingest content and assets for the kogaion-bright-academy program.
 * - Inserts program_section rows (RO) with full content from kogaionacademy.ro.
 * - Downloads gallery/location assets to static/media/uploads/programe/kogaion-bright-academy/
 * - Links mentors for this program.
 *
 * IMPORTANT / LEGACY SOURCE:
 * There is NO umbrella page at https://kogaionacademy.ro/programe/kogaion-bright-academy/
 * (it returns HTTP 404) and the programme is not listed on /programe/.
 * The programme exists on the live site only as 10 per-week child pages, one for each
 * intelligence explored, all of them legacy (2025 season, last modified 2025-03-24):
 *   https://kogaionacademy.ro/programe/kogaion-bright-academy/<slug>/
 * Every string below is copied verbatim from one of those 10 pages. They have no
 * "Beneficii", no "Transport", no "Meniu" and no "Înscriere" block, so those sections
 * are intentionally not emitted. Those pages also list no mentors.
 *
 * Run: bun run scripts/ingest-bright-academy.ts
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

const PROGRAM_SLUG = 'kogaion-bright-academy';
const UPLOAD_DIR = join(
	process.cwd(),
	'static',
	'media',
	'uploads',
	'programe',
	'kogaion-bright-academy'
);
const LOCAL_BASE = '/media/uploads/programe/kogaion-bright-academy';

/**
 * The 10 Bright Academy pages list no mentors at all, so no mentor row is linked.
 * (Do not add slugs here without a mentor name that appears on one of the 10 pages.)
 */
const MENTOR_SLUGS: string[] = [];

/** Content images used on the 10 weekly pages, in chronological week order. */
const GALLERY_IMAGE_URLS: string[] = [
	// 23–27 iunie 2025 · Inteligența Verbal-Lingvistică
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/DSC05728.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/Elemente-2-scaled.jpg',
	// 30 iunie – 4 iulie 2025 · Inteligența Tehnologică
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/IMG_1505-1-scaled.jpg',
	// 7–11 iulie 2025 · Inteligența Logico-Matematică (page has no content image)
	// 14–18 iulie 2025 · Inteligența Muzical-Ritmică
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/DCL2322-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/1.jpg',
	// 21–25 iulie 2025 · Inteligența Vizual-Spațială
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/IMG_1394-2-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/inflatable-solar-system_58_26-a01.jpg',
	// 28 iulie – 1 august 2025 · Inteligența Intrapersonală
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/IMG-20220901-WA0027.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/life-learning-academy.jpg',
	// 4–8 august 2025 · Inteligența Corporal-Kinestezică
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/IMG_3531-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/IMG_5677-scaled.jpg',
	// 11–15 august 2025 · Inteligența Interpersonală
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/IMG-20190516-WA0047.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/DSC_0627-scaled.jpg',
	// 18–22 august 2025 · Inteligența Științifică
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/WhatsApp-Image-2024-02-13-at-19.21.45-1.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/IMG_5943-scaled.jpg',
	// 25–29 august 2025 · Inteligența Naturalistă
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/IMG_0149-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2024/06/IMG_0252-scaled.jpg'
];

/** Main location image, identical on all 10 pages (Centrul de enrichment, București). */
const LOCATION_IMAGE_URL =
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/RDCL5971-scaled.jpg';

async function downloadAndConvertToWebp(url: string, localPath: string): Promise<void> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
	const buf = await res.arrayBuffer();
	await sharp(Buffer.from(buf)).webp({ quality: 84 }).toFile(localPath);
}

function buildSectionPayloads(
	galleryImageUrls: string[],
	locationImage: string | null
): Array<{ section: string; sortOrder: number; payload: Record<string, unknown> }> {
	return [
		{
			section: 'hero_highlights',
			sortOrder: 0,
			payload: {
				items: [
					'Inteligența Verbal-Lingvistică',
					'Inteligența Tehnologică',
					'Inteligența Logico-Matematică',
					'Inteligența Muzical-Ritmică',
					'Inteligența Vizual-Spațială',
					'Inteligența Intrapersonală',
					'Inteligența Corporal-Kinestezică',
					'Inteligența Interpersonală',
					'Inteligența Științifică',
					'Inteligența Naturalistă'
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
						title: 'copii 7-12 ani',
						body: 'București, Centrul de enrichment Kogaion Gifted Academy\n9:00 – 18:00; copiii pot fi aduși începând cu ora 8.30'
					},
					{
						title: 'Călătorie în lumea poveștilor',
						body: 'Descoperim ce este inteligența lingvistică, de ce este important să ne dezvoltăm acest tip de inteligență, scriem scenariul unei povești pornind de la metafora foii albe, suntem personaje într-o lume de poveste, ne jucăm cu cuvintele, aflăm noi sensuri și înțelesuri, învățăm să ne documentăm, să ne exprimăm clar, liber și coerent.'
					},
					{
						title: 'Călătorie în lumea Artificial Intelligence (AI)',
						body: 'Descoperim ce este inteligența tehnologică, de ce este important să ne dezvoltăm acest tip de inteligență, descoperim că Omul a simplificat muncile repetitive și a creat roboți și Inteligența artificială, descoperim care sunt limite actuale și cum ar putea arăta o lume a viitorului, construim roboți din Lego și învătăm să îi comandăm, facem corelații între natură – Om – AI, învățăm algoritmi logici și facem operații matematice simple și complexe, învățăm cum și de ce să ne îmbunătățim inteligența tehnologică.'
					},
					{
						title: 'Călătorie în lumea cifrelor',
						body: 'Descoperim ce este Inteligența logico-matematică, de ce este important să ne dezvoltăm acest tip de inteligență, descoperim că universul este fractal, descoperim cauzalitatea fenomenelor, facem corelații între matematică și natură, descoperim simbolistica cifrelor, ne jucăm cu cifrele, învățăm cum și de ce să ne îmbunătățim inteligența logico-matematică.'
					},
					{
						title: 'Călătorie în lumea sunetului',
						body: 'Descoperim ce este Inteligența Muzical-Ritmică, de ce este important să ne dezvoltăm acest tip de inteligență, descoperim instrumente muzicale din diverse culturi, ne descoperim vocea, învățăm despre muzica naturii, a plantelor, animalelor și astrelor, despre limbaje de comunicare prin muzică, învățăm ce sunt vibrațiile, tonurile și undele, creăm o melodie orchestrală și o înregistrăm pe suport video, învățăm cum și de ce să ne îmbunătățim Inteligența Muzical-Ritmică, învățăm despre compozitori care au schimbat lumea.'
					},
					{
						title: 'Călătorie în spațiul multidimensional',
						body: 'Descoperim ce este Inteligența Vizual-Spațială, de ce este important să ne dezvoltăm acest tip de inteligență, descoperim scala universului cunoscut, învățăm despre punct, linie și formă, spațiu tridimensional și multidimensional, construim solidele platonice, învățăm cum și de ce să ne îmbunătățim Inteligența Vizual-Spațială și despre oameni care posedă acest tip de inteligență și care au schimbat lumea.'
					},
					{
						title: 'Călătorie în lumea mea interioară',
						body: 'Descoperim ce este Inteligența Intrapersonală, de ce este important să ne dezvoltăm acest tip de inteligență, descoperim cine suntem din mai multe perspective, esențiale pentru clădirea unei personalități armonioase: Corp – Relații – Familie – Emoții – Conștiință – Timp – Spațiu – Încredere în Sine – Stimă de sine. Învățăm cum și de ce să ne îmbunătățim Inteligența Intrapersonală și despre oameni care posedă acest tip de inteligență și care au schimbat lumea.'
					},
					{
						title: 'Călătorie în lumea mișcării corpului',
						body: 'Descoperim ce este Inteligența Corporal-Kinestezică, de ce este important să ne dezvoltăm acest tip de inteligență, ne testăm limitele propriului corp și a puterii psichicului, învățăm despre micorbiom și cine este de fapt organul cu care noi vedem, învățăm despre corelațiile dintre mișcarea corpului, adevăr și minciună, învățăm cum și de ce să ne îmbunătățim Inteligența Corporal-Kinestezică și despre oameni care posedă acest tip de inteligență și care au schimbat lumea.'
					},
					{
						title: 'Călătorie în lumea colaborării',
						body: 'Descoperim ce este Inteligența Interpersonală, de ce este important să ne dezvoltăm acest tip de inteligență, descoperim importanța colaborării în viața noastră cu exemple din natură, învățăm despre limite în relații și ce înseamnă să ne construim relații sănătoase cu cei din jur, învățăm despre alte tipuri de comunicare și limbaje din natură, cum și de ce să ne îmbunătățim Inteligența Interpersonală, despre oameni care posedă acest tip de inteligență și care au schimbat lumea.'
					},
					{
						title: 'Călătorie în lumea energiei',
						body: 'Descoperim ce este Inteligența Științifică, de ce este important să ne dezvoltăm acest tip de inteligență, descoperim diverse tipuri de energie, facem corelații între energia din natură și energia omului, descoperim cauzalitatea fenomenelor și legilor universului, ce este dincolo de realitatea perceptibilă prin simțurile noastre, facem experimente de fizică, învățăm cum și de ce să ne îmbunătățim Inteligența Științifică, despre oameni care posedă acest tip de inteligență și care au schimbat lumea.'
					},
					{
						title: 'Călătorie în lumea naturii',
						body: 'Descoperim ce este Inteligența Naturalistă, de ce este important să ne dezvoltăm acest tip de inteligență, descoperim elementele primordiale ale vieții și ne înțelegem emoțiile și acțiunile în corelație cu acestea, învățăm despre diversele forme de viață pe Pământ și în univers, scalăm lumea de la microcosmos la macrocosmos, învățăm cum și de ce să ne îmbunătățim Inteligența Naturalistă, despre oameni care posedă acest tip de inteligență și care au schimbat lumea.'
					}
				]
			}
		},
		{
			section: 'curriculum_areas',
			sortOrder: 3,
			payload: {
				title: 'Activități',
				areas: [],
				groups: [
					{
						title: 'Inteligența Verbal-Lingvistică — 23–27 iunie 2025',
						areas: [
							{
								title:
									'Proiect transdisciplinar: Poveste creativă înregistrată de copii pe un CD audio'
							},
							{
								title:
									'Obiectiv cultural vizitat: Biblioteca Națională, Filiala pentru copii și tineret'
							},
							{
								title:
									'Teme de discuție: Ce este inteligența? Care sunt caracteristicile oamenilor inteligenți? Care sunt tipurile de inteligență?'
							},
							{
								title:
									'Cine sunt eu? – Descoperim punctele tari și punctele slabe, direcțiile de dezvoltare'
							},
							{ title: 'Ne îmbogățim vocabularul: realizăm Harta mentală a „Cuvântului"' },
							{ title: 'Scriem Jurnal de călătorie în lumea cuvântului' },
							{
								title:
									'Învățăm ce este Inteligența Verbală-Lingvistică și care sunt caracteristicile celor ce o posedă'
							},
							{ title: 'Citim și scriem poezii, povești, snoave, proverbe, zicători, aforisme' },
							{ title: 'Ne jucăm cu cuvintele: sensuri și înțelesuri' },
							{
								title:
									'Realizăm Harta meseriilor prezente și viitoare legate de inteligența verbal-lingvistică'
							},
							{ title: 'Ne jucăm: Scrabble, Dixit, Cuvinte încrucișate' },
							{
								title:
									'Creăm o poveste și o înregistrăm audio – suntem personaje într-o lume de poveste'
							},
							{ title: 'Învățăm să ne documentăm: cărți, hărți, video' },
							{ title: 'Descoperim oameni de seamă pentru inteligența verbal-lingvistică' },
							{ title: 'Descoperim cum ne îmbunătățim inteligența Verbal-Lingvistică?' },
							{ title: 'Ne conectăm în natură, în parcul Herăstrău' }
						]
					},
					{
						title: 'Inteligența Tehnologică — 30 iunie – 4 iulie 2025',
						areas: [
							{ title: 'Proiect transdisciplinar: Lumea văzută prin ochii roboților' },
							{
								title:
									'Obiectiv cultural vizitat: Facultatea de Inginerie Mecanică și Mecatronică, Universitatea Politehnică București'
							},
							{
								title:
									'Ce este inteligența? Care sunt caracteristicile oamenilor inteligenți? Există inteligență artificială?'
							},
							{ title: 'Care sunt tipurile de inteligență?' },
							{
								title:
									'Cine sunt eu? – Descoperim punctele tari și punctele slabe, direcțiile de dezvoltare'
							},
							{ title: 'ne îmbogățim vocabularul: realizăm Harta mentală a „AI"' },
							{ title: 'scriem Jurnal de călătorie în lumea AI' },
							{
								title:
									'învățăm ce este Inteligența tehnologică și care sunt caracteristicile celor ce o posedă'
							},
							{ title: 'creăm roboți și învățăm să îi programăm' },
							{ title: 'învățăm algoritmi logici și facem operații matematice simple și complexe' },
							{
								title:
									'realizăm Harta meseriilor prezente și viitoare legate de inteligența tehnologică'
							},
							{ title: 'facem corelații între OM și Robot' },
							{
								title:
									'jocuri: 2D, 3D, puzzle, construcții, lego; învățăm să ne documentăm: cărți, hărți, video'
							},
							{ title: 'oameni de seamă pentru inteligența tehnologică' },
							{ title: 'cum ne îmbunătățim inteligența tehnologică?' },
							{ title: 'relaxare în natură, în parcul Herăstrău' }
						]
					},
					{
						title: 'Inteligența Logico-Matematică — 7–11 iulie 2025',
						areas: [
							{ title: 'Proiect transdisciplinar: Harta înțelesurilor numerelor' },
							{ title: 'Obiectiv cultural vizitat: Casa experimentelor' },
							{
								title:
									'Ce este inteligența? Care sunt caracteristicile oamenilor inteligenți? Care sunt tipurile de inteligență?'
							},
							{
								title:
									'Cine sunt eu? – Descoperim punctele tari și punctele slabe, direcțiile de dezvoltare'
							},
							{ title: 'ne îmbogățim vocabularul: realizăm Harta mentală a „Numărului"' },
							{ title: 'scriem Jurnal de călătorie în lumea cifrelor' },
							{
								title:
									'învățăm ce este Inteligența Logico-Matematică și care sunt caracteristicile celor ce o posedă'
							},
							{
								title:
									'rezolvăm probleme de logică și perspicacitate la un nivel avansat; învățăm despre logica triangulară (F. Colceag)'
							},
							{ title: 'ne jucăm cu numerele folosind operații matematice simple și complexe' },
							{ title: 'învățăm unitățile de măsură; facem măsurători' },
							{
								title:
									'realizăm Harta meseriilor prezente și viitoare legate de inteligența logico-matematică'
							},
							{
								title:
									'facem corelații între matematică și natură; universul este fractal – creăm povestea universului nostru; șirul lui Fibonacci; raportul de aur; mulțimea lui Mandelbrot; scala Universului cunoscut (-∞;0;+∞);'
							},
							{
								title:
									'corelații între matematică și natură: experimente de electricitate, legea lui Arhimede, principiul acțiunii și reacțiunii, frecvența sunetelor, conductori, electroliza apei, presiunea atmosferică, greutate, principiul electromagnetului, conductori, circuite în serie și în paralel – colaborare cu „Casa experimentelor"'
							},
							{
								title:
									'jocuri: 2D, 3D, puzzle, construcții, lego; învățăm să ne documentăm: cărți, hărți, video'
							},
							{ title: 'oameni de seamă pentru inteligența logico-matematică' },
							{ title: 'cum ne îmbunătățim inteligența Logico-Matematică?' },
							{ title: 'relaxare în natură, în parcul Herăstrău' }
						]
					},
					{
						title: 'Inteligența Muzical-Ritmică — 14–18 iulie 2025',
						areas: [
							{
								title: 'Proiect transdisciplinar: Orchestra copiilor înregistrată pe suport video'
							},
							{ title: 'Obiectiv cultural vizitat: Opera comică pentru copii sau similar' },
							{
								title:
									'Ce este inteligența? Care sunt caracteristicile oamenilor inteligenți? Care sunt tipurile de inteligență?'
							},
							{
								title:
									'Cine sunt eu? – Descoperim punctele tari și punctele slabe, direcțiile de dezvoltare'
							},
							{ title: 'ne îmbogățim vocabularul: realizăm Harta mentală a „Sunetului"' },
							{ title: 'scriem Jurnal de călătorie în lumea sunetului' },
							{
								title:
									'învățăm ce este Inteligența Muzicală-Ritmică și care sunt caracteristicile celor ce o posedă'
							},
							{
								title:
									'descoperim și experimentăm pianul, vioara, chitara, orga, tobele, instrumente muzicale de percuție diverse'
							},
							{ title: 'ne descoperim vocea' },
							{ title: 'învățăm să recunoaștem ritmuri, tonuri și vibrații' },
							{ title: 'muzica astrelor – universul pulsatoriu; muzica plantelor, a animalelor' },
							{ title: 'ascultăm sunetul : sensuri și înțelesuri' },
							{
								title:
									'realizăm Harta meseriilor prezente și viitoare legate de inteligența muzicală-ritmică'
							},
							{
								title:
									'improvizăm muzical: creăm o melodie orchestrală și o înregistrăm pe suport video'
							},
							{ title: 'confecționăm obiecte muzicale' },
							{ title: 'învățăm să ne documentăm: cărți, hărți, video' },
							{
								title:
									'oameni de seamă pentru inteligența muzicală-ritmică: compozitor – compoziție – instrument'
							},
							{ title: 'cum ne îmbunătățim inteligența Muzical-Ritmică?' },
							{ title: 'relaxare în natură, în parcul Herăstrău' }
						]
					},
					{
						title: 'Inteligența Vizual-Spațială — 21–25 iulie 2025',
						areas: [
							{ title: 'Proiect transdisciplinar: Harta universului cunoscut' },
							{ title: 'Obiectiv cultural vizitat: Observatorul astronomic' },
							{
								title:
									'Ce este inteligența? Care sunt caracteristicile oamenilor inteligenți? Care sunt tipurile de inteligență?'
							},
							{
								title:
									'Cine sunt eu? – Descoperim punctele tari și punctele slabe, direcțiile de dezvoltare'
							},
							{ title: 'ne îmbogățim vocabularul: realizăm Harta mentală a „Spațiului"' },
							{
								title:
									'scriem Jurnal de călătorie în lumea spațiului; scala Universului cunoscut (-∞;0;+∞); de la Microcosmos la Macrocosmos'
							},
							{
								title:
									'învățăm ce este Inteligența Vizual-Spațială și care sunt caracteristicile celor ce o posedă'
							},
							{
								title:
									'învățăm despre punct, linie, formă, spațiu tridimensional și multidimensional'
							},
							{ title: 'învățăm despre imagine, formă, culoare' },
							{ title: 'învățăm să ne orientăm în spațiu' },
							{
								title:
									'desenăm și construim solidele platonice și realizăm corelații cu materia vieții'
							},
							{
								title:
									'realizăm Harta meseriilor prezente și viitoare legate de inteligența vizual-spațială'
							},
							{ title: 'jocuri: puzzle, labirinturi, jocuri de imaginație' },
							{ title: 'învățăm să ne documentăm: cărți, hărți, video' },
							{ title: 'oameni de seamă pentru inteligența vizual-spațială' },
							{ title: 'cum ne îmbunătățim inteligența Vizual-Spațială?' },
							{ title: 'relaxare în natură, în parcul Herăstrău' }
						]
					},
					{
						title: 'Inteligența Intrapersonală — 28 iulie – 1 august 2025',
						areas: [
							{ title: 'Proiect transdisciplinar: Cine sunt eu?' },
							{ title: 'Obiective culturale vizitate: Castel Film Studios și Palatul Snagov' },
							{
								title:
									'Ce este inteligența? Care sunt caracteristicile oamenilor inteligenți? Care sunt tipurile de inteligență?'
							},
							{
								title:
									'Cine sunt eu? – Descoperim punctele tari și punctele slabe, direcțiile de dezvoltare; Identitatea națională.'
							},
							{ title: 'ne îmbogățim vocabularul: realizăm Harta mentală a „Sinelui"' },
							{ title: 'scriem Jurnal de călătorie în lumea Sinelui' },
							{
								title:
									'învățăm ce este Inteligența Intrapersonală și care sunt caracteristicile celor ce o posedă'
							},
							{ title: 'Cine sunt eu? Corp – Minte – Suflet – Spirit' },
							{ title: 'Cine sunt eu? Gând – Cuvânt – Faptă. Mesaje transmise celorlalți' },
							{ title: 'Cine sunt eu? Eu, familia mea, familia extinsă' },
							{
								title:
									'Cine sunt eu? – Harta conștiinței umane, David R. Hawkins – conștientizăm propriile emoții: de la rușine, vină și frică ca emoții negative la curaj, iubire, pace ca emoții pozitive. Cum măsurăm emoțiile?'
							},
							{
								title:
									'Cine sunt eu? – Spațiul și timpul personal. Managementul timpului și al spațiului'
							},
							{ title: 'Cine sunt eu? – Încrederea în Sine și Stima de Sine' },
							{
								title:
									'realizăm Harta meseriilor prezente și viitoare legate de inteligența Intrapersonală'
							},
							{ title: 'jocuri individuale și de echipă' },
							{ title: 'învățăm să ne documentăm: cărți, hărți, video' },
							{ title: 'oameni de seamă pentru inteligența Intrapersonală' },
							{ title: 'cum ne îmbunătățim inteligența Intrapersonală?' },
							{ title: 'relaxare în natură, în parcul Herăstrău' }
						]
					},
					{
						title: 'Inteligența Corporal-Kinestezică — 4–8 august 2025',
						areas: [
							{ title: 'Proiect transdisciplinar: Pentatlon Kogaion' },
							{ title: 'Obiective sportive vizitate: Club de atletism, Club de gimnastică' },
							{
								title:
									'Ce este inteligența? Care sunt caracteristicile oamenilor inteligenți? Care sunt tipurile de inteligență?'
							},
							{ title: 'ne îmbogățim vocabularul: realizăm Harta mentală a „Mișcării"' },
							{
								title:
									'Cine sunt eu? – Descoperim punctele tari și punctele slabe, direcțiile de dezvoltare'
							},
							{
								title:
									'învățăm ce este Inteligența Corporal-Kinestezică și care sunt caracteristicile celor ce o posedă; cum ne îmbunătățim inteligența Corporal-Kinestezică?'
							},
							{ title: 'învățăm despre fiziologia corpului uman' },
							{ title: 'lumea vie din corpul uman: microbiomul. Inteligență sau întâmplare?' },
							{
								title:
									'vedem cu ochii sau cu creierul? Creier – Informație – Organ de simț – Senzație'
							},
							{
								title:
									'de ce se mișcă corpul? corelații între creier și mușchi; căi ascendente și descendente'
							},
							{
								title:
									'corelații între mișcarea corpului, adevăr și minciună – Harta conștiinței umane, David R. Hawkins'
							},
							{
								title:
									'experimentăm mișcarea corpului fizic; coordonarea, echilibrul, dexteritatea, forța, flexibilitatea, viteza'
							},
							{ title: 'limbajul nonverbal și paraverbal al corpului' },
							{ title: 'scriem Jurnal de călătorie în lumea mișcării corpului' },
							{
								title:
									'realizăm Harta meseriilor prezente și viitoare legate de inteligența corporal-kinestezică'
							},
							{ title: 'jocuri: de mișcare specifice, care activează anumite părți ale corpului' },
							{ title: 'învățăm să ne documentăm: cărți, hărți, video' },
							{ title: 'oameni de seamă pentru inteligența corporal-kinestezică' },
							{ title: 'relaxare în natură, în parcul Herăstrău' }
						]
					},
					{
						title: 'Inteligența Interpersonală — 11–15 august 2025',
						areas: [
							{
								title:
									'Proiect transdisciplinar: Poluarea pe Terra. Albinele pe cale de dispariție? Dar omul? – dezbatere; problem solving'
							},
							{ title: 'Obiective culturale vizitate: Teatrul Ion Creangă' },
							{
								title:
									'Ce este inteligența? Care sunt caracteristicile oamenilor inteligenți? Care sunt tipurile de inteligență?'
							},
							{
								title:
									'Cine sunt eu? – Descoperim punctele tari și punctele slabe, direcțiile de dezvoltare'
							},
							{ title: 'ne îmbogățim vocabularul: realizăm Harta mentală a „Colaborării"' },
							{ title: 'scriem Jurnal de călătorie în lumea colaborării' },
							{
								title:
									'învățăm ce este Inteligența Interpersonală și care sunt caracteristicile celor ce o posedă'
							},
							{
								title:
									'învățăm despre colaborare, lucrul în echipă, proiecte și discuții de grup, cărți și materiale multiculturale, jocuri de rol'
							},
							{ title: 'de ce să colaborăm unii cu alții? de ce omul este o ființa socială?' },
							{ title: 'învățăm despre limbajul nonverbal și paraverbal al corpului' },
							{
								title:
									'realizăm Harta meseriilor prezente și viitoare legate de inteligența Interpersonală'
							},
							{ title: 'jocuri de echipă' },
							{ title: 'învățăm să ne documentăm: cărți, hărți, video' },
							{
								title:
									'oameni de seamă pentru inteligența Interpersonală: personalități remarcante care au salvat lumea'
							},
							{ title: 'cum ne îmbunătățim inteligența Interpersonală?' },
							{ title: 'relaxare în natură, în parcul Herăstrău' }
						]
					},
					{
						title: 'Inteligența Științifică — 18–22 august 2025',
						areas: [
							{ title: 'Proiect transdisciplinar: Harta înțelesurilor energiei' },
							{ title: 'Obiectiv cultural vizitat: Muzeul Național Tehnic Dimitrie Leonida' },
							{
								title:
									'Ce este inteligența? Care sunt caracteristicile oamenilor inteligenți? Care sunt tipurile de inteligență?'
							},
							{
								title:
									'Cine sunt eu? – Descoperim punctele tari și punctele slabe, direcțiile de dezvoltare'
							},
							{ title: 'ne îmbogățim vocabularul: realizăm Harta mentală a „Energiei"' },
							{ title: 'scriem Jurnal de călătorie în lumea energiei' },
							{
								title:
									'învățăm ce este Inteligența Științifică și care sunt caracteristicile celor ce o posedă'
							},
							{
								title:
									'realizăm Harta meseriilor prezente și viitoare legate de inteligența științifică'
							},
							{ title: 'facem corelații între energia omului și energia regăsită în natură;' },
							{
								title:
									'facem experimente de fizică: electricitate, legea lui Arhimede, principiul acțiunii și reacțiunii, frecvența sunetelor, conductori, electroliza apei, presiunea atmosferică, greutate, principiul electromagnetului, conductori, circuite în serie și în paralel – colaborare cu „Casa experimentelor"'
							},
							{
								title:
									'jocuri: 2D, 3D, puzzle, construcții, lego; învățăm să ne documentăm: cărți, hărți, video'
							},
							{ title: 'oameni de seamă pentru inteligența științifică' },
							{ title: 'cum ne îmbunătățim inteligența științifică?' },
							{ title: 'relaxare în natură, în parcul Herăstrău' }
						]
					},
					{
						title: 'Inteligența Naturalistă — 25–29 august 2025',
						areas: [
							{
								title:
									'Proiect transdisciplinar: Universul scalabil: de la Microcosmos la Macrocosmos'
							},
							{ title: 'Obiective culturale vizitate: Parcul Național Văcărești' },
							{
								title:
									'Ce este inteligența? Care sunt caracteristicile oamenilor inteligenți? Care sunt tipurile de inteligență?'
							},
							{
								title:
									'Cine sunt eu? – Descoperim punctele tari și punctele slabe, direcțiile de dezvoltare'
							},
							{
								title:
									'învățăm ce este Inteligența Naturalistă și care sunt caracteristicile celor ce o posedă'
							},
							{ title: 'ne îmbogățim vocabularul: realizăm Harta mentală a „Naturii"' },
							{ title: 'scriem Jurnal de călătorie în lumea Naturii' },
							{
								title:
									'descoperim corelațiile dintre elementele primordiale ale vieții și emoțiile și caracteristicile relevante pentru natura umană'
							},
							{
								title:
									'Viața naște viață – Cum a luat naștere viața pe Pământ? Forme de viață primitive și evoluate: mediul marin, mediul terestru, mediul aerian – Sădim o plantă (fasole și grâu)'
							},
							{ title: 'microcosmos – lumea văzută la lupa și microscop; categorii, clasificări' },
							{ title: 'lumea văzută cu ochiul liber' },
							{
								title:
									'macrocosmos – lumea văzută prin binoclu, telescop și lunetă; categorii, clasificări'
							},
							{ title: 'alcătuirea unui ierbar' },
							{
								title:
									'realizăm Harta meseriilor prezente și viitoare legate de inteligența Naturalistă'
							},
							{ title: 'jocuri individuale și de echipă specifice inteligenței naturaliste' },
							{ title: 'învățăm să ne documentăm: cărți, hărți, video, Enciclopedii' },
							{ title: 'oameni de seamă pentru Inteligența Naturalistă' },
							{ title: 'cum ne îmbunătățim inteligența Naturalistă?' },
							{ title: 'relaxare în natură, în parcul Herăstrău' }
						]
					}
				]
			}
		},
		{
			section: 'gallery',
			sortOrder: 6,
			payload: {
				images: galleryImageUrls.map((url) => ({ url }))
			}
		},
		{
			section: 'location',
			sortOrder: 9,
			payload: {
				eyebrow: 'Locație',
				title: 'Centrul de enrichment Kogaion Gifted Academy, București',
				body: 'Locul de desfășurare a activităților este situat în București, Șoseaua Nordului nr. 94F, Sector 1, într-o zonă liniștită, la numai 150 de metri de Parcul Herăstrău. Imobilul dispune de 11 spații de desfășurare a activităților, spațioase și luminoase, cu o suprafață de 450 mp.',
				image: locationImage ?? undefined
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
		const name = `kogaion-bright-academy-gallery-${String(i + 1).padStart(2, '0')}.webp`;
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
		const name = 'kogaion-bright-academy-location-main.webp';
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadAndConvertToWebp(LOCATION_IMAGE_URL, localPath);
			locationImage = `${LOCAL_BASE}/${name}`;
			console.log('  Location main', name);
		} catch (e) {
			console.warn('  Skip location image', e);
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
	const sections = buildSectionPayloads(galleryImageUrls, locationImage);
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
