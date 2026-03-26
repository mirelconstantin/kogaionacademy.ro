/**
 * Ingest content and assets for the afterschool-kogaion-self-mastery program from the live source page.
 * - Inserts program_section rows (RO) with full content.
 * - Downloads gallery/hero images to static/media/uploads/programe/afterschool-self-mastery/
 * - Links mentors to the program by slug.
 *
 * Run: bun run scripts/ingest-afterschool-program.ts
 * Requires: DATABASE_URL, program and program_section tables (run migrations first).
 */
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { program, programSection, programMentor, mentor } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const PROGRAM_SLUG = 'afterschool-kogaion-self-mastery';
const UPLOAD_DIR = join(process.cwd(), 'static', 'media', 'uploads', 'programe', 'afterschool-self-mastery');

/** Mentor slugs displayed on the source page (order preserved). */
const MENTOR_SLUGS = [
	'diana-antoci',
	'madalina-gavrilescu',
	'rodica-bealcu',
	'iulian-glita',
	'andrei-stan',
	'andreea-draghici',
	'cristina-isabela-beteringhe',
	'florin-stefan',
	'gabriel-esanu',
	'andreea-faur',
	'anca-graur',
	'vladimir-stefanescu',
	'dumitru-badila',
	'nicolae-cruceru',
	'constantin-caprioreanu',
	'christopher-hermann',
	'iarina-radu',
	'flavian-glont',
	'carlos-catana'
];

/** Gallery slideshow image URLs – only images used in the Galerie foto section on the source page. */
const GALLERY_IMAGE_URLS = [
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2069-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG_6633-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/RDCL5631-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/RDCL5656-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/RDCL5690-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/RDCL5757-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/RDCL5775-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/RDCL5803-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/RDCL5871-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/RDCL5928-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/RDCL5971-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/RDCL5983-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/RDCL6001-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG_6483-1-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL1866-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL1892-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL1928-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2018-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2133-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2252-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2272-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2311-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2341-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2393-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2403-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2420-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2469-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2512-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2541-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2554-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2609-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2650-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/01B390FE-9A24-490F-9DA0-2B5E4C69A60E-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/1AF7661A-FA45-42C0-9876-C39338312F65-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/40D42EAF-3B0A-4EDE-9894-4A42507B1981-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/F1C706AF-D473-4990-88C5-C310E35AE8DA-scaled.jpeg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2164-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/DCL2502-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/H1R8478-1-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/K4_4518-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG_3157-1-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG_3269-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG_3344-1-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG_3407-1-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG_3437-1-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2023/02/IMG_3506-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2017/05/IMG_1776_Fotor-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2017/05/IMG_1099_Fotor-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2018/01/Kogaion_Intensive_Mastery_9.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/03/fetita.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/02/20210226_150854-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/02/IMG_0347-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/03/IMG_0357-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/03/20210226_150618-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/03/20210226_150525-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/03/IMG_6978-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/04/2-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/04/DSCN9102-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/04/IMG_0949-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/04/SVK2.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/20210218_162144-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/20210303_175358-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/05/20210303_173944-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/08/IMG_1833-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/08/20210226_150854-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/08/IMG_0941-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/08/IMG_1014-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/08/IMG_1022-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/08/IMG_1186-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/08/IMG_1281-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/08/IMG_1283-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/08/IMG_0085-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/08/IMG_0087-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/08/IMG_0180-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/09/20150216_184413.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/09/1ed94e32-49de-4ec1-8134-5c37c689a133.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/09/IMG_6868-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/09/ksm1-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/09/IMG_4121.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/09/20210218_162206-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/09/IMG_7144-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/09/DSC_0146-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/09/IMG_3774-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/09/IMG_3779-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2021/09/DSC_0150-scaled.jpg',
	'https://kogaionacademy.ro/wp-content/uploads/2017/05/Program-after-school_Kogaion-Gifted-Academy.jpg'
];

async function downloadImage(url: string, localPath: string): Promise<void> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
	const buf = await res.arrayBuffer();
	await writeFile(localPath, Buffer.from(buf));
}

