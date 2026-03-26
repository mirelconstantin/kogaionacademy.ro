/**
 * Seed site_section with default content from messages (ro).
 * Idempotent: uses onConflictDoUpdate. Run: bun run scripts/seed-sections.ts
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

function loadMessages(locale: string): Messages {
	const path = join(process.cwd(), 'messages', `${locale}.json`);
	const raw = readFileSync(path, 'utf-8');
	const data = JSON.parse(raw) as Record<string, unknown>;
	const out: Messages = {};
	for (const [k, v] of Object.entries(data)) {
		if (k.startsWith('$')) continue;
		out[k] = typeof v === 'string' ? v : String(v ?? '');
	}
	return out;
}

function m(ro: Messages, key: string): string {
	return ro[key] ?? key;
}

async function seed() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);
	const ro = loadMessages('ro');

	console.log('Seeding site sections (ro)...');

	const sections: Array<{ page: string; section: string; payload: object }> = [
		// HOME
		{
			page: 'home',
			section: 'intro',
			payload: {
				heading: m(ro, 'home_intro_heading'),
				body: m(ro, 'home_intro_body')
			}
		},
		{
			page: 'home',
			section: 'stats',
			payload: {
				card1: { label: 'Susținere', number: '130+', text: 'familii implicate anual' },
				card2: { label: 'Experiență', number: '10+ ani', text: 'programe integrate Kogaion' },
				card3: { label: 'Comunitate', number: '3–17', text: 'ani, programe adaptate pe etape' }
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
			payload: { title: m(ro, 'home_featured_programs_heading') }
		},
		// ABOUT
		{
			page: 'about',
			section: 'hero',
			payload: {
				label: m(ro, 'about_story_label'),
				title: m(ro, 'about_title'),
				tagline: m(ro, 'about_hero_tagline'),
				subline: m(ro, 'about_hero_subline'),
				ctaLabel: m(ro, 'about_cta_discover_programs')
			}
		},
		{
			page: 'about',
			section: 'letter',
			payload: {
				greeting: m(ro, 'about_letter_greeting'),
				p1: m(ro, 'about_potential_paragraph1'),
				p2: m(ro, 'about_potential_paragraph2'),
				p3: m(ro, 'about_potential_paragraph3'),
				visionTitle: m(ro, 'about_vision_title'),
				visionBody: m(ro, 'about_vision_body')
			}
		},
		{
			page: 'about',
			section: 'timeline',
			payload: {
				title: m(ro, 'about_timeline_title'),
				items: [
					{ year: '2013', title: m(ro, 'about_timeline_2013_title'), text: m(ro, 'about_founders_intro') },
					{ year: '2016', title: m(ro, 'about_timeline_2016_title'), text: m(ro, 'about_campaign_body') },
					{ year: m(ro, 'about_timeline_year_today'), title: m(ro, 'about_timeline_today_title'), text: m(ro, 'about_hero_paradigm') }
				]
			}
		},
		{
			page: 'about',
			section: 'mission',
			payload: {
				title: m(ro, 'about_mission_title'),
				bullet1: m(ro, 'about_mission_bullet1'),
				bullet2: m(ro, 'about_mission_bullet2'),
				bullet3: m(ro, 'about_mission_bullet3')
			}
		},
		{
			page: 'about',
			section: 'integrated',
			payload: {
				title: m(ro, 'about_integrated_title'),
				intro: m(ro, 'about_integrated_intro'),
				items: [
					m(ro, 'about_integrated_item1'),
					m(ro, 'about_integrated_item2'),
					m(ro, 'about_integrated_item3'),
					m(ro, 'about_integrated_item4'),
					m(ro, 'about_integrated_item5')
				]
			}
		},
		{
			page: 'about',
			section: 'transdisciplinary',
			payload: {
				title: m(ro, 'about_transdisciplinary_title'),
				body: m(ro, 'about_transdisciplinary_body')
			}
		},
		{
			page: 'about',
			section: 'skills',
			payload: {
				intro: m(ro, 'about_integrated_skills_intro'),
				skills: [
					m(ro, 'about_skill_1'),
					m(ro, 'about_skill_2'),
					m(ro, 'about_skill_3'),
					m(ro, 'about_skill_4'),
					m(ro, 'about_skill_5'),
					m(ro, 'about_skill_6'),
					m(ro, 'about_skill_7'),
					m(ro, 'about_skill_8'),
					m(ro, 'about_skill_9')
				]
			}
		},
		{
			page: 'about',
			section: 'founders',
			payload: {
				title: m(ro, 'about_founders_title'),
				intro: m(ro, 'about_founders_intro')
			}
		},
		{
			page: 'about',
			section: 'age_cards',
			payload: {
				title: m(ro, 'about_programs_structure_title'),
				intro: m(ro, 'about_programs_structure_intro'),
				cards: [
					{ title: m(ro, 'about_age_early_years'), age: '3-6', image: '/media/uploads/about/age-3-6.webp' },
					{ title: m(ro, 'about_age_primary'), age: '7-12', image: '/media/uploads/about/age-7-12.webp' },
					{ title: m(ro, 'about_age_secondary'), age: '13-18', image: '/media/uploads/about/age-13-18.webp' }
				]
			}
		},
		{
			page: 'about',
			section: 'cta_section',
			payload: {
				programsTitle: m(ro, 'about_cta_discover_programs'),
				programsIntro: m(ro, 'programs_from_about_intro'),
				mentorsTitle: m(ro, 'about_cta_meet_mentors'),
				mentorsLead: m(ro, 'about_mentors_lead'),
				connect: m(ro, 'menu_connect')
			}
		},
		// PROGRAMS
		{
			page: 'programs',
			section: 'hero',
			payload: {
				title: m(ro, 'programs_title'),
				intro: m(ro, 'programs_intro')
			}
		},
		// MENTORS
		{
			page: 'mentors',
			section: 'hero',
			payload: {
				title: m(ro, 'mentors_title'),
				intro: m(ro, 'mentors_intro')
			}
		},
		{
			page: 'mentors',
			section: 'cta',
			payload: {
				title: m(ro, 'mentors_cta_title'),
				body: m(ro, 'mentors_cta_body'),
				buttonLabel: m(ro, 'mentors_cta_button')
			}
		},
		// CONTACT (hero text - rest is contact_settings)
		{
			page: 'contact',
			section: 'hero',
			payload: {
				title: m(ro, 'contact_title'),
				intro: m(ro, 'contact_hero_intro')
			}
		}
	];

	for (const { page, section, payload } of sections) {
		await db
			.insert(siteSection)
			.values({
				page,
				section,
				locale: 'ro',
				payload,
				updatedBy: null
			})
			.onConflictDoUpdate({
				target: [siteSection.page, siteSection.section, siteSection.locale],
				set: { payload, updatedAt: new Date() }
			});
	}

	await client.end();
	console.log(`Seeded ${sections.length} sections.`);
}

seed().catch((e) => {
	console.error(e);
	process.exit(1);
});
