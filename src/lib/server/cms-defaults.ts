/**
 * Default section payloads when no row exists in site_section.
 * Uses Romanian text to match the public page fallbacks (paraglide / hardcoded).
 */

type Locale = 'ro' | 'en';

const HOME_DEFAULTS_RO: Record<string, Record<string, unknown>> = {
	intro: {
		heading: 'Educație integrată pentru fiecare copil',
		body: 'Kogaion Gifted Academy concepe și dezvoltă programe educaționale integrate, diferențiate pe nevoile de învățare ale fiecărei grupe de vârstă — de la anii timpurii până la liceu.'
	},
	hero_label: {
		text: 'Kogaion Gifted Academy'
	},
	stats: {
		card1: { label: 'Susținere', number: '130+', text: 'familii implicate anual' },
		card2: { label: 'Experiență', number: '10+ ani', text: 'programe integrate Kogaion' },
		card3: { label: 'Comunitate', number: '3–17', text: 'ani, programe adaptate pe etape' }
	},
	featured_heading: {
		title: 'Programe recomandate'
	},
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
};

const ABOUT_DEFAULTS_RO: Record<string, Record<string, unknown>> = {
	hero: {
		backgroundImage: '/media/uploads/home/hero-poster.webp',
		label: 'Kogaion Gifted Academy',
		title: 'Despre noi',
		tagline:
			'Curiozitatea devine competență: educație integrată, mentorat și programe pentru copii 3–18 ani (afterschool București, tabere, familii).',
		subline:
			'Construim încredere și autonomie, cu structură clară și respect pentru ritmul copilului tău — nu doar „rezultate pe hârtie”.',
		ctaLabel: 'Descopera programele noastre'
	},
	letter: {
		greeting: '',
		p1: '',
		p2: '',
		p3: '',
		visionTitle: '',
		visionBody: ''
	},
	mission: {
		title: 'Misiunea noastră',
		bullet1:
			'Transformăm potențialul în parcurs: obiective clare și pași măsurabili, co-create cu familia ta.',
		bullet2:
			'Apărăm educația integrată și individualizată: sensul învățării înaintea etichetelor, fără presiune inutilă.',
		bullet3:
			'Rămânem reper de încredere: programe validate în timp, mentori dedicați, comunitate unde copiii exersează curajul de a încerca.'
	},
	age_cards: {
		title: 'Programe pentru fiecare etapă de creștere',
		intro:
			'Alegem formatele potrivite vârstei și vieții voastre: afterschool și enrichment în București, tabere în natură și experiențe pentru familii.',
		cards: [
			{
				title: 'Anii timpurii',
				age: '3-6',
				image: '/media/uploads/about/age-3-6.webp',
				ctaLabel: 'Descopera programele noastre',
				ctaLink: '/programe'
			},
			{
				title: 'Scoala primara',
				age: '7-12',
				image: '/media/uploads/about/age-7-12.webp',
				ctaLabel: 'Descopera programele noastre',
				ctaLink: '/programe'
			},
			{
				title: 'Gimnaziu / Liceu',
				age: '13-18',
				image: '/media/uploads/about/age-13-18.webp',
				ctaLabel: 'Descopera programele noastre',
				ctaLink: '/programe'
			}
		]
	},
	cta_section: {
		programsTitle: 'Descopera programele noastre',
		programsIntro:
			'Programele Kogaion sustin nevoile de dezvoltare ale copiilor in fiecare etapa de varsta.',
		mentorsTitle: 'Fa cunostinta cu mentorii nostri',
		mentorsLead:
			'Mentorii nostri sunt specializati in diverse domenii si ghideaza fiecare copil in ritmul sau.',
		connect: 'Conecteaza-te cu comunitatea Kogaion'
	}
};

export function getDefaultSectionPayload(
	page: string,
	section: string,
	locale: Locale
): Record<string, unknown> | null {
	if (locale !== 'ro') {
		// EN could be added later; for now only RO defaults
		return null;
	}
	if (page === 'home') {
		return HOME_DEFAULTS_RO[section] ?? null;
	}
	if (page === 'about') {
		return ABOUT_DEFAULTS_RO[section] ?? null;
	}
	return null;
}
