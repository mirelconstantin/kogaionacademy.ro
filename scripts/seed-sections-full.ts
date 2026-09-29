/**
 * Seed site_section for BOTH locales (ro + en), covering every section key the
 * admin CMS edits (see DEFAULT_SECTION_KEYS_BY_PAGE in routes/admin/pages/[pageKey]).
 *
 * Extends scripts/seed-sections.ts (which only wrote 'ro' and skipped 6 home
 * sections that only existed as code defaults in src/lib/server/cms-defaults.ts).
 *
 * Idempotent: onConflictDoUpdate on (page, section, locale).
 * Usage: bun run scripts/seed-sections-full.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { siteSection } from '../src/lib/server/db/schema';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

type Messages = Record<string, string>;
type Locale = 'ro' | 'en';

function loadMessages(locale: Locale): Messages {
	const raw = readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8');
	const data = JSON.parse(raw) as Record<string, unknown>;
	const out: Messages = {};
	for (const [k, v] of Object.entries(data)) {
		if (k.startsWith('$')) continue;
		out[k] = typeof v === 'string' ? v : String(v ?? '');
	}
	return out;
}

function m(msgs: Messages, key: string): string {
	return msgs[key] ?? key;
}

/** Home sections that previously only existed as hardcoded RO defaults. */
const HOME_EXTRA: Record<Locale, Record<string, Record<string, unknown>>> = {
	ro: {
		mentors_preview: {
			title: 'Fă cunoștință cu mentorii noștri',
			lead: 'Mentorii noștri sunt specializați în diverse domenii ale cunoașterii, multi și trans-disciplinar, sunt oameni dăruiți, empatici, cu pasiune pentru ceea ce fac.',
			ctaLabel: 'Fă cunoștință cu mentorii noștri',
			ctaLink: '/mentori'
		},
		why_us: {
			title: 'De ce Kogaion?',
			lead: 'Oferim programe integrate pentru copii și familii, gândite să dezvolte potențialul unic al fiecărui copil.',
			item1: {
				title: 'Abordare integrată',
				text: 'Programe care conectează știința, artele și dezvoltarea personală, adaptate pe vârste.'
			},
			item2: {
				title: 'Echipa de mentori',
				text: 'Specialiști dedicați care ghidează copiii și familiile în fiecare etapă.'
			},
			item3: {
				title: 'Comunitate activă',
				text: 'Peste 130 de familii implicate anual în activități și evenimente Kogaion.'
			}
		},
		about_teaser: {
			title: 'Viziunea noastră',
			body: 'Credem în descoperirea omului creator, capabil de o înaltă performanță academică, în fiecare copil. Credem și susținem unicitatea fiecărui copil, a fiecărei familii, printr-o educație integrată.',
			ctaLabel: 'Despre',
			ctaLink: '/despre'
		},
		programs_section: {
			title: 'Programe recomandate',
			lead: 'Programele Kogaion susțin nevoile de dezvoltare ale copiilor în fiecare etapă de vârstă, de la deschiderea orizontului de cunoaștere și identificarea abilităților native până la performanța în domeniul de pasiune și înțelegerea complexității vieții. Au la bază principiile gifted education și se adresează tuturor copiilor, pornind de la premisa unicității fiecărui copil.',
			ctaLabel: 'Descoperă toate programele'
		},
		blog_teaser: {
			title: 'Blog și știri',
			lead: 'Citește articole despre educație, dezvoltare și experiențe din comunitatea Kogaion.',
			ctaLabel: 'Vezi toate articolele',
			ctaLink: '/blog'
		},
		contact_cta: {
			title: 'Hai să discutăm',
			body: 'Ai întrebări despre programe sau vrei să înscrii copilul? Contactează-ne pentru o discuție personalizată.',
			ctaLabel: 'Contact',
			ctaLink: '/contact'
		}
	},
	en: {
		mentors_preview: {
			title: 'Meet our mentors',
			lead: 'Our mentors are specialists across many fields of knowledge, multi- and trans-disciplinary. They are generous, empathetic people with a passion for what they do.',
			ctaLabel: 'Meet our mentors',
			ctaLink: '/mentors'
		},
		why_us: {
			title: 'Why Kogaion?',
			lead: 'We offer integrated programmes for children and families, designed to develop the unique potential of every child.',
			item1: {
				title: 'Integrated approach',
				text: 'Programmes that connect science, the arts and personal development, adapted to each age.'
			},
			item2: {
				title: 'Mentor team',
				text: 'Dedicated specialists who guide children and families through every stage.'
			},
			item3: {
				title: 'Active community',
				text: 'More than 130 families involved each year in Kogaion activities and events.'
			}
		},
		about_teaser: {
			title: 'Our vision',
			body: 'We believe in discovering the creative person capable of high academic performance in every child. We believe in and support the uniqueness of every child and every family through an integrated education.',
			ctaLabel: 'About',
			ctaLink: '/about'
		},
		programs_section: {
			title: 'Recommended programmes',
			lead: 'Kogaion programmes support children’s developmental needs at every age stage, from opening up their horizons and identifying natural abilities to achieving performance in a field of passion and understanding the complexity of life. They are grounded in gifted-education principles and open to all children, starting from the premise that every child is unique.',
			ctaLabel: 'Discover all programmes'
		},
		blog_teaser: {
			title: 'Blog and news',
			lead: 'Read articles about education, development and experiences from the Kogaion community.',
			ctaLabel: 'See all articles',
			ctaLink: '/blog'
		},
		contact_cta: {
			title: 'Let’s talk',
			body: 'Do you have questions about our programmes or want to enrol your child? Contact us for a personalised conversation.',
			ctaLabel: 'Contact',
			ctaLink: '/contact'
		}
	}
};

