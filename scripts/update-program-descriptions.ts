import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { program, programLocale } from '../src/lib/server/db/schema';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const descriptionsRo: Record<string, string> = {
	'afterschool-kogaion-self-mastery':
		'Programul Afterschool Kogaion Self Mastery dezvolta autonomia, disciplina si placerea de a invata prin proiecte aplicate, rutina echilibrata si mentorat atent pentru fiecare copil.',
	'kogaion-bright-academy':
		'Kogaion Bright Academy stimuleaza gandirea creativa si interdisciplinara prin activitati STEM, arte si comunicare, oferind copiilor un cadru clar pentru progres real.',
	'kogaion-family-bootcamp-4-6-ani':
		'Family Bootcamp 4-6 ani este experienta in care parintii si copiii invata impreuna prin joc ghidat, conexiune emotionala si activitati care intaresc baza dezvoltarii timpurii.',
	'kogaion-family-bootcamp':
		'Family Bootcamp 7-12 ani combina provocari educationale, colaborare in familie si experiente in natura pentru a construi incredere, responsabilitate si motivatie pe termen lung.',
	'kogaion-gifted-family':
		'Gifted Family este programul dedicat familiilor cu copii cu potential inalt, oferind strategii concrete pentru echilibru emotional, performanta si directionare academica personalizata.',
	'kogaion-science-bootcamp':
		'Science Bootcamp transforma curiozitatea in descoperire prin experimente, observatie si proiecte practice care consolideaza gandirea stiintifica si invatarea prin explorare.',
	'kogaion-architecture-bootcamp':
		'Architecture Bootcamp ii introduce pe copii in logica spatiului, design si constructie prin exercitii creative care dezvolta viziunea, precizia si colaborarea.',
	'kogaion-engineer-bootcamp-2':
		'Engineer Bootcamp pune accent pe rezolvarea de probleme, prototipare si lucru in echipa, astfel incat copiii sa inteleaga cum ideile devin solutii functionale.',
	'kogaion-astronomy-bootcamp':
		'Astronomy Bootcamp dezvolta gandirea analitica si imaginatia prin observatii ghidate, modele interactive si experimente care apropie copiii de stiinta universului.',
	'kogaion-arts-bootcamp-2':
		'Arts Bootcamp valorifica expresia personala prin desen, compozitie vizuala si proiecte artistice integrate, sustinand increderea si sensibilitatea estetica.',
	'kogaion-robotics-bootcamp-2':
		'Robotics Bootcamp imbina logica, tehnologia si creativitatea prin constructie si programare de baza, antrenand perseverenta si gandirea algoritmica.',
	'film-and-photo-advanced-learning':
		'Film & Photo Advanced Learning ofera adolescentilor instrumente de storytelling vizual, compozitie si productie media, de la idee la portofoliu coerent.',
	'architecture-advanced-learning':
		'Architecture Advanced Learning aprofundeaza designul arhitectural prin concept, schita si modelare, dezvoltand rigoarea tehnica si gandirea spatiala.',
	'technology-advanced-learning':
		'Technology Advanced Learning pregateste adolescentii pentru viitor prin proiecte tech aplicate, gandire computationala si utilizare inteligenta a instrumentelor digitale.',
	'interior-architecture-advanced-learning':
		'Interior Architecture Advanced Learning formeaza competenta de a proiecta spatii functionale si expresive prin studiu de stil, materiale si ergonomie.',
	'conectom-advanced-learning-2':
		'Conectom Advanced Learning dezvolta abilitatea de a invata eficient, de a integra informatii complexe si de a construi strategii personale de performanta academica.'
};

const descriptionsEn: Record<string, string> = {
	'afterschool-kogaion-self-mastery':
		'Afterschool Kogaion Self Mastery builds autonomy, discipline, and joy for learning through applied projects, balanced routines, and personalized mentoring.',
	'kogaion-bright-academy':
		'Kogaion Bright Academy nurtures creative and interdisciplinary thinking through STEM, arts, and communication activities in a clear growth framework.',
	'kogaion-family-bootcamp-4-6-ani':
		'Family Bootcamp 4-6 is a shared parent-child experience focused on guided play, emotional connection, and strong early development foundations.',
	'kogaion-family-bootcamp':
		'Family Bootcamp 7-12 combines educational challenges, family collaboration, and outdoor experiences to strengthen confidence and long-term motivation.',
	'kogaion-gifted-family':
		'Gifted Family supports families with high-potential children through practical strategies for emotional balance, performance, and personalized academic direction.',
	'kogaion-science-bootcamp':
		'Science Bootcamp turns curiosity into discovery through experiments and hands-on projects that strengthen scientific thinking.',
	'kogaion-architecture-bootcamp':
		'Architecture Bootcamp introduces children to space logic, design, and building through creative exercises that improve precision and teamwork.',
	'kogaion-engineer-bootcamp-2':
		'Engineer Bootcamp focuses on problem-solving, prototyping, and team collaboration to show how ideas become functional solutions.',
	'kogaion-astronomy-bootcamp':
		'Astronomy Bootcamp develops analytical thinking and imagination through guided observation and interactive models.',
	'kogaion-arts-bootcamp-2':
		'Arts Bootcamp encourages personal expression through visual composition and integrated creative projects.',
	'kogaion-robotics-bootcamp-2':
		'Robotics Bootcamp blends logic, technology, and creativity through introductory building and programming challenges.',
	'film-and-photo-advanced-learning':
		'Film & Photo Advanced Learning equips teens with visual storytelling, composition, and media production skills from concept to portfolio.',
	'architecture-advanced-learning':
		'Architecture Advanced Learning deepens design skills through concept work, sketching, and model exploration.',
	'technology-advanced-learning':
		'Technology Advanced Learning prepares teens through applied tech projects, computational thinking, and smart digital workflows.',
	'interior-architecture-advanced-learning':
		'Interior Architecture Advanced Learning trains students to design functional and expressive spaces with style, materials, and ergonomics.',
	'conectom-advanced-learning-2':
		'Conectom Advanced Learning develops efficient learning strategies and the ability to structure complex knowledge for academic performance.'
};

async function run() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	const programs = await db.select({ id: program.id, slug: program.slug }).from(program);
	let updatedRo = 0;
	let updatedEn = 0;

	for (const p of programs) {
		const roDescription = descriptionsRo[p.slug];
		if (roDescription) {
			const res = await db
				.update(programLocale)
				.set({ description: roDescription })
				.where(and(eq(programLocale.programId, p.id), eq(programLocale.locale, 'ro')));
			updatedRo += Number(res.count ?? 0);
		}

		const enDescription = descriptionsEn[p.slug];
		if (enDescription) {
			const res = await db
				.update(programLocale)
				.set({ description: enDescription })
				.where(and(eq(programLocale.programId, p.id), eq(programLocale.locale, 'en')));
			updatedEn += Number(res.count ?? 0);
		}
	}

	console.log(`Updated program descriptions: ro=${updatedRo}, en=${updatedEn}`);
	await client.end();
}

run().catch((error) => {
	console.error(error);
	process.exit(1);
});
