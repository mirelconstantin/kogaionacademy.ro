/**
 * Inserează articole demo pe blog (RO, publicate).
 * Idempotent: folosește slug-uri fixe; rulează din nou = actualizează conținutul.
 * Usage: bun run scripts/seed-blog-demo.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { blogPost } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const DEMO_POSTS: Array<{
	slug: string;
	title: string;
	excerpt: string;
	body: string;
	featuredImage: string;
}> = [
	{
		slug: 'ce-inseamna-să-fii-copil-dar',
		title: 'Ce înseamnă să fii copil dar',
		excerpt:
			'O scurtă reflecție despre cum Kogaion privește potențialul copiilor cu dar și cum îi susținem pe parcursul dezvoltării.',
		body: `<p>La Kogaion Gifted Academy credem că fiecare copil are un potențial unic. Rolul nostru este să identificăm punctele forte și să creăm un mediu în care acestea să poată evolua natural.</p>
<h2>Ce oferim</h2>
<p>Programele noastre acoperă <strong>științe, arte, tehnologie și dezvoltare personală</strong>. Lucrăm cu grupe mici, astfel încât fiecare participant primește atenția necesară.</p>
<h2>Cine poate participa</h2>
<p>Copiii cu vârste între 3 și 18 ani găsesc la noi activități adaptate vârstei și intereselor. Începem cu sesiuni de cunoaștere și evaluare discretă, fără etichete inutile.</p>
<p>Dacă vrei să afli mai multe, <a href="/contact">contactează-ne</a> sau explorează <a href="/programe">programele</a> noastre.</p>`,
		featuredImage: '/media/uploads/about/age-7-12.webp'
	},
	{
		slug: 'programe-de-vară-2025',
		title: 'Programe de vară 2025',
		excerpt:
			'Summer camps, ateliere de științe și arte și șanse de socializare pentru copiii pasionați. Înscrieri deschise.',
		body: `<p>Vara este momentul ideal pentru explorare și învățare în afara programului școlar. Pregătim <strong>tabere și ateliere</strong> pentru diferite vârste și profiluri.</p>
<h2>Ce include</h2>
<ul>
<li>Ateliere de științe experimentale</li>
<li>Arte (film, foto, arhitectură)</li>
<li>Robotică și tehnologie</li>
<li>Activități în natură și team-building</li>
</ul>
<h2>Cum te înscrii</h2>
<p>Verifică secțiunea <a href="/programe">Programe</a> pentru oferta actuală și formularele de înscriere. Poți și ne scrie la <a href="/contact">Contact</a> pentru detalii.</p>`,
		featuredImage: '/media/uploads/blog/hero.webp'
	},
	{
		slug: 'mentorii-kogaion-cine-sunt',
		title: 'Mentorii Kogaion: cine sunt',
		excerpt:
			'Echipa noastră este formată din specialiști în educație, arte și științe, dedicați să ghideze copiii cu respect și răbdare.',
		body: `<p>Fiecare program este condus de <strong>mentori cu experiență</strong> în domeniul respectiv și, la fel de important, cu dorința de a lucra cu copiii.</p>
<h2>Abordarea noastră</h2>
<p>Nu punem etichete. Observăm punctele forte, provocăm gândirea și oferim un spațiu sigur pentru încercări și greșeli. Rezultatele vin în timp, prin consecvență și încredere.</p>
<h2>Cunoaște echipa</h2>
<p>Poți vedea toți mentorii și scurtele lor bio pe pagina <a href="/mentori">Mentori</a>. Dacă ai întrebări despre un program anume, echipa de contact te poate direcționa către mentorul potrivit.</p>`,
		featuredImage: '/media/uploads/about/founder-diana.webp'
	},
	{
		slug: 'de-ce-educație-non-formală',
		title: 'De ce educație non-formală',
		excerpt:
			'În afara cadrului școlar clasic, copiii pot explora pasiunile și să învețe prin proiecte și colaborare. Iată de ce contează.',
		body: `<p>Educația non-formală nu înlocuiește școala, o <em>completează</em>. Oferă un cadru flexibil în care copilul poate experimenta, pune întrebări și lucra în echipă pe teme care îl pasionează.</p>
<h2>Beneficii</h2>
<ul>
<li>Învățare bazată pe proiecte și curiozitate</li>
<li>Ritm adaptat grupului și nevoilor individuale</li>
<li>Mai mult spațiu pentru creativitate și greșeli productive</li>
</ul>
<blockquote><p>Scopul nu este doar să „pase” informații, ci să formăm gândire critică și autonomie.</p></blockquote>
<p>La Kogaion combinăm structură și libertate: există un program clar, dar și loc pentru idei și direcții noi propuse de participanți.</p>`,
		featuredImage: '/media/uploads/about/age-3-6.webp'
	}
];

async function seed() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	const now = new Date();
	console.log('Seeding demo blog posts...');

	for (const post of DEMO_POSTS) {
		const existing = await db.select({ id: blogPost.id }).from(blogPost).where(eq(blogPost.slug, post.slug)).limit(1);

		const values = {
			title: post.title,
			slug: post.slug,
			excerpt: post.excerpt,
			body: post.body,
			locale: 'ro',
			status: 'published' as const,
			featuredImage: post.featuredImage,
			publishedAt: now,
			scheduledFor: null,
			updatedBy: null
		};

		if (existing.length > 0) {
			await db.update(blogPost).set({ ...values, updatedAt: now }).where(eq(blogPost.id, existing[0].id));
			console.log('  Updated:', post.slug);
		} else {
			await db.insert(blogPost).values(values);
			console.log('  Inserted:', post.slug);
		}
	}

	await client.end();
	console.log('Done.');
}

seed().catch((e) => {
	console.error(e);
	process.exit(1);
});