function buildSections(loc: Locale, msgs: Messages) {
	const isRo = loc === 'ro';
	return [
		// ---------- HOME ----------
		{
			page: 'home',
			section: 'intro',
			payload: { heading: m(msgs, 'home_intro_heading'), body: m(msgs, 'home_intro_body') }
		},
		{
			page: 'home',
			section: 'stats',
			payload: isRo
				? {
						card1: { label: 'Susținere', number: '130+', text: 'familii implicate anual' },
						card2: { label: 'Experiență', number: '10+ ani', text: 'programe integrate Kogaion' },
						card3: { label: 'Comunitate', number: '3–17', text: 'ani, programe adaptate pe etape' }
					}
				: {
						card1: { label: 'Support', number: '130+', text: 'families involved each year' },
						card2: {
							label: 'Experience',
							number: '10+ years',
							text: 'integrated Kogaion programmes'
						},
						card3: { label: 'Community', number: '3–17', text: 'years old, age-adapted programmes' }
					}
		},
		{
			page: 'home',
			section: 'hero_label',
			payload: { text: 'Kogaion Gifted Academy' }
		},
		{
			page: 'home',
			section: 'featured_heading',
			payload: { title: m(msgs, 'home_featured_programs_heading') }
		},
		...Object.entries(HOME_EXTRA[loc]).map(([section, payload]) => ({
			page: 'home',
			section,
			payload
		})),

		// ---------- ABOUT ----------
		{
			page: 'about',
			section: 'hero',
			payload: {
				label: m(msgs, 'about_story_label'),
				title: m(msgs, 'about_title'),
				tagline: m(msgs, 'about_hero_tagline'),
				subline: m(msgs, 'about_hero_subline'),
				ctaLabel: m(msgs, 'about_cta_discover_programs')
			}
		},
		{
			page: 'about',
			section: 'letter',
			payload: {
				greeting: m(msgs, 'about_letter_greeting'),
				p1: m(msgs, 'about_potential_paragraph1'),
				p2: m(msgs, 'about_potential_paragraph2'),
				p3: m(msgs, 'about_potential_paragraph3'),
				visionTitle: m(msgs, 'about_vision_title'),
				visionBody: m(msgs, 'about_vision_body')
			}
		},
		{
			page: 'about',
			section: 'timeline',
			payload: {
				title: m(msgs, 'about_timeline_title'),
				items: [
					{
						year: '2013',
						title: m(msgs, 'about_timeline_2013_title'),
						text: m(msgs, 'about_founders_intro')
					},
					{
						year: '2016',
						title: m(msgs, 'about_timeline_2016_title'),
						text: m(msgs, 'about_campaign_body')
					},
					{
						year: m(msgs, 'about_timeline_year_today'),
						title: m(msgs, 'about_timeline_today_title'),
						text: m(msgs, 'about_hero_paradigm')
					}
				]
			}
		},
		{
			page: 'about',
			section: 'mission',
			payload: {
				title: m(msgs, 'about_mission_title'),
				bullet1: m(msgs, 'about_mission_bullet1'),
				bullet2: m(msgs, 'about_mission_bullet2'),
				bullet3: m(msgs, 'about_mission_bullet3')
			}
		},
		{
			page: 'about',
			section: 'integrated',
			payload: {
				title: m(msgs, 'about_integrated_title'),
				intro: m(msgs, 'about_integrated_intro'),
				items: [
					m(msgs, 'about_integrated_item1'),
					m(msgs, 'about_integrated_item2'),
					m(msgs, 'about_integrated_item3'),
					m(msgs, 'about_integrated_item4'),
					m(msgs, 'about_integrated_item5')
				]
			}
		},
		{
			page: 'about',
			section: 'transdisciplinary',
			payload: {
				title: m(msgs, 'about_transdisciplinary_title'),
				body: m(msgs, 'about_transdisciplinary_body')
			}
		},
		{
			page: 'about',
			section: 'skills',
			payload: {
				intro: m(msgs, 'about_integrated_skills_intro'),
				skills: [
					m(msgs, 'about_skill_1'),
					m(msgs, 'about_skill_2'),
					m(msgs, 'about_skill_3'),
					m(msgs, 'about_skill_4'),
					m(msgs, 'about_skill_5'),
					m(msgs, 'about_skill_6'),
					m(msgs, 'about_skill_7'),
					m(msgs, 'about_skill_8'),
					m(msgs, 'about_skill_9')
				]
			}
		},
		{
			page: 'about',
			section: 'founders',
			payload: { title: m(msgs, 'about_founders_title'), intro: m(msgs, 'about_founders_intro') }
		},
		{
			page: 'about',
			section: 'age_cards',
			payload: {
				title: m(msgs, 'about_programs_structure_title'),
				intro: m(msgs, 'about_programs_structure_intro'),
				cards: [
					{
						title: m(msgs, 'about_age_early_years'),
						age: '3-6',
						image: '/media/uploads/about/age-3-6.webp'
					},
					{
						title: m(msgs, 'about_age_primary'),
						age: '7-12',
						image: '/media/uploads/about/age-7-12.webp'
					},
					{
						title: m(msgs, 'about_age_secondary'),
						age: '13-18',
						image: '/media/uploads/about/age-13-18.webp'
					}
				]
			}
		},
		{
			page: 'about',
			section: 'cta_section',
			payload: {
				programsTitle: m(msgs, 'about_cta_discover_programs'),
				programsIntro: m(msgs, 'programs_from_about_intro'),
				mentorsTitle: m(msgs, 'about_cta_meet_mentors'),
				mentorsLead: m(msgs, 'about_mentors_lead'),
				connect: m(msgs, 'menu_connect')
			}
		},

		// ---------- PROGRAMS / MENTORS / CONTACT ----------
		{
			page: 'programs',
			section: 'hero',
			payload: { title: m(msgs, 'programs_title'), intro: m(msgs, 'programs_intro') }
		},
		{
			page: 'mentors',
			section: 'hero',
			payload: { title: m(msgs, 'mentors_title'), intro: m(msgs, 'mentors_intro') }
		},
		{
			page: 'mentors',
			section: 'cta',
			payload: {
				title: m(msgs, 'mentors_cta_title'),
				body: m(msgs, 'mentors_cta_body'),
				buttonLabel: m(msgs, 'mentors_cta_button')
			}
		},
		{
			page: 'contact',
			section: 'hero',
			payload: { title: m(msgs, 'contact_title'), intro: m(msgs, 'contact_hero_intro') }
		}
	];
}

async function seed() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	let total = 0;
	for (const loc of ['ro', 'en'] as const) {
		const msgs = loadMessages(loc);
		const sections = buildSections(loc, msgs);
		for (const { page, section, payload } of sections) {
			await db
				.insert(siteSection)
				.values({ page, section, locale: loc, payload, updatedBy: 'seed' })
				.onConflictDoUpdate({
					target: [siteSection.page, siteSection.section, siteSection.locale],
					set: { payload, updatedAt: new Date(), updatedBy: 'seed' }
				});
		}
		total += sections.length;
		console.log(`  ${loc}: ${sections.length} sections`);
	}

	await client.end();
	console.log(`Seeded ${total} site_section rows (ro + en).`);
}

seed().catch((e) => {
	console.error(e);
	process.exit(1);
});
