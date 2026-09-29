/**
 * Reconcile the `mentor` table with the LIVE production mentors page.
 *
 * Source of truth: https://kogaionacademy.ro/mentori/ (a flat list of 41 cards:
 * portrait + H3 name + H4 role + bio paragraph).
 *
 * This script inserts the mentors that are present on the live site but missing
 * from the DB. It mirrors `ensureMissingMentors()` in scripts/ingest-gifted-family.ts:
 *   - downloads the portrait from wp-content, converts it to .webp via sharp,
 *     and stores it under static/media/uploads/mentori/<slug>.webp
 *   - inserts the row ONLY if the slug is not already present (idempotent)
 *
 * Bios below are copied VERBATIM from the live /mentori/ page (diacritics and
 * punctuation preserved). Nothing here is paraphrased or invented.
 *
 * sortOrder: the existing seed (scripts/mentors-seed-data.ts) already occupies
 * 1..33, and the two ingest-inserted rows use 999. These new rows therefore start
 * at 101 and go up, so they never collide with the 1..33 block.
 *
 * Run: bun --env-file=.env scripts/seed-mentors-live.ts
 */
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { mentor } from '../src/lib/server/db/schema';
import sharp from 'sharp';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const MENTOR_DIR = join(process.cwd(), 'static', 'media', 'uploads', 'mentori');
const LOCAL_BASE = '/media/uploads/mentori';

interface LiveMentor {
	slug: string;
	nameRo: string;
	titleRo: string;
	bioRo: string;
	/** Year taken verbatim from the "…din anul NNNN" sentence in the live bio. */
	yearJoined: number | null;
	sortOrder: number;
	/** Original wp-content upload; the largest available size for this image. */
	sourceImageUrl: string;
}

