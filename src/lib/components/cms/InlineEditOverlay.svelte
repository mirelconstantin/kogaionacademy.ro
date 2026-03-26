<script lang="ts">
	import { focusTrap } from '$lib/actions/focus-trap';
	import { dialogBehavior } from '$lib/actions/dialog-behavior';
	import { browser } from '$app/environment';
	import { invalidate, invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import MediaPicker from '$lib/components/cms/MediaPicker.svelte';
	import Pencil from '@lucide/svelte/icons/pencil';
	import X from '@lucide/svelte/icons/x';
	import { hideEditIcons } from '$lib/stores/hide-edit-icons';
	import { adminBarLayoutHeightPx } from '$lib/stores/admin-bar-layout';

	type CmsType = 'mentor' | 'program' | 'program_section' | 'section' | 'blog' | 'hero';

	type SectionField = { key: string; label: string; textarea?: boolean };

	const PAGE_LABELS: Record<string, string> = {
		home: 'Pagina principală',
		about: 'Despre noi',
		programs: 'Programe',
		mentors: 'Mentori',
		contact: 'Contact'
	};
	const SECTION_LABELS: Record<string, string> = {
		hero: 'Hero',
		hero_label: 'Etichetă hero',
		intro: 'Intro',
		letter: 'Scrisoare',
		timeline: 'Timeline',
		mission: 'Misiune',
		integrated: 'Integrat',
		transdisciplinary: 'Transdisciplinar',
		skills: 'Competențe',
		founders: 'Fondatori',
		age_cards: 'Carduri vârstă',
		cta_section: 'CTA',
		stats: 'Statistici',
		featured_heading: 'Titlu programe evidențiate',
		mentors_preview: 'Mentori preview',
		why_us: 'De ce Kogaion?',
		about_teaser: 'Despre (teaser)',
		programs_section: 'Programe',
		blog_teaser: 'Blog (teaser)',
		contact_cta: 'Contact CTA',
		cta: 'CTA'
	};

	const SECTION_FIELDS: Record<string, SectionField[]> = {
		home_intro: [
			{ key: 'heading', label: 'Titlul principal (intro)', textarea: false },
			{ key: 'body', label: 'Paragraful de intro', textarea: true }
		],
		home_hero_label: [{ key: 'text', label: 'Eticheta de deasupra titlului' }],
		home_stats: [
			{ key: 'card1.label', label: 'Primul card – Etichetă (ex. Susținere)' },
			{ key: 'card1.number', label: 'Primul card – Număr afișat (ex. 130+)' },
			{ key: 'card1.text', label: 'Primul card – Text explicativ' },
			{ key: 'card2.label', label: 'Al doilea card – Etichetă' },
			{ key: 'card2.number', label: 'Al doilea card – Număr afișat' },
			{ key: 'card2.text', label: 'Al doilea card – Text' },
			{ key: 'card3.label', label: 'Al treilea card – Etichetă' },
			{ key: 'card3.number', label: 'Al treilea card – Număr afișat' },
			{ key: 'card3.text', label: 'Al treilea card – Text' }
		],
		home_featured_heading: [{ key: 'title', label: 'Titlul secțiunii programe' }],
		home_mentors_preview: [
			{ key: 'title', label: 'Titlul secțiunii mentori' },
			{ key: 'lead', label: 'Introducere / lead', textarea: true },
			{ key: 'ctaLabel', label: 'Buton (text)' },
			{ key: 'ctaLink', label: 'Buton (link)' }
		],
		home_why_us: [
			{ key: 'title', label: 'Titlu' },
			{ key: 'lead', label: 'Lead', textarea: true },
			{ key: 'item1.title', label: 'Card 1 – Titlu' },
			{ key: 'item1.text', label: 'Card 1 – Text', textarea: true },
			{ key: 'item2.title', label: 'Card 2 – Titlu' },
			{ key: 'item2.text', label: 'Card 2 – Text', textarea: true },
			{ key: 'item3.title', label: 'Card 3 – Titlu' },
			{ key: 'item3.text', label: 'Card 3 – Text', textarea: true }
		],
		home_about_teaser: [
			{ key: 'title', label: 'Titlu' },
			{ key: 'body', label: 'Body', textarea: true },
			{ key: 'ctaLabel', label: 'Buton (text)' },
			{ key: 'ctaLink', label: 'Buton (link)' }
		],
		home_programs_section: [
			{ key: 'title', label: 'Titlu' },
			{ key: 'lead', label: 'Lead', textarea: true },
			{ key: 'ctaLabel', label: 'Buton (text)' }
		],
		home_blog_teaser: [
			{ key: 'title', label: 'Titlu' },
			{ key: 'lead', label: 'Lead', textarea: true },
			{ key: 'ctaLabel', label: 'Buton (text)' },
			{ key: 'ctaLink', label: 'Buton (link)' }
		],
		home_contact_cta: [
			{ key: 'title', label: 'Titlu' },
			{ key: 'body', label: 'Body', textarea: true },
			{ key: 'ctaLabel', label: 'Buton (text)' },
			{ key: 'ctaLink', label: 'Buton (link)' }
		],
		about_hero: [
			{ key: 'backgroundImage', label: 'Imagine fundal' },
			{ key: 'label', label: 'Eticheta de deasupra titlului' },
			{ key: 'title', label: 'Titlul principal pagină Despre' },
			{ key: 'tagline', label: 'Sloganul (sub titlu)' },
			{ key: 'subline', label: 'Textul sub slogan', textarea: true },
			{ key: 'ctaLabel', label: 'Textul butonului principal' }
		],
		about_letter: [
			{ key: 'greeting', label: 'Salutul din scrisoare' },
			{ key: 'p1', label: 'Primul paragraf din scrisoare', textarea: true },
			{ key: 'p2', label: 'Al doilea paragraf', textarea: true },
			{ key: 'p3', label: 'Al treilea paragraf', textarea: true },
			{ key: 'visionTitle', label: 'Titlul „Viziunea noastră”' },
			{ key: 'visionBody', label: 'Paragraful din „Viziunea noastră”', textarea: true }
		],
		about_timeline: [
			{ key: 'title', label: 'Titlul secțiunii Timeline' },
			{ key: 'intro', label: 'Scurtă descriere sub titlu', textarea: true },
			{ key: 'items.0.year', label: 'Anul primei etape (ex. 2013)' },
			{ key: 'items.0.title', label: 'Titlul primei etape' },
			{ key: 'items.0.text', label: 'Textul primei etape', textarea: true },
			{ key: 'items.1.year', label: 'Anul celei de-a doua etape' },
			{ key: 'items.1.title', label: 'Titlul celei de-a doua etape' },
			{ key: 'items.1.text', label: 'Textul celei de-a doua etape', textarea: true },
			{ key: 'items.2.year', label: 'Anul celei de-a treia etape' },
			{ key: 'items.2.title', label: 'Titlul celei de-a treia etape' },
			{ key: 'items.2.text', label: 'Textul celei de-a treia etape', textarea: true }
		],
		about_mission: [
			{ key: 'title', label: 'Titlul secțiunii Misiune' },
			{ key: 'bullet1', label: 'Primul punct al misiunii', textarea: true },
			{ key: 'bullet2', label: 'Al doilea punct', textarea: true },
			{ key: 'bullet3', label: 'Al treilea punct', textarea: true }
		],
		about_integrated: [
			{ key: 'title', label: 'Titlu' },
			{ key: 'intro', label: 'Intro', textarea: true },
			{ key: 'items.0', label: 'Item 1' },
			{ key: 'items.1', label: 'Item 2' },
			{ key: 'items.2', label: 'Item 3' },
			{ key: 'items.3', label: 'Item 4' },
			{ key: 'items.4', label: 'Item 5' }
		],
		about_transdisciplinary: [
			{ key: 'title', label: 'Titlu' },
			{ key: 'body', label: 'Text', textarea: true }
		],
		about_skills: [
			{ key: 'intro', label: 'Intro', textarea: true },
			{ key: 'skills.0', label: 'Competență 1' },
			{ key: 'skills.1', label: 'Competență 2' },
			{ key: 'skills.2', label: 'Competență 3' },
			{ key: 'skills.3', label: 'Competență 4' },
			{ key: 'skills.4', label: 'Competență 5' },
			{ key: 'skills.5', label: 'Competență 6' },
			{ key: 'skills.6', label: 'Competență 7' },
			{ key: 'skills.7', label: 'Competență 8' },
			{ key: 'skills.8', label: 'Competență 9' }
		],
		about_founders: [
			{ key: 'title', label: 'Titlu' },
			{ key: 'intro', label: 'Intro', textarea: true }
		],
		about_age_cards: [
			{ key: 'title', label: 'Titlu' },
			{ key: 'intro', label: 'Intro', textarea: true },
			{ key: 'cards.0.title', label: 'Card 1 – Titlu' },
			{ key: 'cards.0.age', label: 'Card 1 – Vârstă' },
			{ key: 'cards.0.image', label: 'Card 1 – Imagine' },
			{ key: 'cards.0.ctaLabel', label: 'Card 1 – Text buton' },
			{ key: 'cards.0.ctaLink', label: 'Card 1 – Link buton' },
			{ key: 'cards.1.title', label: 'Card 2 – Titlu' },
			{ key: 'cards.1.age', label: 'Card 2 – Vârstă' },
			{ key: 'cards.1.image', label: 'Card 2 – Imagine' },
			{ key: 'cards.1.ctaLabel', label: 'Card 2 – Text buton' },
			{ key: 'cards.1.ctaLink', label: 'Card 2 – Link buton' },
			{ key: 'cards.2.title', label: 'Card 3 – Titlu' },
			{ key: 'cards.2.age', label: 'Card 3 – Vârstă' },
			{ key: 'cards.2.image', label: 'Card 3 – Imagine' },
			{ key: 'cards.2.ctaLabel', label: 'Card 3 – Text buton' },
			{ key: 'cards.2.ctaLink', label: 'Card 3 – Link buton' }
		],
		about_cta_section: [
			{ key: 'programsTitle', label: 'Titlu programe' },
			{ key: 'programsIntro', label: 'Intro programe', textarea: true },
			{ key: 'mentorsTitle', label: 'Titlu mentori' },
			{ key: 'mentorsLead', label: 'Text mentori', textarea: true },
			{ key: 'connect', label: 'Text conectare' }
		],
		programs_hero: [
			{ key: 'title', label: 'Titlu' },
			{ key: 'intro', label: 'Intro', textarea: true }
		],
		mentors_hero: [
			{ key: 'title', label: 'Titlu' },
			{ key: 'intro', label: 'Intro', textarea: true }
		],
		mentors_cta: [
			{ key: 'title', label: 'Titlu' },
			{ key: 'body', label: 'Text', textarea: true },
			{ key: 'buttonLabel', label: 'Text buton' }
		],
		contact_hero: [
			{ key: 'title', label: 'Titlu' },
			{ key: 'intro', label: 'Intro', textarea: true }
		]
	};

	const BLOG_FIELD_LABELS: Record<string, string> = {
		title: 'Titlu',
		excerpt: 'Rezumat',
		featuredImage: 'Imagine reprezentativă',
		body: 'Conținut'
	};

	/** Etichete secțiuni program (pagina de detaliu). */
	const PROGRAM_SECTION_LABELS: Record<string, string> = {
		hero_highlights: 'Elemente hero',
		hero_cta: 'Butoane CTA hero',
		curriculum_areas: 'Arii curriculum',
		packages: 'Pachete',
		extracurricular: 'Extracurricular',
		benefits_family: 'Beneficii familie',
		benefits_main: 'Beneficii principale',
		benefits_secondary: 'Beneficii secundare',
		transport: 'Transport',
		menu: 'Meniu',
		location: 'Locație',
		testimonials: 'Testimoniale',
		enrollment: 'Înscriere',
		intro: 'Intro',
		gallery: 'Galerie foto'
	};

	type ProgramFieldKind = 'text' | 'textarea' | 'stringArray' | 'image' | 'select' | 'number';
	type ProgramSectionField = {
		key: string;
		label: string;
		kind?: ProgramFieldKind;
		rows?: number;
		options?: { value: string; label: string }[];
	};

	function getObjectArray(value: unknown): Record<string, unknown>[] {
		if (!Array.isArray(value)) return [];
		return value.filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null);
	}

	function getStringArray(value: unknown): string[] {
		if (!Array.isArray(value)) return [];
		return value.map((v) => String(v ?? ''));
	}

	function getProgramSectionFields(section: string, payload: Record<string, unknown>): ProgramSectionField[] {
		const fields: ProgramSectionField[] = [];
		switch (section) {
			case 'hero_highlights': {
				const items = getStringArray(payload.items);
				const count = Math.max(items.length, 1);
				for (let i = 0; i < count; i++) fields.push({ key: `items.${i}`, label: `Element ${i + 1}` });
				return fields;
			}
			case 'hero_cta': {
				const buttons = getObjectArray(payload.buttons);
				buttons.forEach((_, i) => {
					fields.push({ key: `buttons.${i}.label`, label: `Buton ${i + 1} – text` });
					fields.push({
						key: `buttons.${i}.type`,
						label: `Buton ${i + 1} – tip`,
						kind: 'select',
						options: [
							{ value: 'tel', label: 'Telefon' },
							{ value: 'link', label: 'Link' }
						]
					});
					fields.push({ key: `buttons.${i}.value`, label: `Buton ${i + 1} – număr telefon` });
					fields.push({ key: `buttons.${i}.href`, label: `Buton ${i + 1} – link` });
				});
				return fields;
			}
			case 'intro': {
				const blocks = getObjectArray(payload.blocks);
				const count = Math.max(blocks.length, 1);
				for (let i = 0; i < count; i++) {
					fields.push({ key: `blocks.${i}.body`, label: `Bloc ${i + 1} – text`, kind: 'textarea', rows: 4 });
				}
				fields.push({
					key: 'videoBetweenBlocks.provider',
					label: 'Video între blocuri – platformă',
					kind: 'select',
					options: [
						{ value: 'youtube', label: 'YouTube' },
						{ value: 'vimeo', label: 'Vimeo' }
					]
				});
				fields.push({ key: 'videoBetweenBlocks.videoId', label: 'Video între blocuri – Video ID' });
				fields.push({ key: 'videoBetweenBlocks.title', label: 'Video între blocuri – titlu' });
				fields.push({ key: 'imageBetweenBlocks', label: 'Imagine între blocuri', kind: 'image' });
				return fields;
			}
			case 'curriculum_areas': {
				fields.push({ key: 'title', label: 'Titlu secțiune' });
				const areas = getObjectArray(payload.areas);
				const count = Math.max(areas.length, 1);
				for (let i = 0; i < count; i++) fields.push({ key: `areas.${i}.title`, label: `Arie ${i + 1}` });
				return fields;
			}
			case 'packages': {
				fields.push({ key: 'title', label: 'Titlu' });
				fields.push({ key: 'note', label: 'Notă', kind: 'textarea', rows: 3 });
				const packages = getObjectArray(payload.packages);
				packages.forEach((_, i) => {
					fields.push({ key: `packages.${i}.title`, label: `Pachet ${i + 1} – titlu` });
					fields.push({
						key: `packages.${i}.items`,
						label: `Pachet ${i + 1} – elemente (câte unul pe linie)`,
						kind: 'stringArray',
						rows: 4
					});
				});
				return fields;
			}
			case 'extracurricular': {
				fields.push({ key: 'title', label: 'Titlu' });
				fields.push({ key: 'methods', label: 'Metode', kind: 'textarea', rows: 4 });
				const groups = getObjectArray(payload.groups);
				groups.forEach((_, i) => {
					fields.push({ key: `groups.${i}.title`, label: `Grup ${i + 1} – titlu` });
					fields.push({ key: `groups.${i}.subtitle`, label: `Grup ${i + 1} – subtitlu` });
					fields.push({
						key: `groups.${i}.items`,
						label: `Grup ${i + 1} – elemente (câte unul pe linie)`,
						kind: 'stringArray',
						rows: 4
					});
				});
				return fields;
			}
			case 'benefits_family':
			case 'benefits_main':
			case 'benefits_secondary': {
				fields.push({ key: 'title', label: 'Titlu' });
				const items = getStringArray(payload.items);
				const count = Math.max(items.length, 1);
				for (let i = 0; i < count; i++) fields.push({ key: `items.${i}`, label: `Bullet ${i + 1}` });
				fields.push({ key: 'note', label: 'Notă', kind: 'textarea', rows: 3 });
				fields.push({ key: 'other', label: 'Subtitlu listă secundară' });
				const otherItems = getStringArray(payload.otherItems);
				for (let i = 0; i < otherItems.length; i++) fields.push({ key: `otherItems.${i}`, label: `Alt bullet ${i + 1}` });
				if (section === 'benefits_main') fields.push({ key: 'image', label: 'Imagine secțiune', kind: 'image' });
				return fields;
			}
			case 'transport': {
				fields.push({ key: 'title', label: 'Titlu' });
				fields.push({ key: 'body', label: 'Text', kind: 'textarea', rows: 5 });
				fields.push({ key: 'contact', label: 'Contact (nume + telefon)' });
				return fields;
			}
			case 'menu': {
				fields.push({ key: 'title', label: 'Titlu' });
				fields.push({ key: 'body', label: 'Text', kind: 'textarea', rows: 5 });
				fields.push({ key: 'note', label: 'Notă', kind: 'textarea', rows: 3 });
				return fields;
			}
			case 'location': {
				fields.push({ key: 'title', label: 'Titlu' });
				fields.push({ key: 'subtitle', label: 'Subtitlu' });
				fields.push({ key: 'body', label: 'Text', kind: 'textarea', rows: 5 });
				const amenities = getStringArray(payload.amenities);
				const count = Math.max(amenities.length, 1);
				for (let i = 0; i < count; i++) fields.push({ key: `amenities.${i}`, label: `Facilitate ${i + 1}` });
				fields.push({ key: 'closing', label: 'Text final', kind: 'textarea', rows: 3 });
				fields.push({ key: 'image', label: 'Imagine locație', kind: 'image' });
				const images = getStringArray(payload.images);
				const imageCount = Math.max(images.length, 1);
				for (let i = 0; i < imageCount; i++) {
					fields.push({ key: `images.${i}`, label: `Imagine grilă ${i + 1}`, kind: 'image' });
				}
				fields.push({ key: 'mapEmbedUrl', label: 'Google Maps embed URL', kind: 'textarea', rows: 3 });
				return fields;
			}
			case 'testimonials': {
				fields.push({ key: 'title', label: 'Titlu' });
				const items = getObjectArray(payload.items);
				items.forEach((_, i) => {
					fields.push({
						key: `items.${i}.provider`,
						label: `Testimonial ${i + 1} – platformă`,
						kind: 'select',
						options: [
							{ value: 'youtube', label: 'YouTube' },
							{ value: 'vimeo', label: 'Vimeo' }
						]
					});
					fields.push({ key: `items.${i}.videoId`, label: `Testimonial ${i + 1} – video ID` });
					fields.push({ key: `items.${i}.title`, label: `Testimonial ${i + 1} – titlu` });
				});
				return fields;
			}
			case 'enrollment': {
				fields.push({ key: 'title', label: 'Titlu' });
				fields.push({ key: 'intro', label: 'Intro', kind: 'textarea', rows: 3 });
				const steps = getObjectArray(payload.steps);
				steps.forEach((_, i) => {
					fields.push({ key: `steps.${i}.label`, label: `Pas ${i + 1}` });
				});
				fields.push({ key: 'contactNote', label: 'Notă contact', kind: 'textarea', rows: 3 });
				const buttons = getObjectArray(payload.buttons).length
					? getObjectArray(payload.buttons)
					: [
							{ label: 'Sună', type: 'tel', value: '0720529398' },
							{ label: 'Cere detalii', type: 'link', href: '/contact' },
							{ label: 'Formular de înscriere', type: 'link', href: '/contact' }
						];
				buttons.forEach((_, i) => {
					fields.push({ key: `buttons.${i}.label`, label: `Buton ${i + 1} – text` });
					fields.push({
						key: `buttons.${i}.type`,
						label: `Buton ${i + 1} – tip`,
						kind: 'select',
						options: [
							{ value: 'tel', label: 'Telefon' },
							{ value: 'link', label: 'Link' }
						]
					});
					fields.push({ key: `buttons.${i}.value`, label: `Buton ${i + 1} – număr telefon` });
					fields.push({ key: `buttons.${i}.href`, label: `Buton ${i + 1} – link` });
				});
				return fields;
			}
			case 'gallery': {
				fields.push({ key: 'title', label: 'Titlu galerie' });
				const images = getObjectArray(payload.images);
				images.forEach((_, i) => {
					fields.push({ key: `images.${i}.url`, label: `Imagine ${i + 1}`, kind: 'image' });
					fields.push({ key: `images.${i}.alt`, label: `Imagine ${i + 1} – alt text` });
				});
				return fields;
			}
			default:
				return fields;
		}
	}

	function getProgramSectionFieldValue(
		section: string,
		key: string,
		payload: Record<string, unknown>
	): string {
		if (section === 'benefits_main' && key === 'image') {
			const direct = getAtPath(payload, key);
			if (direct) return direct;
			const fromDom = (modalSourceElement?.querySelector('img') as HTMLImageElement | null)?.src ?? '';
			return normalizeAssetUrl(fromDom);
		}
		if (section === 'intro' && key === 'imageBetweenBlocks') {
			const direct = getAtPath(payload, key);
			if (direct) return direct;
			const legacySnakeCase = getAtPath(payload, 'image_between_blocks');
			if (legacySnakeCase) return legacySnakeCase;
			const fromDom = (modalSourceElement?.querySelector('img') as HTMLImageElement | null)?.src ?? '';
			return normalizeAssetUrl(fromDom);
		}
		if (section === 'intro' && key === 'videoBetweenBlocks.videoId') {
			const direct = getAtPath(payload, key);
			if (direct) return direct;
			const iframeSrc = (modalSourceElement?.querySelector('iframe') as HTMLIFrameElement | null)?.src ?? '';
			if (!iframeSrc) return '';
			const youtubeMatch = iframeSrc.match(/(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)([^?&/]+)/i);
			if (youtubeMatch?.[1]) return youtubeMatch[1];
			const vimeoMatch = iframeSrc.match(/vimeo\.com\/video\/(\d+)/i);
			if (vimeoMatch?.[1]) return vimeoMatch[1];
			return '';
		}
		if (section === 'intro' && key === 'videoBetweenBlocks.provider') {
			const direct = getAtPath(payload, key);
			if (direct) return direct;
			const iframeSrc = (modalSourceElement?.querySelector('iframe') as HTMLIFrameElement | null)?.src ?? '';
			if (iframeSrc.includes('vimeo.com')) return 'vimeo';
			return 'youtube';
		}
		if (section === 'intro' && key === 'videoBetweenBlocks.title') {
			const direct = getAtPath(payload, key);
			if (direct) return direct;
			return 'Video program';
		}
		if (section === 'location' && key === 'image') {
			const direct = getAtPath(payload, key);
			if (direct) return direct;
			const fromDom = (modalSourceElement?.querySelector('img') as HTMLImageElement | null)?.src ?? '';
			return normalizeAssetUrl(fromDom);
		}
		if (section === 'location' && key === 'mapEmbedUrl') {
			const direct = getAtPath(payload, key);
			if (direct) return direct;
			const fromDom = (modalSourceElement?.querySelector('iframe') as HTMLIFrameElement | null)?.src ?? '';
			return fromDom;
		}
		if (section === 'enrollment' && key.startsWith('buttons.')) {
			const current = getAtPath(payload, key);
			if (current) return current;
			const idxMatch = key.match(/^buttons\.(\d+)\.(label|type|value|href)$/);
			if (!idxMatch) return '';
			const idx = Number(idxMatch[1]);
			const prop = idxMatch[2];
			const defaults = [
				{ label: 'Sună', type: 'tel', value: '0720529398', href: '' },
				{ label: 'Cere detalii', type: 'link', value: '', href: '/contact' },
				{ label: 'Formular de înscriere', type: 'link', value: '', href: '/contact' }
			];
			return String(defaults[idx]?.[prop as 'label' | 'type' | 'value' | 'href'] ?? '');
		}
		return getAtPath(payload, key);
	}

	function syncProgramSectionForm(section: string, payload: Record<string, unknown>) {
		modalProgramSectionPayload = JSON.parse(JSON.stringify(payload));
		const fields = getProgramSectionFields(section, payload);
		programSectionFields = fields;
		const nextFormData: Record<string, string> = {};
		for (const f of fields) {
			if (f.kind === 'stringArray') {
				const raw = getRawAtPath(payload, f.key);
				nextFormData[f.key] = Array.isArray(raw) ? raw.map((x) => String(x ?? '')).join('\n') : '';
			} else {
				nextFormData[f.key] = getProgramSectionFieldValue(section, f.key, payload);
			}
		}
		formData = nextFormData;
	}

	function addEnrollmentStep() {
		if (modalSection !== 'enrollment') return;
		const payload = JSON.parse(JSON.stringify(modalProgramSectionPayload ?? {})) as Record<string, unknown>;
		const steps = getObjectArray(payload.steps);
		steps.push({ order: steps.length + 1, label: '' });
		payload.steps = steps;
		syncProgramSectionForm('enrollment', payload);
	}

	function removeEnrollmentStep(index: number) {
		if (modalSection !== 'enrollment') return;
		const payload = JSON.parse(JSON.stringify(modalProgramSectionPayload ?? {})) as Record<string, unknown>;
		const steps = getObjectArray(payload.steps).filter((_, i) => i !== index);
		payload.steps = steps;
		syncProgramSectionForm('enrollment', payload);
	}

	function addEnrollmentButton() {
		if (modalSection !== 'enrollment') return;
		const payload = JSON.parse(JSON.stringify(modalProgramSectionPayload ?? {})) as Record<string, unknown>;
		const buttons = getObjectArray(payload.buttons);
		if (!buttons.length) {
			buttons.push(
				{ label: 'Sună', type: 'tel', value: '0720529398', href: '' },
				{ label: 'Cere detalii', type: 'link', value: '', href: '/contact' },
				{ label: 'Formular de înscriere', type: 'link', value: '', href: '/contact' }
			);
		}
		buttons.push({ label: '', type: 'link', href: '/contact', value: '' });
		payload.buttons = buttons;
		syncProgramSectionForm('enrollment', payload);
	}

	function removeEnrollmentButton(index: number) {
		if (modalSection !== 'enrollment') return;
		const payload = JSON.parse(JSON.stringify(modalProgramSectionPayload ?? {})) as Record<string, unknown>;
		const buttons = getObjectArray(payload.buttons).filter((_, i) => i !== index);
		payload.buttons = buttons;
		syncProgramSectionForm('enrollment', payload);
	}

	const HERO_FIELD_LABELS: Record<string, string> = {
		ctaPrimaryLabel: 'Buton principal (text)',
		ctaPrimaryLink: 'Buton principal (link)',
		ctaSecondaryLabel: 'Buton secundar (text)',
		ctaSecondaryLink: 'Buton secundar (link)',
		videoUrl: 'URL video',
		posterUrl: 'URL poster'
	};

	function getAtPath(obj: Record<string, unknown>, path: string): string {
		const v = getRawAtPath(obj, path);
		return v != null ? String(v) : '';
	}

	function getRawAtPath(obj: Record<string, unknown>, path: string): unknown {
		const parts = path.split('.');
		let cur: unknown = obj;
		for (const p of parts) {
			if (cur == null || (typeof cur !== 'object' && !Array.isArray(cur))) return undefined;
			const num = parseInt(p, 10);
			cur = Array.isArray(cur) ? cur[Number.isNaN(num) ? 0 : num] : (cur as Record<string, unknown>)[p];
		}
		return cur;
	}

	function normalizeAssetUrl(url: string): string {
		const trimmed = url.trim();
		if (!trimmed) return '';
		if (trimmed.startsWith('/')) return trimmed;
		try {
			const parsed = new URL(trimmed);
			const normalized = `${parsed.pathname}${parsed.search}` || trimmed;
			return normalized.startsWith('/') ? normalized : trimmed;
		} catch {
			return trimmed;
		}
	}

	function setAtPath(obj: Record<string, unknown>, path: string, value: string | unknown): void {
		const parts = path.split('.');
		let cur: Record<string, unknown> | unknown[] = obj;
		for (let i = 0; i < parts.length - 1; i++) {
			const p = parts[i];
			const nextKey = parts[i + 1];
			const nextIsNum = /^\d+$/.test(nextKey);
			const idx = Array.isArray(cur) ? parseInt(p, 10) : null;
			if (Array.isArray(cur)) {
				const arrIndex = idx != null && !Number.isNaN(idx) ? idx : 0;
				if (cur[arrIndex] == null) cur[arrIndex] = nextIsNum ? [] : {};
				cur = cur[arrIndex] as Record<string, unknown> | unknown[];
			} else {
				if (!(p in (cur as Record<string, unknown>)) || (cur as Record<string, unknown>)[p] == null) {
					(cur as Record<string, unknown>)[p] = nextIsNum ? [] : {};
				}
				cur = (cur as Record<string, unknown>)[p] as Record<string, unknown> | unknown[];
			}
		}
		const last = parts[parts.length - 1];
		const lastNum = parseInt(last, 10);
		if (Array.isArray(cur)) {
			cur[Number.isNaN(lastNum) ? 0 : lastNum] = value;
		} else {
			(cur as Record<string, unknown>)[last] = value;
		}
	}

	let { isEditor = false } = $props();

	let hoverTarget = $state<{
		el: Element;
		type: CmsType;
		id: string;
		rect: DOMRect;
		page?: string;
		section?: string;
		field?: string;
		fieldGroup?: string[];
		heroLocale?: string;
		programId?: string;
	} | null>(null);
	let inlineEdit = $state<{
		page?: string;
		section?: string;
		locale?: string;
		blogId?: number;
		heroLocale?: string;
		field: string;
		label: string;
		rect: DOMRect;
		fieldGroup?: string[];
	} | null>(null);
	let inlineValue = $state('');
	let inlineGroupValues = $state<Record<string, string>>({});
	let inlineSaving = $state(false);
	let inlineError = $state<string | null>(null);
	let modalOpen = $state(false);
	let modalType = $state<CmsType | null>(null);
	let modalId = $state<string | null>(null);
	let modalPage = $state<string | null>(null);
	let modalSection = $state<string | null>(null);
	let modalLocale = $state<string>('ro');
	let modalSourceElement = $state<Element | null>(null);
	let formData = $state<Record<string, string>>({});
	let programSectionFields = $state<ProgramSectionField[]>([]);
	/** Full payload for program_section; we merge form changes into it on save to avoid overwriting arrays. */
	let modalProgramSectionPayload = $state<Record<string, unknown> | null>(null);
	let loading = $state(false);
	let saving = $state(false);
	let error = $state<string | null>(null);

	function findCmsTarget(el: Element | null): Element | null {
		if (!el) return null;
		// Prioritise specific targets so hovering a section inside a program highlights the section, not the program
		const programSectionEl = el.closest?.(
			'[data-cms-type="program_section"][data-cms-program-id][data-cms-section]'
		);
		if (programSectionEl) return programSectionEl;
		const sectionWithField = el.closest?.(
			'[data-cms-type="section"][data-cms-page][data-cms-section][data-cms-field]'
		);
		if (sectionWithField) return sectionWithField;
		const sectionWithFieldGroup = el.closest?.(
			'[data-cms-type="section"][data-cms-page][data-cms-section][data-cms-field-group]'
		);
		if (sectionWithFieldGroup) return sectionWithFieldGroup;
		const heroWithFieldGroup = el.closest?.(
			'[data-cms-type="hero"][data-cms-field-group]'
		);
		if (heroWithFieldGroup) return heroWithFieldGroup;
		const heroWithField = el.closest?.('[data-cms-type="hero"][data-cms-field]');
		if (heroWithField) return heroWithField;
		const withId = el.closest?.('[data-cms-type][data-cms-id]');
		if (withId) return withId;
		return null;
	}

	const BUTTON_WIDTH = 36;
	const BUTTON_TOP_OFFSET = 8;
	const BUTTON_HEIGHT = 36;
	/** Nav min-h-20 (80px) + measured admin bar + margin; falls back if store not yet updated */
	const NAV_BAR_PX = 80;
	const CHROME_MARGIN = 12;
	let adminBarChromePx = $state(0);
	$effect(() => {
		const unsub = adminBarLayoutHeightPx.subscribe((v) => {
			adminBarChromePx = v;
		});
		return unsub;
	});
	const minEditButtonTop = $derived(NAV_BAR_PX + adminBarChromePx + CHROME_MARGIN);
	const BUTTON_MARGIN = 16;

	let viewportW = $state(browser ? window.innerWidth : 0);
	let viewportH = $state(browser ? window.innerHeight : 0);
	$effect(() => {
		if (!browser) return;
		viewportW = window.innerWidth;
		viewportH = window.innerHeight;
		const onResize = () => {
			viewportW = window.innerWidth;
			viewportH = window.innerHeight;
			scheduleRectUpdate();
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	// Update overlay rect when the hover target's size/position changes (e.g. layout shifts, images loading)
	$effect(() => {
		const target = hoverTarget?.el;
		if (!browser || !target) return;
		const ro = new ResizeObserver(() => scheduleRectUpdate());
		ro.observe(target);
		return () => ro.disconnect();
	});

	/** Buton poziționat în colțul dreapta-sus al secțiunii */
	const editButtonStyle = $derived.by((): { left: number; top: number } | null => {
		if (!hoverTarget || viewportW <= 0 || viewportH <= 0) return null;
		const r = hoverTarget.rect;
		const left = Math.max(BUTTON_MARGIN, Math.min(r.right - BUTTON_WIDTH - BUTTON_TOP_OFFSET, viewportW - BUTTON_WIDTH - BUTTON_MARGIN));
		const top = Math.max(minEditButtonTop, Math.min(r.top + BUTTON_TOP_OFFSET, viewportH - BUTTON_HEIGHT - BUTTON_MARGIN));
		return { left, top };
	});

	function getButtonRect(rect: DOMRect): { left: number; top: number } {
		return {
			left: rect.right - BUTTON_WIDTH - BUTTON_TOP_OFFSET,
			top: Math.max(rect.top + BUTTON_TOP_OFFSET, minEditButtonTop)
		};
	}

	function isInButtonZone(clientX: number, clientY: number, rect: DOMRect): boolean {
		const { left: btnLeft, top: btnTop } = getButtonRect(rect);
		return (
			clientX >= btnLeft - 12 &&
			clientX <= btnLeft + BUTTON_WIDTH + 12 &&
			clientY >= btnTop - 12 &&
			clientY <= btnTop + BUTTON_HEIGHT + 12
		);
	}

	/** Zona extinsă (secțiune + buton) – păstrăm hoverTarget când cursorul e în zonă ca să nu dispară la mișcare */
	function isInExtendedZone(clientX: number, clientY: number, rect: DOMRect): boolean {
		const { left: btnLeft, top: btnTop } = getButtonRect(rect);
		const pad = 24;
		const zoneLeft = Math.min(rect.left - pad, btnLeft - pad);
		const zoneTop = Math.min(rect.top - pad, btnTop - pad);
		const zoneRight = Math.max(rect.right + pad, btnLeft + BUTTON_WIDTH + pad);
		const zoneBottom = Math.max(rect.bottom + pad, btnTop + BUTTON_HEIGHT + pad);
		return clientX >= zoneLeft && clientX <= zoneRight && clientY >= zoneTop && clientY <= zoneBottom;
	}

	function throttle<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
		let last = 0;
		return (...args: A) => {
			const now = Date.now();
			if (now - last >= ms || last === 0) {
				last = now;
				fn(...args);
			}
		};
	}

	const MOUSEMOVE_THROTTLE_MS = 80;

	let rafId = 0;

	function refreshHoverRect() {
		if (!hoverTarget) return;
		hoverTarget = {
			...hoverTarget,
			rect: hoverTarget.el.getBoundingClientRect()
		};
	}

	function scheduleRectUpdate() {
		if (rafId !== 0) return;
		rafId = requestAnimationFrame(() => {
			refreshHoverRect();
			rafId = 0;
			// Trailing refresh after scroll/layout settles
			setTimeout(() => refreshHoverRect(), 100);
		});
	}

	function onMouseMove(e: MouseEvent) {
		if (!isEditor || !browser || $hideEditIcons) return;
		const target = findCmsTarget(document.elementFromPoint(e.clientX, e.clientY));
		if (target) {
			const type = target.getAttribute('data-cms-type') as CmsType;
			if (type === 'section') {
				const page = target.getAttribute('data-cms-page');
				const section = target.getAttribute('data-cms-section');
				const field = target.getAttribute('data-cms-field');
				const fieldGroupStr = target.getAttribute('data-cms-field-group');
				const fieldGroup =
					fieldGroupStr?.split(',').map((k) => k.trim()).filter(Boolean) ?? undefined;
				if (page && section && (field || (fieldGroup && fieldGroup.length > 0))) {
					if (hoverTarget?.el === target) return;
					hoverTarget = {
						el: target,
						type: 'section',
						id: '',
						rect: target.getBoundingClientRect(),
						page,
						section,
						field: field ?? undefined,
						fieldGroup: fieldGroup?.length ? fieldGroup : undefined
					};
					return;
				}
			} else if (type === 'blog') {
				const id = target.getAttribute('data-cms-id');
				const field = target.getAttribute('data-cms-field');
				if (id) {
					if (hoverTarget?.el === target) return;
					hoverTarget = {
						el: target,
						type: 'blog',
						id,
						rect: target.getBoundingClientRect(),
						field: field ?? undefined
					};
					return;
				}
			} else if (type === 'program_section') {
				const programId = target.getAttribute('data-cms-program-id');
				const sectionKey = target.getAttribute('data-cms-section');
				if (programId && sectionKey) {
					if (hoverTarget?.el === target) return;
					hoverTarget = {
						el: target,
						type: 'program_section',
						id: programId,
						rect: target.getBoundingClientRect(),
						programId,
						section: sectionKey
					};
					return;
				}
			} else if (type === 'hero') {
				const fieldGroupStr = target.getAttribute('data-cms-field-group');
				const fieldGroup =
					fieldGroupStr?.split(',').map((k) => k.trim()).filter(Boolean) ?? undefined;
				const field = target.getAttribute('data-cms-field');
				const heroLocale = target.getAttribute('data-cms-locale') ?? 'ro';
				if (fieldGroup?.length) {
					if (hoverTarget?.el === target) return;
					hoverTarget = {
						el: target,
						type: 'hero',
						id: '',
						rect: target.getBoundingClientRect(),
						field: undefined,
						fieldGroup,
						heroLocale
					};
					return;
				}
				if (field) {
					if (hoverTarget?.el === target) return;
					hoverTarget = {
						el: target,
						type: 'hero',
						id: '',
						rect: target.getBoundingClientRect(),
						field,
						heroLocale
					};
					return;
				}
			} else {
				const id = target.getAttribute('data-cms-id');
				if (type && id) {
					if (hoverTarget?.el === target) return;
					hoverTarget = {
						el: target,
						type,
						id,
						rect: target.getBoundingClientRect()
					};
					return;
				}
			}
		}
		// Cursor în zona extinsă (secțiune + buton) – păstrăm hoverTarget ca să nu dispară la mișcare
		if (hoverTarget && (isInButtonZone(e.clientX, e.clientY, hoverTarget.rect) || isInExtendedZone(e.clientX, e.clientY, hoverTarget.rect))) {
			hoverTarget = { ...hoverTarget, rect: hoverTarget.el.getBoundingClientRect() };
			return;
		}
		hoverTarget = null;
	}

	function onMouseLeave() {
		hoverTarget = null;
	}

	const onMouseMoveThrottled = throttle(onMouseMove, MOUSEMOVE_THROTTLE_MS);

	$effect(() => {
		if (!browser) return;
		document.addEventListener('scroll', scheduleRectUpdate, true);
		return () => {
			document.removeEventListener('scroll', scheduleRectUpdate, true);
			if (rafId !== 0) {
				cancelAnimationFrame(rafId);
				rafId = 0;
			}
		};
	});

	async function openModal() {
		if (!hoverTarget) return;
		if (
			hoverTarget.type === 'hero' &&
			hoverTarget.fieldGroup &&
			hoverTarget.fieldGroup.length > 0 &&
			hoverTarget.heroLocale
		) {
			const locale = hoverTarget.heroLocale;
			const fieldGroup = hoverTarget.fieldGroup;
			const rect = hoverTarget.rect;
			hoverTarget = null;
			inlineError = null;
			try {
				const res = await fetch(`/admin/api/cms?type=hero&locale=${encodeURIComponent(locale)}`);
				if (!res.ok) throw new Error(await res.text());
				const data = (await res.json()) as Record<string, unknown>;
				inlineGroupValues = {};
				for (const key of fieldGroup) {
					const val = data[key];
					inlineGroupValues[key] = val != null ? String(val) : '';
				}
				inlineEdit = { heroLocale: locale, field: '', label: 'Buton hero', rect, fieldGroup };
			} catch (e) {
				inlineError = e instanceof Error ? e.message : String(e);
			}
			return;
		}
		if (hoverTarget.type === 'hero' && hoverTarget.field && hoverTarget.heroLocale) {
			const locale = hoverTarget.heroLocale;
			const field = hoverTarget.field;
			const label = HERO_FIELD_LABELS[field] ?? field;
			const rect = hoverTarget.rect;
			hoverTarget = null;
			inlineError = null;
			try {
				const res = await fetch(`/admin/api/cms?type=hero&locale=${encodeURIComponent(locale)}`);
				if (!res.ok) throw new Error(await res.text());
				const data = (await res.json()) as Record<string, unknown>;
				const val = data[field];
				inlineValue = val != null ? String(val) : '';
				inlineEdit = { heroLocale: locale, field, label, rect };
			} catch (e) {
				inlineError = e instanceof Error ? e.message : String(e);
			}
			return;
		}
		if (hoverTarget.type === 'blog' && hoverTarget.field) {
			if (hoverTarget.field === 'body') {
				goto(`/admin/blog/${hoverTarget.id}`);
				hoverTarget = null;
				return;
			}
			const blogId = parseInt(hoverTarget.id, 10);
			if (Number.isNaN(blogId)) return;
			const field = hoverTarget.field;
			const label = BLOG_FIELD_LABELS[field] ?? field;
			const rect = hoverTarget.rect;
			hoverTarget = null;
			inlineError = null;
			try {
				const res = await fetch(`/admin/api/cms?type=blog&id=${blogId}`);
				if (!res.ok) throw new Error(await res.text());
				const data = (await res.json()) as Record<string, unknown>;
				const val = data[field];
				inlineValue = val != null ? String(val) : '';
				inlineEdit = { blogId, field, label, rect };
			} catch (e) {
				inlineError = e instanceof Error ? e.message : String(e);
			}
			return;
		}
		if (
			hoverTarget.type === 'section' &&
			hoverTarget.page &&
			hoverTarget.section &&
			(hoverTarget.field || (hoverTarget.fieldGroup && hoverTarget.fieldGroup.length > 0))
		) {
			const page = hoverTarget.page;
			const section = hoverTarget.section;
			const locale = hoverTarget.el.getAttribute('data-cms-locale') ?? 'ro';
			const rect = hoverTarget.rect;
			const field = hoverTarget.field;
			const fieldGroup = hoverTarget.fieldGroup;
			hoverTarget = null;
			inlineError = null;
			try {
				const res = await fetch(
					`/admin/api/cms?type=section&page=${encodeURIComponent(page)}&section=${encodeURIComponent(section)}&locale=${locale}`
				);
				if (!res.ok) throw new Error(await res.text());
				const data = await res.json();
				const p = (data.payload ?? {}) as Record<string, unknown>;
				const sectionKey = `${page}_${section}`;
				const sectionFields = SECTION_FIELDS[sectionKey] ?? [];
				if (fieldGroup && fieldGroup.length > 0) {
					inlineGroupValues = {};
					for (const key of fieldGroup) {
						inlineGroupValues[key] = getAtPath(p, key) ?? '';
					}
					inlineEdit = { page, section, locale, field: '', label: 'Grup', rect, fieldGroup };
					return;
				}
				if (field) {
					const fieldDef = sectionFields.find((f) => f.key === field);
					const label = fieldDef?.label ?? field;
					inlineValue = getAtPath(p, field);
					inlineEdit = { page, section, locale, field, label, rect };
				}
			} catch (e) {
				inlineError = e instanceof Error ? e.message : String(e);
			}
			return;
		}
		if (hoverTarget.type === 'blog') {
			goto(`/admin/blog/${hoverTarget.id}`);
			hoverTarget = null;
			return;
		}
		if (hoverTarget.type === 'program_section' && hoverTarget.programId && hoverTarget.section) {
			modalType = 'program_section';
			modalId = hoverTarget.programId;
			modalSection = hoverTarget.section;
			modalPage = null;
			modalLocale = 'ro';
			modalSourceElement = hoverTarget.el;
			modalOpen = true;
			hoverTarget = null;
			loadFormData();
			return;
		}
		modalType = hoverTarget.type;
		modalId = hoverTarget.id;
		modalPage = null;
		modalSection = null;
		modalLocale = 'ro';
		modalSourceElement = null;
		if (hoverTarget.type === 'section') {
			modalPage = hoverTarget.el.getAttribute('data-cms-page');
			modalSection = hoverTarget.el.getAttribute('data-cms-section');
			modalLocale = hoverTarget.el.getAttribute('data-cms-locale') ?? 'ro';
		}
		modalOpen = true;
		hoverTarget = null;
		loadFormData();
	}

	async function saveInline() {
		if (!inlineEdit) return;
		inlineSaving = true;
		inlineError = null;
		try {
			let payload: Record<string, unknown>;
			if (inlineEdit.fieldGroup && inlineEdit.fieldGroup.length > 0) {
				payload = {};
				for (const key of inlineEdit.fieldGroup) {
					setAtPath(payload, key, inlineGroupValues[key] ?? '');
				}
			} else {
				payload = { [inlineEdit.field]: inlineValue };
			}
			let body: Record<string, unknown>;
			if (inlineEdit.blogId != null) {
				body = { type: 'blog', id: inlineEdit.blogId, payload };
			} else if (inlineEdit.heroLocale) {
				body = { type: 'hero', locale: inlineEdit.heroLocale, payload };
			} else if (inlineEdit.page && inlineEdit.section && inlineEdit.locale) {
				body = {
					type: 'section',
					page: inlineEdit.page,
					section: inlineEdit.section,
					locale: inlineEdit.locale,
					payload
				};
			} else {
				return;
			}
			const res = await fetch('/admin/api/cms', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) throw new Error(await res.text());
			inlineEdit = null;
			inlineGroupValues = {};
			await invalidateAll();
		} catch (e) {
			inlineError = e instanceof Error ? e.message : String(e);
		} finally {
			inlineSaving = false;
		}
	}

	function closeInline() {
		inlineEdit = null;
		inlineGroupValues = {};
		inlineError = null;
	}

	async function loadFormData() {
		if (!modalType) return;
		loading = true;
		error = null;
		try {
			let url = `/admin/api/cms?type=${modalType}`;
			if (modalType === 'section' && modalPage && modalSection) {
				url += `&page=${encodeURIComponent(modalPage)}&section=${encodeURIComponent(modalSection)}&locale=${modalLocale}`;
			} else if (modalType === 'program_section' && modalId && modalSection) {
				url += `&programId=${encodeURIComponent(modalId)}&section=${encodeURIComponent(modalSection)}&locale=${modalLocale}`;
			} else if (modalId) {
				url += `&id=${modalId}`;
			}
			const res = await fetch(url);
			if (!res.ok) throw new Error(await res.text());
			const data = await res.json();
			if (modalType === 'program_section' && modalSection) {
				const p = (data.payload ?? {}) as Record<string, unknown>;
				syncProgramSectionForm(modalSection, p);
			} else if (modalType === 'section' && modalPage && modalSection) {
				programSectionFields = [];
				const p = (data.payload ?? {}) as Record<string, unknown>;
				const sectionKey = `${modalPage}_${modalSection}`;
				const fields = SECTION_FIELDS[sectionKey] ?? [];
				formData = {};
				for (const f of fields) {
					formData[f.key] = getAtPath(p, f.key);
				}
			} else if (modalType === 'mentor') {
				programSectionFields = [];
				formData = {
					nameRo: data.nameRo ?? '',
					titleRo: data.titleRo ?? '',
					bioRo: data.bioRo ?? '',
					image: data.image ?? '',
					yearJoined: data.yearJoined != null ? String(data.yearJoined) : ''
				};
			} else if (modalType === 'program' && data.program) {
				programSectionFields = [];
				const ro = data.locales?.find((l: { locale: string }) => l.locale === 'ro');
				formData = {
					slug: data.program.slug ?? '',
					image: data.program.image ?? '',
					title: ro?.title ?? '',
					description: ro?.description ?? '',
					ageRange: ro?.ageRange ?? '',
					locationText: ro?.locationText ?? '',
					datesText: ro?.datesText ?? '',
					durationText: ro?.durationText ?? ''
				};
			} else {
				programSectionFields = [];
				formData = {};
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	async function save() {
		if (!modalType) return;
		saving = true;
		error = null;
		try {
			let payload: Record<string, unknown> = {};
			if (modalType === 'mentor' && modalId) {
				payload = {
					nameRo: formData.nameRo ?? '',
					nameEn: null,
					titleRo: formData.titleRo ?? '',
					titleEn: null,
					bioRo: formData.bioRo ?? '',
					bioEn: null,
					image: formData.image || null,
					yearJoined: formData.yearJoined !== '' ? Number(formData.yearJoined) : null
				};
			} else if (modalType === 'program' && modalId) {
				payload = {
					slug: formData.slug ?? '',
					image: formData.image || null,
					locales: {
						ro: {
							title: formData.title ?? '',
							description: formData.description || null,
							ageRange: formData.ageRange || null,
							locationText: formData.locationText || null,
							datesText: formData.datesText || null,
							durationText: formData.durationText || null
						}
					}
				};
			} else if (modalType === 'section' && modalPage && modalSection) {
				const sectionKey = `${modalPage}_${modalSection}`;
				const fields = SECTION_FIELDS[sectionKey] ?? [];
				payload = {};
				for (const f of fields) {
					setAtPath(payload, f.key, formData[f.key] ?? '');
				}
			} else if (modalType === 'program_section' && modalId && modalSection) {
				const base = modalProgramSectionPayload ?? {};
				payload = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
				const fields = programSectionFields;
				for (const f of fields) {
					const v = formData[f.key] ?? '';
					if (f.kind === 'stringArray') {
						setAtPath(payload, f.key, v.split('\n').map((s) => s.trim()).filter(Boolean));
					} else if (f.kind === 'number') {
						const n = parseInt(v, 10);
						setAtPath(payload, f.key, Number.isNaN(n) ? 0 : n);
					} else {
						setAtPath(payload, f.key, v);
					}
				}
				if (modalSection === 'enrollment') {
					const steps = getObjectArray(payload.steps);
					payload.steps = steps.map((step, idx) => ({
						order: idx + 1,
						label: String(step.label ?? '')
					}));
				}
			}
			const body: Record<string, unknown> = { type: modalType, payload };
			if (modalType === 'section') {
				body.page = modalPage;
				body.section = modalSection;
				body.locale = modalLocale;
			} else if (modalType === 'program_section') {
				body.programId = parseInt(modalId ?? '0', 10);
				body.section = modalSection;
				body.locale = modalLocale;
			} else {
				body.id = parseInt(modalId ?? '0', 10);
			}
			const res = await fetch('/admin/api/cms', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) throw new Error(await res.text());
			modalOpen = false;
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	function closeModal() {
		modalOpen = false;
		error = null;
		modalProgramSectionPayload = null;
		programSectionFields = [];
		modalSourceElement = null;
	}

	const sectionFormFields = $derived(
		modalPage && modalSection ? SECTION_FIELDS[`${modalPage}_${modalSection}`] ?? [] : []
	);

	const inlineFieldTextarea = $derived.by(() => {
		if (!inlineEdit) return false;
		if (inlineEdit.heroLocale) return false;
		if (inlineEdit.blogId != null) return inlineEdit.field === 'excerpt';
		const sectionKey = `${inlineEdit.page}_${inlineEdit.section}`;
		return (SECTION_FIELDS[sectionKey] ?? []).find((f) => f.key === inlineEdit?.field)?.textarea ?? true;
	});

	const inlineIsImageField = $derived(
		inlineEdit?.field === 'featuredImage' ||
			inlineEdit?.field === 'backgroundImage' ||
			(inlineEdit?.field?.endsWith('.image') ?? false)
	);

	const INLINE_POPOVER_EST_HEIGHT = 320;
	const inlinePopoverStyle = $derived.by(() => {
		if (!inlineEdit || !browser) return '';
		const { rect } = inlineEdit;
		const topBelow = rect.bottom + 8;
		const topAbove = rect.top - INLINE_POPOVER_EST_HEIGHT - 8;
		const showAbove = topBelow + INLINE_POPOVER_EST_HEIGHT > window.innerHeight && topAbove >= 8;
		const left = Math.max(8, Math.min(rect.left, window.innerWidth - 400));
		const top = showAbove ? topAbove : topBelow;
		return `left: ${left}px; top: ${top}px;`;
	});
</script>

<svelte:window
	onmousemove={onMouseMoveThrottled}
	onmouseleave={onMouseLeave}
/>
{#if browser && isEditor && !$hideEditIcons}
	{#if hoverTarget}
		<!-- Highlight discret pe elementul hover -->
		<div
			class="pointer-events-none fixed z-[9997] rounded-sm border-2 border-primary/25 bg-primary/5"
			style="left: {hoverTarget.rect.left}px; top: {hoverTarget.rect.top}px; width: {hoverTarget.rect.width}px; height: {hoverTarget.rect.height}px;"
			aria-hidden="true"
		></div>
		<!-- Buton pe elementul hover – colț dreapta-sus, sub nav, clamped la viewport -->
		{#if editButtonStyle}
		<div
			class="fixed z-[9998] transition-[left,top] duration-75 ease-out"
			style="left: {editButtonStyle.left}px; top: {editButtonStyle.top}px;"
		>
			<button
				type="button"
				class="flex size-9 shrink-0 items-center justify-center rounded-none border border-border bg-card shadow-md transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
				onclick={openModal}
				aria-label="Edit"
			>
				<Pencil class="size-4" />
			</button>
		</div>
		{/if}
	{/if}

	{#if inlineEdit}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			class="fixed z-[9999] w-full max-w-md rounded-none border border-border bg-background shadow-xl"
			style={inlinePopoverStyle}
			role="dialog"
			aria-modal="true"
			aria-label="Editare inline"
			tabindex="-1"
			use:focusTrap={{ initialFocus: false }}
			use:dialogBehavior={{ onClose: closeInline, backdrop: false, initialFocus: true }}
		>
			<div class="p-3">
				{#if inlineEdit.fieldGroup && inlineEdit.fieldGroup.length > 0}
					<p class="mb-3 text-xs font-medium text-muted-foreground">Editezi</p>
					{#each inlineEdit.fieldGroup as key}
						{@const sectionKey = `${inlineEdit?.page ?? ''}_${inlineEdit?.section ?? ''}`}
						{@const fieldDef = (SECTION_FIELDS[sectionKey] ?? []).find((f) => f.key === key)}
						{@const fieldLabel = inlineEdit?.heroLocale ? (HERO_FIELD_LABELS[key] ?? key) : (fieldDef?.label ?? key)}
						{@const useTextarea = fieldDef?.textarea ?? key.includes('.text')}
						{@const isImageKey = key.endsWith('.image') || key === 'backgroundImage'}
						{@const inputId = `inline-group-${key.replace(/\./g, '-')}`}
						<div class="mb-3">
							<Label for={inputId} class="mb-1 block text-xs font-medium text-muted-foreground">{fieldLabel}</Label>
							{#if isImageKey}
								<MediaPicker bind:value={inlineGroupValues[key]} label="Selectează din Media" />
							{:else if useTextarea}
								<textarea
									id={inputId}
									class="w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
									rows="3"
									value={inlineGroupValues[key] ?? ''}
									oninput={(e) => (inlineGroupValues = { ...inlineGroupValues, [key]: e.currentTarget.value })}
									onkeydown={(e) => e.key === 'Escape' && closeInline()}
								></textarea>
							{:else}
								<Input
									id={inputId}
									class="rounded-none"
									value={inlineGroupValues[key] ?? ''}
									oninput={(e) => (inlineGroupValues = { ...inlineGroupValues, [key]: e.currentTarget.value })}
									onkeydown={(e) => e.key === 'Escape' && closeInline()}
								/>
							{/if}
						</div>
					{/each}
				{:else}
					<p class="mb-2 text-xs font-medium text-muted-foreground">Editezi: {inlineEdit.label}</p>
					{#if inlineIsImageField}
						<MediaPicker bind:value={inlineValue} label="Selectează din Media" />
					{:else if inlineFieldTextarea}
						<textarea
							class="w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
							rows="4"
							bind:value={inlineValue}
							onkeydown={(e) => e.key === 'Escape' && closeInline()}
						></textarea>
					{:else}
						<Input
							class="rounded-none"
							bind:value={inlineValue}
							onkeydown={(e) => e.key === 'Escape' && closeInline()}
						/>
					{/if}
				{/if}
				{#if inlineError}
					<p class="mt-2 text-sm text-destructive">{inlineError}</p>
				{/if}
				<div class="mt-3 flex gap-2">
					<Button size="sm" class="rounded-none" onclick={saveInline} disabled={inlineSaving}>
						{inlineSaving ? 'Se salvează...' : 'Salvează'}
					</Button>
					<Button size="sm" variant="outline" class="rounded-none" onclick={closeInline} disabled={inlineSaving}>
						Anulare
					</Button>
				</div>
			</div>
		</div>
	{/if}

	{#if modalOpen}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="cms-edit-title"
			tabindex="-1"
			use:focusTrap={{ initialFocus: false }}
			use:dialogBehavior={{ onClose: closeModal, backdrop: true, initialFocus: true }}
		>
			<div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-none border border-border bg-background shadow-xl">
				<div class="flex items-center justify-between border-b border-border px-4 py-3">
					<div>
						<h2 id="cms-edit-title" class="text-lg font-semibold">Editare</h2>
						{#if modalType === 'section' && modalPage && modalSection}
							<p class="mt-0.5 text-xs text-muted-foreground">
								{PAGE_LABELS[modalPage] ?? modalPage} › {SECTION_LABELS[modalSection] ?? modalSection}
							</p>
						{:else if modalType === 'program_section' && modalSection}
							<p class="mt-0.5 text-xs text-muted-foreground">
								Secțiune program: {PROGRAM_SECTION_LABELS[modalSection] ?? modalSection}
							</p>
						{/if}
					</div>
					<button
						type="button"
						class="rounded-none p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
						onclick={closeModal}
						aria-label="Închide"
					>
						<X class="size-5" />
					</button>
				</div>
				<div class="p-4">
					{#if loading}
						<p class="text-muted-foreground">Se încarcă...</p>
					{:else if error}
						<p class="text-destructive text-sm">{error}</p>
					{:else if modalType === 'mentor'}
						<div class="space-y-4">
							<div>
								<Label for="nameRo">Nume</Label>
								<Input id="nameRo" class="mt-1" bind:value={formData.nameRo} />
							</div>
							<div>
								<Label for="titleRo">Titlu</Label>
								<Input id="titleRo" class="mt-1" bind:value={formData.titleRo} />
							</div>
							<div>
								<Label for="bioRo">Bio</Label>
								<textarea
									id="bioRo"
									class="mt-1 w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
									rows="8"
									bind:value={formData.bioRo}
								></textarea>
							</div>
							<div>
								<Label for="image">Imagine</Label>
								<div class="mt-1">
									<MediaPicker bind:value={formData.image} label="Selectează din Media" />
								</div>
							</div>
							<div>
								<Label for="yearJoined">An adăugare</Label>
								<Input id="yearJoined" type="number" class="mt-1" bind:value={formData.yearJoined} />
							</div>
						</div>
					{:else if modalType === 'program'}
						<div class="space-y-4">
							<div>
								<Label for="slug">Slug</Label>
								<Input id="slug" class="mt-1" bind:value={formData.slug} />
							</div>
							<div>
								<Label for="title">Titlu</Label>
								<Input id="title" class="mt-1" bind:value={formData.title} />
							</div>
							<div>
								<Label for="description">Descriere</Label>
								<textarea
									id="description"
									class="mt-1 w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
									rows="3"
									bind:value={formData.description}
								></textarea>
							</div>
							<div>
								<Label for="ageRange">Vârstă</Label>
								<Input id="ageRange" class="mt-1" bind:value={formData.ageRange} />
							</div>
							<div>
								<Label for="locationText">Locație</Label>
								<Input id="locationText" class="mt-1" bind:value={formData.locationText} />
							</div>
							<div>
								<Label for="datesText">Date</Label>
								<Input id="datesText" class="mt-1" bind:value={formData.datesText} />
							</div>
							<div>
								<Label for="image">Imagine</Label>
								<div class="mt-1">
									<MediaPicker bind:value={formData.image} label="Selectează din Media" />
								</div>
							</div>
						</div>
					{:else if modalType === 'section' && modalPage && modalSection}
						<div class="space-y-4">
							{#each sectionFormFields as f (f.key)}
								<div>
									<Label for="section-{f.key}">{f.label}</Label>
									{#if f.key.endsWith('.image') || f.key === 'backgroundImage'}
										<div class="mt-1">
											<MediaPicker bind:value={formData[f.key]} label="Selectează" />
										</div>
									{:else if f.textarea}
										<textarea
											id="section-{f.key}"
											class="mt-1 w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
											rows="3"
											bind:value={formData[f.key]}
										></textarea>
									{:else}
										<Input id="section-{f.key}" class="mt-1 rounded-none" bind:value={formData[f.key]} />
									{/if}
								</div>
							{/each}
						</div>
					{:else if modalType === 'program_section' && modalSection}
						{#if programSectionFields.length > 0}
							<div class="space-y-4">
								{#each programSectionFields as f (f.key)}
									<div>
										<div class="flex items-center justify-between gap-2">
											<Label for="progsec-{f.key}">{f.label}</Label>
											{#if modalSection === 'enrollment'}
												{@const stepMatch = f.key.match(/^steps\.(\d+)\.label$/)}
												{@const btnMatch = f.key.match(/^buttons\.(\d+)\.label$/)}
												{#if stepMatch}
													<Button
														type="button"
														variant="outline"
														size="sm"
														class="rounded-none"
														onclick={() => removeEnrollmentStep(Number(stepMatch[1]))}
													>
														Șterge pas
													</Button>
												{:else if btnMatch}
													<Button
														type="button"
														variant="outline"
														size="sm"
														class="rounded-none"
														onclick={() => removeEnrollmentButton(Number(btnMatch[1]))}
													>
														Șterge buton
													</Button>
												{/if}
											{/if}
										</div>
										{#if f.kind === 'image'}
											<div class="mt-1">
												<MediaPicker bind:value={formData[f.key]} label="Selectează din Media" />
											</div>
										{:else if f.kind === 'stringArray'}
											<textarea
												id="progsec-{f.key}"
												class="mt-1 w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
												rows={f.rows ?? 4}
												placeholder="Câte un element per linie"
												bind:value={formData[f.key]}
											></textarea>
										{:else if f.kind === 'textarea'}
											<textarea
												id="progsec-{f.key}"
												class="mt-1 w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
												rows={f.rows ?? 3}
												bind:value={formData[f.key]}
											></textarea>
										{:else if f.kind === 'select'}
											<Select.Root type="single" bind:value={formData[f.key]}>
												<Select.Trigger id="progsec-{f.key}" class="mt-1 w-full rounded-none">
													{(f.options ?? []).find((option) => option.value === formData[f.key])?.label ?? 'Selectează'}
												</Select.Trigger>
												<Select.Content>
													{#each (f.options ?? []) as option (option.value)}
														<Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										{:else if f.kind === 'number'}
											<Input id="progsec-{f.key}" type="number" class="mt-1 rounded-none" bind:value={formData[f.key]} />
										{:else}
											<Input id="progsec-{f.key}" class="mt-1 rounded-none" bind:value={formData[f.key]} />
										{/if}
									</div>
								{/each}
								{#if modalSection === 'enrollment'}
									<div class="flex flex-wrap gap-2 border-t border-border pt-3">
										<Button type="button" variant="outline" class="rounded-none" onclick={addEnrollmentStep}>
											Adaugă pas
										</Button>
										<Button type="button" variant="outline" class="rounded-none" onclick={addEnrollmentButton}>
											Adaugă buton
										</Button>
									</div>
								{/if}
							</div>
						{:else}
							<p class="text-muted-foreground">Pentru această secțiune folosește panoul de admin.</p>
							<Button
								variant="outline"
								class="mt-2 rounded-none"
								onclick={() => {
									const id = modalId;
									const sec = modalSection;
									closeModal();
									if (id && sec) goto(`/admin/programs/${id}#sec-${sec}`);
								}}
							>
								Deschide în admin
							</Button>
						{/if}
					{:else}
						<p class="text-muted-foreground">Secțiune – editează din panoul de pagini.</p>
					{/if}
				</div>
				{#if modalType === 'mentor' || modalType === 'program' || modalType === 'section' || modalType === 'program_section'}
					<div class="flex justify-end gap-2 border-t border-border px-4 py-3">
						<Button variant="outline" onclick={closeModal} disabled={saving}>Anulare</Button>
						<Button onclick={save} disabled={saving}>{saving ? 'Se salvează...' : 'Salvează'}</Button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
{/if}