function safeBasename(url: string, index: number): string {
	try {
		const u = new URL(url);
		const name = u.pathname.split('/').pop() ?? `image-${index}`;
		const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '.jpg';
		const base = name.slice(0, name.lastIndexOf('.') || name.length).replace(/\W+/g, '-');
		return `${base}${ext}`;
	} catch {
		return `image-${index}.jpg`;
	}
}

/** Section payloads in display order (source: kogaionacademy.ro program page). */
function buildSectionPayloads(galleryImageUrls: string[]): Array<{ section: string; sortOrder: number; payload: Record<string, unknown> }> {
	return [
		{
			section: 'hero_highlights',
			sortOrder: 0,
			payload: {
				items: [
					'Identificare pasiuni',
					'Curriculum integrat de enrichment',
					'43 de cursuri',
					'Proiecte transdisciplinare',
					'Descoperire prin experiment direct',
					'Metoda socratică',
					'Maximizare potențiale'
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
			sortOrder: 1,
			payload: {
				blocks: [
					{
						body: 'Kogaion Afterschool este locul în care copilul tău: – își descoperă pasiunile, își dezvoltă abilitățile și își maximizează potențialele – își dezvoltă orizontul cunoașterii și explorează multi și transdisciplinar peste 40 de contexte de învățare – se va dezvolta personalizat, ținând cont de individualitatea sa, de caracteristicile etapei de vârstă în care se află – își va dezvolta caracterul și autonomia în învățare.'
					},
					{
						body: 'Căutăm să fim cât mai autentici pentru a fi modele umane pentru copiii și părinții din comunitatea Kogaion. În felul acesta, atragem oameni frumoși, găsim locuri minunate și creăm trăiri profunde. Suntem aproape de tine, de copilul tău și de familia ta în această călătorie prin viață și îți împărtășim din cunoașterea și bucuria noastră de a trăi frumos.'
					},
					{
						body: 'Oferta educațională a programului academic de enrichment Kogaion Afterschool este rezultatul a 13 ani de cercetare în domeniul educației de excelență și cuprinde un cumul de activități structurate în 6 arii curriculare, ce au la bază abordarea psiho-pedagogică inovatoare bazată pe logica triangulară fundamentată de prof. dr. Florian Colceag și abordarea integrativă concepută de dna Diana Antoci.'
					},
					{
						body: 'În anul școlar 2025-2026, copiii vor beneficia de un curriculum integrat complex, format din 43 de cursuri și proiecte de explorare și aprofundare a domeniilor cunoașterii, desfășurate modular sau anual, structurate pe ani de studiu vizând identificarea pasiunilor și dezvoltarea abilităților, precum și pe relație de mentorat, pentru copiii care și-au descoperit deja o pasiune și urmează drumul spre performanță. Dintre acestea, – 23 de cursuri, activități și programe sunt incluse în taxa educațională și – 20 cursuri sunt opționale.'
					}
				]
			}
		},
		{
			section: 'curriculum_areas',
			sortOrder: 2,
			payload: {
				title: 'Urmărim dezvoltarea armonioasă a copiilor prin deschiderea orizontului cunoașterii și aprofundare în 6 arii curriculare:',
				areas: [
					{ title: 'Exploratorium Lingvistică & Comunicare' },
					{ title: 'Exploratorium Matematică, Logică & Intuiție' },
					{ title: 'Exploratorium Arte & Muzică' },
					{ title: 'Exploratorium Științe & Tehnologie' },
					{ title: 'Exploratorium Natură, Mișcare & Cultură' },
					{ title: 'Exploratorium Human Being' }
				]
			}
		},
		{
			section: 'packages',
			sortOrder: 3,
			payload: {
				title: 'Pachete de enrichment oferite în anul școlar 2025-2026:',
				packages: [
					{
						title: 'PACHET ENRICHMENT BASIC – cursuri și activități incluse',
						items: [
							'Suport și clarificare teme',
							'Joacă în natură, în parcul Herestrău',
							'Curs Lingvistică: Poezie; Povești; Snoave, proverbe, zicători, aforisme',
							'Curs Mind-Mapping – 4 proiecte transdisciplinare',
							'Curs Matematică avansată',
							'Curs Logică și perspicacitate',
							'Curs Origami',
							'Curs Arts & Crafts',
							'Curs Arta culinară în lume',
							'Oameni printre oameni – invitați speciali',
							'3 Tabere urbane pe perioada vacanțelor școlare, având ca tematică: "Natură, Lectură, Cultură"',
							'Ședință de feedback cu familia'
						]
					},
					{
						title: 'PACHET ENRICHMENT INTEGRAT – cursuri și activități în plus față de Pachetul Basic',
						items: [
							'Curs Public Speaking',
							'Curs Teatru și Artă dramatică',
							'Curs Pictură',
							'Curs Arhitectură',
							'Curs Geometria naturii în artă',
							'Curs Dezvoltare personală',
							'Curs Inteligență muzicală Cor',
							'Curs Inteligență muzicală Explorare instrumente și cultură muzicală'
						]
					},
					{
						title: 'PACHET ENRICHMENT PREMIUM – cursuri și activități în plus față de Pachetul Integrat',
						items: [
							'Biologie experimentală',
							'Robotică & Electronică',
							'Anatomia corpului uman',
							'Fizică experimentală',
							'Aritmetică mentală japoneză',
							'Șah',
							'Hapkido',
							'Astronomie',
							'Înot',
							'Tenis de câmp',
							'Chitară',
							'Vioară',
							'Pian',
							'Limba Engleză Cambridge',
							'Limba Franceză',
							'Limba Spaniolă',
							'Dans contemporan'
						]
					}
				],
				note: 'La prețul fiecărui pachet se adaugă masa și transportul.'
			}
		},
		{
			section: 'extracurricular',
			sortOrder: 4,
			payload: {
				title: 'În plus, copiii beneficiază de activități specifice legate de curricula școlară si alte activități extracurriculare:',
				groups: [
					{ title: '1. Activități școlare', items: ['teme și alte cerințe școlare'] },
					{
						title: '2. Activități socio-culturale',
						subtitle: 'organizate în vacanțele copiilor',
						items: [
							'vizite la muzee, teatre, cinema, bibliotecă, parcuri sau grădini, centre de cercetare, ateliere meșteșugărești',
							'3 tabere urbane în vacanțele intersemestriale',
							'10 tabere urbane în perioada vacanței școlare de vară, de explorare a inteligențelor multiple, asigurate prin programul Kogaion Bright Academy'
						]
					},
					{
						title: '3. Activitățile comunității Kogaion',
						items: [
							'ședințe săptămânale ale copiilor, serbarea zilelor de naștere, excursii de o zi în natură (picnic, ieșiri cu role, biciclete, trotinete, întreceri sportive, distracție în parcul Herestrău), petreceri de sărbători și tematice, activități de voluntariat (pregatirea mesei, aranjarea și îngrijirea spațiului), plantarea și îngrijirea plantelor, excursii de conectare cu natura, „Ora mea" – momentul magic al săptămânii'
						]
					},
					{
						title: '4. Activități cu familia',
						items: ['workshopuri de parenting, activități copil-părinte']
					},
					{
						title: '5. Feedback personalizat',
						items: [
							'Feedback-ul privind evoluția copilului se asigură zilnic, prin discuție cu învățătoarea sau personalul de specialitate și în cadrul unei întâlniri individuale cu părinții, la finalul anului școlar. La cerere putem asigura stabilirea unui „Traseu personalizat de educație" pentru fiecare copil.'
						]
					}
				],
				methods:
					'Descoperirea prin experiment direct, corelarea cunoștințelor, întrebările relevante, lucrul pe proiecte, problem solving, dezbaterile și interactivitatea sunt metodele de lucru folosite în cadrul afterschool Kogaion.'
			}
		},
		{
			section: 'benefits_family',
			sortOrder: 5,
			payload: {
				title: 'Beneficii pentru familie',
				items: [
					'10% pentru frate/soră, pentru recomandarea altor copii și pentru copiii care au parcurs minim 1 an la Kogaion afterschool',
					'5% pentru plata integrală a taxei educaționale anticipat, în primele 10 zile de la începerea anului școlar',
					'5% la al doilea opțional și 2,5% pentru fiecare nou opțional'
				],
				note: 'Beneficiile pentru programul de afterschool sunt calculate la prețul serviciilor educaționale și se cumulează în limita a maxim 10%.',
				other: 'Alte beneficii pentru copiii înscriși la afterschool Kogaion, precum și pentru părinții lor:',
				otherItems: [
					'10 % la toate taberele urbane de vară, taberele pentru copii și taberele de familie',
					'10 % la toate conferințele de parenting, workshop-urile și proiectele realizate în comunitate'
				]
			}
		},
		{
			section: 'benefits_main',
			sortOrder: 6,
			payload: {
				title: 'Beneficii principale',
				items: [
					'descoperirea unicității copilului prin recuperarea, dezvoltarea și valorificarea abilităților copiilor și a potențialelor proprii',
					'dezvoltarea integrată a inteligenței copilului, având ca punct de plecare dezvoltarea ambelor emisfere cerebrale și a inteligențelor multiple',
					'deschiderea orizontului de cunoaștere și maximizarea potențialelor în multiple contexte de învățare',
					'dezvoltarea motivației',
					'formarea unei personalități armonioase prin dezvoltarea calităților umane, modelarea caracterului și a autonomiei în învățare, prin învățare experiențială, generatoare de creșterea încrederii și a stimei de sine'
				]
			}
		},
		{
			section: 'benefits_secondary',
			sortOrder: 7,
			payload: {
				title: 'Beneficii secundare',
				items: [
					'menținerea unei curiozități vii și dezvoltarea capacitaților psihice care să construiască mecanisme de învățare autentică, ce vor putea fi actualizate pe parcursul întregii vieți',
					'dezvoltarea curajului de auto-expresie prin dezvoltarea gândirii critice și a structurii volitiv-atitudinale a personalității',
					'cultivarea emoționalității și a echilibrului atitudinal',
					'realizarea de noi prietenii cu copii cu aceleași pasiuni'
				]
			}
		},
		{
			section: 'gallery',
			sortOrder: 8,
			payload: {
				title: 'Galerie foto',
				images: galleryImageUrls.map((url, i) => ({ url, alt: `Galerie afterschool ${i + 1}` }))
			}
		},
		{
			section: 'transport',
			sortOrder: 9,
			payload: {
				title: 'Transport',
				body: 'Transportul se poate asigura la cerere, separat de pachetul educațional și se calculează în funcție de numărul de km parcurși de la scoală până la sediul Kogaion Gifted Academy. Opțiunea se face la înscriere. Cererile vor fi discutate individual, în funcție de nevoile fiecărui copil în parte.\n\nPentru școlile aflate în proximitatea sediului nostru, costul transportului este de 500 lei/lună și se achită ca abonament lunar: Liceul Jean Monet, Pia Brătianu, Școala 10 Maria Rosetti, Liceul Alexandru Vlahuță, Școala Waldorf, Școala Herăstrău, Școala nr. 7, Liceul Nicolae Iorga, Școala 45 Titu Maiorescu, Școala 11 Ion Heliade Rădulescu. Dacă este o alta școală, contactează-ne. Prețul abonamentului lunar poate suferi modificări, în funcție de majorarea prețului la furnizori.',
				contact: '0736.770.669 – Iulia'
			}
		},
		{
			section: 'menu',
			sortOrder: 10,
			payload: {
				title: 'Meniu',
				body: 'Prețul mesei în anul școlar 2025-2026 este de 28 lei/zi, include masa de prânz și o gustare și se achită separat de pachetul educațional.\n\nOferim copiilor un meniu sănătos, fără conservanți, coloranți, amelioratori, E-uri și arome identic naturale, prin partenerul nostru, Băcănia Veche. Gustarea este formată din fructe și legume crude, semințe crude, fructe uscate, prăjituri de casă. Prețul se poate modifica pe parcursul anului, în funcție de modificarea prețului la furnizor.',
				note: 'Prețul se poate modifica pe parcursul anului, în funcție de modificarea prețului la furnizor.'
			}
		},
		{
			section: 'location',
			sortOrder: 11,
			payload: {
				title: 'Locație',
				subtitle: 'Centrul de enrichment Kogaion Gifted Academy, București',
				body: 'Locul de desfășurare a activităților este situat în București, Șoseaua Nordului nr. 94F, Sector 1, într-o zonă liniștită, la numai 150 de metri de Parcul Herăstrău. Imobilul dispune de 11 spații de desfășurare a activităților, spațioase și luminoase, desfășurate pe o suprafață de 450 mp, astfel:',
				amenities: [
					'4 Săli de clasă pentru desfășurarea activităților ce țin de curricula școlară',
					'Sală de IT, Electronică și Robotică, dotată cu televizor, 15 seturi de Lego Mindstorms și 17 seturi de Lego Boost, laptopuri și materiale specifice pentru Electronică',
					'Sală de Științe și Arte, dotată cu o tablă inteligentă și material didactic specific pentru cursurile de Fizică, Chimie, Corpul uman, Pictură, Arhitectură, Teatru, Dans',
					'Ludotecă, ce cuprinde peste 400 de volume de cărți și jocuri specifice pentru copii, precum și pian, orgă, chitară, vioară și peste 40 de instrumente muzicale și de percuție',
					'Sală de sport dotată cu saltele și materiale specifice',
					'Sală de servire a mesei'
				],
				closing:
					'Dotările și materialul didactic pus la dispoziție susțin o educație de calitate și o dezvoltare experiențială a fiecărui copil, având ca punct de plecare dezvoltarea creativității.'
			}
		},
		{
			section: 'testimonials',
			sortOrder: 12,
			payload: {
				title: 'Testimoniale',
				items: [
					{ provider: 'vimeo', videoId: '1004150712', title: 'Testimonial Ingrid și Ioana Dragomir' },
					{ provider: 'youtube', videoId: 'Lc_kZUr2HXY', title: 'De ce i-a plăcut lui Cezar la Kogaion?' },
					{ provider: 'youtube', videoId: 'A2HjH8Wj3nQ', title: 'Experiența Anastasiei la Afterschool Kogaion' }
				]
			}
		},
		{
			section: 'enrollment',
			sortOrder: 13,
			payload: {
				title: 'Înscriere',
				intro: 'Înscrierea în Centrul educațional de enrichment Kogaion Gifted Academy constă în:',
				steps: [
					{ order: 1, label: 'stabilirea unei întâlniri de cunoaștere cu familia și copilul' },
					{ order: 2, label: 'completarea formularului de înscriere' },
					{ order: 3, label: 'semnarea contractului de prestări servicii și a documentelor aferente' },
					{ order: 4, label: 'plata taxei de înscriere, în sumă de 600 lei' }
				],
				buttons: [
					{ label: 'Sună', type: 'tel', value: '0720529398' },
					{ label: 'Cere detalii', type: 'link', href: '/contact' },
					{ label: 'Formular de înscriere', type: 'link', href: '/contact' }
				],
				contactNote:
					'Pentru orice alte detalii vă rugăm să apelați nr. de telefon 0720529398 (Diana Antoci) sau să completați formularul de detalii.'
			}
		},
		{
			section: 'video_links',
			sortOrder: 14,
			payload: {
				title: 'YouTube',
				links: [{ label: 'Kogaion Gifted Academy', url: 'https://www.youtube.com/channel/UCoBFhLHz0qA0lFX3P0QOxcA' }]
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

	console.log('Downloading images...');
	const localBase = '/media/uploads/programe/afterschool-self-mastery';
	const galleryImageUrls: string[] = [];
	for (let i = 0; i < IMAGE_URLS.length; i++) {
		const url = IMAGE_URLS[i];
		const name = safeBasename(url, i);
		const localPath = join(UPLOAD_DIR, name);
		try {
			await downloadImage(url, localPath);
			if (isSlideshowImage(url)) {
				galleryImageUrls.push(`${localBase}/${name}`);
			}
			console.log('  ', name);
		} catch (e) {
			console.warn('  Skip', name, e);
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
		}
	}
	console.log('  Linked', linked, 'mentors');

	console.log('Upserting program sections (RO)...');
	await db.delete(programSection).where(eq(programSection.programId, programId));
	const sections = buildSectionPayloads(galleryImageUrls);
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