const LIVE_MENTORS: LiveMentor[] = [
	{
		slug: 'vlad-andrei-raducanu',
		nameRo: 'Vlad Andrei Răducanu',
		titleRo: 'Phd. arhitect',
		yearJoined: 2026,
		sortOrder: 101,
		sourceImageUrl: 'https://kogaionacademy.ro/wp-content/uploads/2026/04/Poza-portret-1.jpg',
		bioRo: `Andrei Răducanu (cunoscut și ca “Zoster”) predă în regim privat desen de arhitectură de 17 ani în cadrul cursurilor “Cuibar”. A predat și în cadrul UNArte timp de 10 ani. Andrei a absolvit Universitatea de Arhitectură și Urbanism „Ion Mincu”, cât și un an de Erasmus în Germania (Dessau Institute of Architecture) unde a fost inițiat în design algoritmic (cunoscut și ca generativ sau computațional) și a susținut ulterior o serie de workshop-uri pe această temă, urmând să își dea doctoratul la Universitatea Politehnica București, departamentul Știința și Ingineria materialelor. În prezent are diverse colaborări în domeniul de proiectare, design algoritmic, grafică, etc. în paralel cu pregătirea noilor generații de viitori arhitecți. Este mentor colaborator Kogaion Gifted Academy din anul 2026.`
	},
	{
		slug: 'adriana-calugaru',
		nameRo: 'Adriana Călugăru',
		titleRo: 'Profesor biologie, Formator copii și adulți, Consilier educațional',
		yearJoined: 2026,
		sortOrder: 102,
		sourceImageUrl: 'https://kogaionacademy.ro/wp-content/uploads/2026/04/Poza-KGA.png',
		bioRo: `Lucrul cu copiii este, pentru mine, mai mult decât o profesie — este o chemare. De peste 15 ani sunt alături de elevi, ghidându-i cu răbdare, încredere și grijă pentru ritmul fiecăruia. Formarea mea în domeniul biologiei la Universitatea București, completată de studii de master în domeniul biologiei și chimiei la Universitatea Politehnică București și pregătire pedagogică, m-a ajutat să înțeleg nu doar ce învață un copil, ci mai ales cum învață și de ce are nevoie pentru a se simți în siguranță în acest proces. Experiența mea include atât activitatea la clasă, cât și roluri de coordonare și conducere în mediul educațional, unde am lucrat îndeaproape cu copii, părinți și profesori pentru a crea un mediu echilibrat și motivant. În cadrul Kogaion Gifted Academy, aleg să mă întorc la esență: primii pași ai copilului în învățare. Cred că fiecare copil are un potențial extraordinar, care nu trebuie grăbit, ci înțeles și încurajat cu răbdare. Îmi doresc ca fiecare copil să plece din aceste experiențe cu încredere, cu bucuria de a descoperi și cu dorința de a învăța mai departe. Pentru că, uneori, cel mai important lucru nu este cât învață un copil ci cât de mult ajunge să iubească învățarea. Este mentor colaborator Kogaion din anul 2026.`
	},
	{
		slug: 'bianca-gabriela-balan',
		nameRo: 'Bianca Gabriela Bălan',
		titleRo: 'Artist multidisciplinar, creator de muzică, mobilier, design vestimentar',
		yearJoined: 2026,
		sortOrder: 103,
		sourceImageUrl: 'https://kogaionacademy.ro/wp-content/uploads/2026/06/Bianca-Gabriela.jpeg',
		bioRo: `„M-am născut înzestrată cu diverse aptitudini si talente, mereu cele mai evidente au fost de natură artistică, observare interioară și socializare, în schimb am ales sa studiez și să aprofundez științele naturii, matematica, informatica, preferând ca talentul artistic să se dezvolte în mod original, unic. Experiența mea în domeniul artei de orice natură (pictură, pictură murală, tâmplărie, arhitectură, design, proiectare și prelucrare de mobilă din lemn, construcții, muzica instrumentală, design vestimentar) este autodidactă prin observare profundă atât interioară cât și exterioară și în continuă dezvoltare în armonie cu tot ceea ce mă înconjoară. Obiectivul meu este de a aprofunda prin experiența proprie pentru a transmite mai departe deschiderea către conștiința pură, arta la baza căreia stă spontaneitatea, creativitatea, unicitatea personală a fiecăruia.” Bianca este mentor Kogaion din anul 2026.`
	},
	{
		slug: 'smaranda-andronic',
		nameRo: 'Smaranda Andronic',
		titleRo: 'Profesor robotică',
		yearJoined: 2025,
		sortOrder: 104,
		sourceImageUrl: 'https://kogaionacademy.ro/wp-content/uploads/2026/03/Smaranda-Andronic.jpg',
		bioRo: `Smaranda este inginer în formare avansată în sisteme embedded și robotică (Master în Embedded Systems și Licență în Computer Science & IT), cu experiență practică în proiecte hardware-software și în predare. Este asistent universitar la Universitatea București, unde susține laboratoare de Introducere în Robotică și lucrează cu microcontrolere, senzori și sisteme de control aplicate. În proiectele personale a construit soluții complexe, precum un Smart Home cu control local și remote (MQTT+aplicație mobil), Arduino line follower cu PID, integrare de concepte embedded și rețelistică și, elemente de AI/LLM ca support tehnic. În tabăra de robotică Smaranda traduce tehnologia în experiențe de proiect accesibile copiilor în care fiecare învață să conecteze corect componentele, să înțeleagă cauza unei erori, să testeze și să îmbunătățească. Stilul ei este cald, pragmatic și orientat pe autonomie: copilul simte că „pot să fac”, nu că „mi s-a făcut”. Smaranda este mentor colaborator Kogaion din anul 2025.`
	},
	{
		slug: 'sara-iosub',
		nameRo: 'Sara Iosub',
		titleRo: 'Drd. Arhitect',
		yearJoined: 2026,
		sortOrder: 105,
		sourceImageUrl: 'https://kogaionacademy.ro/wp-content/uploads/2026/04/Sara-Iosub-ff-buna.jpg',
		bioRo: `Sara a absolvit Facultatea de Arhitectură în cadrul Universității de Arhitectură și Urbanism „Ion Mincu”. Din dorința de a aprofunda domeniul arhitecturii și de a continua procesul de cercetare și învățare, și-a început studiile doctorale. În prezent, activează ca asistent universitar în cadrul Facultății de Arhitectură, contribuind la formarea noilor generații de studenți. În paralel cu activitatea academică, Sara este colaboratoare în cadrul cursului “Cuibar” de desen de arhitectură. Experiența acumulată atât în mediul universitar, cât și în cel privat, i-a consolidat convingerea că predarea și împărtășirea cunoștințelor reprezintă unele dintre cele mai mari împliniri profesionale și personale. Sara este mentor colaborator Kogaion Gifted Academy din anul 2026.`
	},
	{
		slug: 'fabian-andrei-stoica',
		nameRo: 'Fabian-Andrei Stoica',
		titleRo: 'Mentor programare, robotică, fizică experimentală',
		yearJoined: 2026,
		sortOrder: 106,
		sourceImageUrl:
			'https://kogaionacademy.ro/wp-content/uploads/2026/05/Fabian-Andrei-Stoica.jpeg',
		bioRo: `Fabian este licențiat al Facultății de Electronică, Telecomunicații si Tehnologia Informației din cadrul Universității Politehnica București. A participat la „Robochallenge 2025” unde a dezvoltat un robot customizat. Este trainer de robotică și programare, inginer în electronică aplicată, specializat în procesarea semnalelor și integrare AI. Fabian este inginer electronist cu experiență aplicată în bio-materiale, hidrogeluri și mecanica fluidelor ne-newtoniene pentru printarea de țesuturi. „Îmi place să rezolv probleme complexe, să învăț noi tehnologii și sa lucrez în echipe multidisciplinare”. Este mentor colaborator Kogaion din anul 2026.`
	},
	{
		slug: 'ciprian-vantdevara',
		nameRo: 'Ciprian Vântdevară',
		titleRo: 'Astronom, Cercetător',
		yearJoined: 2026,
		sortOrder: 107,
		sourceImageUrl: 'https://kogaionacademy.ro/wp-content/uploads/2026/04/Ciprian-Vantdevara.jpg',
		bioRo: `Ciprian este absolvent a Facultății de Geografie a Univ. din Galați și are o experiență de peste un deceniu în susținerea de cursuri, ateliere, prezentări și evenimente cu tematică astronomică, fiind coordonatorul Astroclubului „Perseus” din cadrul Observatorului Astronomic al Muzeului „Vasile Pârvan” din Bârlad. Ciprian are o activitate științifică remarcabilă, descoperind mai multe stele, între care o nova roșie luminoasă în 10 februarie 2015 și, recent, în 7 aprilie 2026, un sistem binar format dintr-o pitică portocalie și o pitică roșie, confirmate oficial în baza de date internațională VSX a Asociației Americane a Observatorilor de Stele Variabile. Ciprian este mentor colaborator Kogaion Gifted Academy din anul 2026.`
	},
	{
		slug: 'petre-butunoi-olteanu',
		nameRo: 'Petre Butunoi-Olteanu',
		titleRo: 'Inginer IT, Mentor programare și robotică',
		yearJoined: 2026,
		sortOrder: 108,
		sourceImageUrl:
			'https://kogaionacademy.ro/wp-content/uploads/2026/03/Petre-Butunoi-Olteanu.jpg',
		bioRo: `Petre este inginer IT (Master in Computers and Information Technolgy și Licență în Electronică, Telecomunicații și Tehnologia Informației la Universitatea Politehnică București) cu background în cloud, intrastructură și securitate. După un parcurs profesional la Microsoft și Huawei Technolgies din Hangzhou, a decis să se îndrepte în zona de mentorat pentru copii și adolescenți cu care a lucrat pe partea de programare, dezvoltând gândirea logică prin platforme și proiecte în Python, C++, JavaScript, Unity, cu metodologii adaptate vârstei. În tabăra de tehnologie Petre creează un cadru în care adolescenții trec de la „utilizatori de tehnologie” la constructori de sisteme: proiecte cu pasi clari, debugging ghidat, standarde de calitate, colaborare în echipă și prezentare finală. Este mentor colaborator Kogaion din anul 2026.`
	},
	{
		slug: 'adriana-niculina-singeap',
		nameRo: 'Adriana Niculina Sîngeap',
		titleRo: 'Arhitect',
		yearJoined: 2026,
		sortOrder: 109,
		sourceImageUrl:
			'https://kogaionacademy.ro/wp-content/uploads/2026/04/1.-Adriana-Singeap_poza.jpg',
		bioRo: `Absolventă a Univ. Tehnice „Gh. Asachi”, facultatea de arhitectură „G. M. Cantacuzino” din Iaşi, a beneficiat de bursa Erasmus/Socrate din Lisabona (Portugalia, 2005), de școala internaţională de vară din Riga (Letonia, 2004) și de alte atestate (master Univ. București, etc.). După participarea la traducerea inițială a cursului de Case Pasive și obținerea certificării drept designer PHI în 2018, a certificat mai multe case pe platforma specială deschisă de către Institut (case pasive premium, plus și altele în curs). Este membră în PHAR – Asociația Casa Pasivă din România, iar în prezent conduce propriul birou de arhitectură din București. Impulsionată de proprii săi copii, s-a implicat în mai multe proiecte cu ei (cel mai sonor fiind lucrul în echipa De-a Arhitectura la macheta inclusă în Bienala de la Veneția din 2023) . Astfel, activitatea sa împletește cu succes partea teoretică (cursuri copii și adulți) cu cea practică (proiecte și certificări cu șantierele lor aferente). Este mentor colaborator Kogaion Gifted Academy din anul 2026.`
	}
];

/** Romanian diacritics -> ASCII, so "Răducanu" -> "Raducanu" and "Vântdevară" -> "vantdevara". */
export function slugify(nameRo: string): string {
	return nameRo
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[ȘȚşţ]/g, (c) => (c === 'Ș' || c === 'Ş' ? 'S' : 'T'))
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

async function downloadAndConvertToWebp(url: string, localPath: string): Promise<void> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
	const buf = await res.arrayBuffer();
	await sharp(Buffer.from(buf)).webp({ quality: 85 }).toFile(localPath);
}

async function main() {
	await mkdir(MENTOR_DIR, { recursive: true });

	const sql = postgres(databaseUrl);
	const db = drizzle(sql);

	let inserted = 0;
	let skipped = 0;
	const noImage: string[] = [];

	try {
		for (const m of LIVE_MENTORS) {
			const slug = m.slug || slugify(m.nameRo);
			const localPath = join(MENTOR_DIR, `${slug}.webp`);

			// Idempotency: never create a duplicate for an existing slug.
			const existing = await db.select().from(mentor).where(eq(mentor.slug, slug)).limit(1);
			if (existing.length > 0) {
				console.log(`  skipped (already in DB)  ${slug}  — ${m.nameRo}`);
				skipped++;
				continue;
			}

			// Portrait is best-effort: a failed download must not block the row.
			let image: string | null = `${LOCAL_BASE}/${slug}.webp`;
			try {
				await downloadAndConvertToWebp(m.sourceImageUrl, localPath);
				console.log(`  image ok                ${slug}  <- ${m.sourceImageUrl}`);
			} catch (e) {
				console.warn(`  image FAILED            ${slug}:`, e);
				image = null;
				noImage.push(slug);
			}

			// The live site is Romanian-only: no EN copy exists, so EN mirrors RO.
			// This matches what scripts/seed-mentors.ts does on INSERT.
			await db.insert(mentor).values({
				slug,
				nameRo: m.nameRo,
				nameEn: m.nameRo,
				titleRo: m.titleRo,
				titleEn: m.titleRo,
				bioRo: m.bioRo,
				bioEn: m.bioRo,
				image,
				yearJoined: m.yearJoined,
				sortOrder: m.sortOrder,
				status: 'published',
				publishedAt: new Date()
			});
			console.log(`  INSERTED                ${slug}  — ${m.nameRo} (sortOrder ${m.sortOrder})`);
			inserted++;
		}
	} finally {
		await sql.end();
	}

	console.log(
		`\nInserted: ${inserted}   Skipped (already present): ${skipped}   Total candidates: ${LIVE_MENTORS.length}`
	);
	if (noImage.length > 0) console.log(`Rows inserted without a portrait: ${noImage.join(', ')}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
