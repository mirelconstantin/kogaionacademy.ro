<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { contentHref } from '$lib/content-routes';
	import { buildScheduleLines, formatAgeRangeLabel } from '$lib/program-schedule';
	import { programCategories } from '$lib/programs-data';
	import type { ProgramForDisplay } from '$lib/server/content';
	import type { MentorForDisplay } from '$lib/server/content';
	import { Button } from '$lib/components/ui/button';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Calendar from '@lucide/svelte/icons/calendar';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Phone from '@lucide/svelte/icons/phone';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Users from '@lucide/svelte/icons/users';
	import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
	import LazyVideoEmbed from '$lib/components/LazyVideoEmbed.svelte';

	/** Redesigned editorial experience + copy overrides for this program only. */
	const FAMILY_BOOTCAMP_46_SLUG = 'kogaion-family-bootcamp-4-6-ani';

	const FB46_HERO_SUBTITLE =
		'Șapte zile de tabără pentru familii cu copii 4–6 ani, la munte (Moieciu de Sus): spațiu sigur, ritm blând și practici de parenting care ajută relația copil–părinte să fie mai calmă, mai jucăușă și mai ancorată acasă.';

	const FB46_HERO_IMAGE_ALT =
		'Atmosferă tabără Family Bootcamp Kogaion pentru familii cu copii mici, natură și activități ghidate';

	const FB46_HIGHLIGHTS: string[] = [
		'Relație copil–părinte, exersată zilnic în tabără',
		'Psihologie și pedagogie experiențială',
		'Feedback și pași concreți pentru acasă',
		'Grup mic, natură, observație specializată',
		'Mentori Kogaion alături de familie',
		'Follow-up după tabără'
	];

	const FB46_INTRO_EYEBROW = 'De ce există această tabără';
	const FB46_INTRO_H2 =
		'Family Bootcamp 4–6 ani: o săptămână pentru familie, la munte, cu focus pe relație';

	const FB46_INTRO_BLOCKS: { title?: string; body: string }[] = [
		{
			body: 'Kogaion Family Bootcamp nu e o listă de „activități de bifat”. E un ritm în care familia respiră mai împreună: copilul are voie să fie copil, iar părintele primește spațiu să înțeleagă ce e în spatele comportamentelor — fără vină și fără grabă.'
		},
		{
			body: 'La 4–6 ani, învățarea și cooperarea stau pe relație: siguranță emoțională, limite blânde, ritm al zilei și felul în care adulții răspund la emoții. În tabără exersăm asta în natură — prin joc, ritualuri mici și conversații ghidate.'
		},
		{
			body: 'Familia e contextul în care se construiește încrederea. Combinăm observație specializată, feedback onest și instrumente pe care le poți folosi acasă, ca să pleci nu doar cu amintiri, ci cu un plan simplu și real.'
		},
		{
			body: 'Designul e triadic: lucru cu copilul, cu părintele și momente copil–părinte, ca în familie să existe un singur limbaj, nu trei versiuni diferite ale „ce ar trebui”.'
		},
		{
			body: 'După tabără rămânem disponibili în follow-up: nu tratăm experiența ca pe un final de poveste, ci te ajutăm să alegi ce merită păstrat și cum se traduce în obiceiuri mici, sustenabile.'
		}
	];

	const FB46_HERO_CARD_TITLE = 'Ce primiți în această tabără';
	const FB46_HERO_CARD_LEAD =
		'Focus pe siguranță emoțională, limite blânde și obiceiuri care pot continua și după cele șapte zile la munte.';
	const FB46_HERO_CARD_BULLETS: string[] = [
		'Grup mic — atenție reală la fiecare copil și familie',
		'Mentori cu experiență în educație integrată',
		'Natură, ritm blând, conversații cu sens'
	];

	const FB46_MENTORS_SECTION_EYEBROW = 'Echipa';
	const FB46_MENTORS_SECTION_H2 = 'Mentorii care vă însoțesc în Family Bootcamp';
	const FB46_MENTORS_SECTION_INTRO =
		'Educație și dezvoltare cu prezență în tabără: îndrumare practică alături de familie, în contextul real al zilelor petrecute împreună, nu de la distanță.';

	const FB46_CURRICULUM_LEAD =
		'Fiecare temă leagă ce trăiți în tabără de ce se întâmplă acasă: același limbaj între copil, părinte și echipă, aceleași obiective, pași mici și repetați.';

	const FB46_GALLERY_LEAD =
		'Momente din tabăra pentru familii la munte — joacă, natură și atmosfera în care copiii și părinții își regăsesc ritmul împreună.';

	const FB46_ENROLLMENT_INTRO =
		'Înscrierea începe cu o conversație: vrem să înțelegem familia voastră și să fim sinceri dacă acest format vi se potrivește. Dacă da, vă ghidăm clar spre pașii următori — fără presiune.';

	const FB46_ENROLLMENT_STEPS: { order: number; label: string }[] = [
		{ order: 1, label: 'Ne lași datele sau ne suni — înțelegem contextul și întrebările voastre.' },
		{ order: 2, label: 'Discuție scurtă cu echipa: potrivire între nevoile voastre și formatul taberei.' },
		{ order: 3, label: 'Confirmare loc și detalii practice: cazare, rutină, masă.' },
		{ order: 4, label: 'Pregătire înainte de tabără și materiale de sprijin, ca să intrați liniștiți.' }
	];

	const FB46_ENROLLMENT_SIDEBAR_TITLE = 'Preferi WhatsApp';
	const FB46_ENROLLMENT_SIDEBAR_BODY =
		'Poți pune orice întrebare despre tabără sau începe înscrierea direct din chat. Răspundem când putem, fără grabă.';
	const FB46_ENROLLMENT_SIDEBAR_WHATSAPP_CTA = 'Scrie-ne pe WhatsApp';
	const FB46_ENROLLMENT_SIDEBAR_TEL_HINT = 'Preferi telefonul?';
	const FB46_DEFAULT_TEL_VALUE = '0720529398';

	const FB46_BENEFITS_EYEBROW = 'Beneficii';
	const FB46_BENEFITS_TITLE = 'Beneficiile Kogaion Family Bootcamp';
	const FB46_BENEFITS_INTRO =
		'În tabără, rezultatele se simt în relație: mai multă claritate între voi, instrumente simple pentru acasă și spațiu în care copilul și părintele cresc împreună. Mai jos sunt direcțiile pe care le urmărim în cele șapte zile.';

	const FB46_BENEFITS_IMAGE_ALT =
		'Familie și copii în tabără Kogaion Family Bootcamp — activități și momente împreună';

	const FB46_LOCATION_EYEBROW = 'Locație';
	const FB46_LOCATION_TITLE = 'Pensiunea Nicoleta 3***, Moieciu de Sus';
	const FB46_LOCATION_INTRO =
		'Cazare la munte pentru familii: confort, natură aproape și ritm potrivit pentru programul Family Bootcamp 4–6 ani.';
	const FB46_LOCATION_MAIN_IMAGE_ALT =
		'Pensiunea Nicoleta, Moieciu de Sus — cazare tabără familie Kogaion lângă munții Bucegi';

	const FB46_INTRO_VIDEO_TITLE = 'Video prezentare — Kogaion Family Bootcamp pentru familii';
	const FB46_INTRO_IMAGE_ALT =
		'Momente din tabără Family Bootcamp — familii și copii 4–6 ani, activități Kogaion';

	let {
		data
	}: {
		data: {
			program: ProgramForDisplay;
			programCategories: typeof programCategories;
			mentors?: MentorForDisplay[];
			isEditor?: boolean;
			canonicalUrl?: string;
			baseUrl?: string;
		};
	} = $props();

	const messages = m as unknown as Record<string, () => string>;
	function msg(key: string): string {
		const f = messages[key];
		return typeof f === 'function' ? f() : '';
	}

	const program = $derived(data.program);
	const mentors = $derived(data.mentors ?? []);
	const isFamilyBootcamp46 = $derived(program.slug === FAMILY_BOOTCAMP_46_SLUG);

	const categoryTitleKey = $derived(
		(data.programCategories ?? programCategories).find((c) => c.id === program.categoryId)?.titleKey ?? ''
	);
	const FALLBACK_IMAGE = '/media/uploads/about/age-3-6.webp';
	const hasSections = $derived(Array.isArray(program.sections) && program.sections.length > 0);

	const metaDescription = $derived.by(() => {
		if (isFamilyBootcamp46) {
			return 'Family Bootcamp Kogaion pentru familii cu copii 4–6 ani: tabără la munte la Moieciu de Sus — parenting, relație copil–părinte și limite blânde. Înscrieri la Kogaion Gifted Academy.';
		}
		return (
			program.subtitle?.trim() ||
			(program.description
				? program.description.slice(0, 155).trim() + (program.description.length > 155 ? '…' : '')
				: `${program.title} – Kogaion Gifted Academy`)
		);
	});

	const ogImageRelative = $derived(program.image ?? FALLBACK_IMAGE);
	const baseUrl = $derived(data.baseUrl ?? '');
	const ogImage = $derived(
		ogImageRelative.startsWith('http')
			? ogImageRelative
			: baseUrl
				? `${baseUrl}${ogImageRelative.startsWith('/') ? '' : '/'}${ogImageRelative}`
				: ogImageRelative
	);
	const canonicalUrl = $derived(data.canonicalUrl ?? '');
	const schemaCourse = $derived.by(() => {
		const base: Record<string, unknown> = {
			'@context': 'https://schema.org',
			'@type': 'Course',
			name: program.title,
			description: metaDescription,
			...(ogImage && { image: ogImage }),
			...(program.datesText && { courseSchedule: { '@type': 'Schedule', duration: program.datesText } }),
			provider: { '@type': 'Organization', name: 'Kogaion Gifted Academy' }
		};
		if (isFamilyBootcamp46) {
			base.availableLanguage = 'ro';
			base.audience = {
				'@type': 'EducationalAudience',
				educationalRole: 'parent'
			};
			base.location = {
				'@type': 'Place',
				name: 'Moieciu de Sus, Județul Brașov, România'
			};
		}
		return base;
	});

	function getSection(key: string):
		| { section: string; sortOrder: number; payload: Record<string, unknown> }
		| undefined {
		return program.sections?.find((s) => s.section === key);
	}

	function resolveMapEmbedUrl(raw: string | undefined): string {
		if (!raw) return '';
		const trimmed = raw.trim();
		if (trimmed.startsWith('<iframe')) {
			const match = trimmed.match(/src="([^"]+)"/i);
			return match?.[1] ?? '';
		}
		return trimmed;
	}

	function splitCurriculumTitle(raw: string): { headline: string; body: string } {
		const spacedEm = raw.indexOf(' – ');
		if (spacedEm > 0) {
			const head = raw.slice(0, spacedEm).trim();
			const rest = raw.slice(spacedEm + 3).trim();
			const colon = rest.indexOf(': ');
			if (colon > 0) {
				return { headline: head + ' — ' + rest.slice(0, colon).trim(), body: rest.slice(colon + 2).trim() };
			}
			return { headline: head, body: rest };
		}
		const colon = raw.indexOf(': ');
		if (colon > 0) {
			return { headline: raw.slice(0, colon).trim(), body: raw.slice(colon + 2).trim() };
		}
		return { headline: raw, body: '' };
	}

	/** Sentence case: cap la început și după `&`, după `—` / `–`. */
	function formatCurriculumHeadline(raw: string): string {
		const s = raw.trim();
		if (!s) return raw;
		let out = s.toLocaleLowerCase('ro-RO');
		out = out.charAt(0).toUpperCase() + out.slice(1);
		out = out.replace(/&(\s*)(\p{L})/gu, (_m, spaces: string, letter: string) => `&${spaces}${letter.toUpperCase()}`);
		out = out.replace(/(—|–)(\s*)(\p{L})/gu, (_m, dash: string, spaces: string, letter: string) => `${dash}${spaces}${letter.toUpperCase()}`);
		return out;
	}

	const displaySections = $derived.by(() => {
		const sections = program.sections ?? [];
		const out: Array<{ section: string; sortOrder: number; payload: Record<string, unknown> }> = [];
		let mentorsInjected = false;
		for (const s of sections) {
			if (
				isFamilyBootcamp46 &&
				(s.section === 'transport' || s.section === 'menu')
			) {
				continue;
			}
			if (
				(s.section === 'benefits_main' || s.section === 'benefits_secondary') &&
				mentors.length > 0 &&
				!mentorsInjected
			) {
				out.push({ section: '__mentors__', sortOrder: s.sortOrder - 0.5, payload: {} });
				mentorsInjected = true;
			}
			out.push(s);
		}
		return out;
	});

	const displaySectionsEndAtEnrollment = $derived.by(() => {
		const idx = displaySections.findIndex((s) => s.section === 'enrollment');
		if (idx < 0) return displaySections;
		return displaySections.slice(0, idx + 1);
	});

	const heroHighlightsItems = $derived.by(() => {
		const fromDb = (getSection('hero_highlights')?.payload as { items?: string[] } | undefined)?.items;
		if (isFamilyBootcamp46) return FB46_HIGHLIGHTS;
		return fromDb ?? [];
	});

	const displayHeroSubtitle = $derived(
		isFamilyBootcamp46 ? FB46_HERO_SUBTITLE : (program.subtitle ?? '')
	);

	type IntroPayload = {
		blocks?: { title?: string; body: string }[];
		imageBetweenBlocks?: string;
		imageAfterBlockIndex?: number;
		videoBetweenBlocks?: { provider?: 'youtube' | 'vimeo'; videoId?: string; title?: string };
	};

	const introPayload = $derived(getSection('intro')?.payload as IntroPayload | undefined);
	const resolvedIntroBlocks = $derived.by(() => {
		const blocks = introPayload?.blocks;
		if (!blocks?.length) return [];
		if (isFamilyBootcamp46) return FB46_INTRO_BLOCKS;
		return blocks;
	});

	let heroVideoError = $state(false);
	let expandedMentors = $state<Record<number, boolean>>({});

	const galleryImages = $derived(
		((getSection('gallery')?.payload as { images?: { url: string; alt?: string }[] } | undefined)?.images ??
			[]) as { url: string; alt?: string }[]
	);
	const programGalleryRowOne = $derived(galleryImages.filter((_, index) => index % 2 === 0));
	const programGalleryRowTwo = $derived(galleryImages.filter((_, index) => index % 2 === 1));

	function scrollProgramGalleryStep(track: HTMLElement): number {
		const firstItem = track.querySelector('[data-gallery-item]');
		const gap = Number.parseFloat(globalThis.getComputedStyle(track).columnGap || '12') || 12;
		return firstItem instanceof HTMLElement ? firstItem.getBoundingClientRect().width + gap : 302;
	}

	function scrollProgramGallery(direction: -1 | 1) {
		const mobile = document.getElementById('program-gallery-track-mobile');
		const topTrack = document.getElementById('program-gallery-track-top');
		const bottomTrack = document.getElementById('program-gallery-track-bottom');
		const dual =
			globalThis.matchMedia?.('(min-width: 768px)').matches &&
			topTrack instanceof HTMLElement &&
			bottomTrack instanceof HTMLElement;
		if (dual) {
			const step = scrollProgramGalleryStep(topTrack);
			topTrack.scrollBy({ left: direction * step, behavior: 'smooth' });
			bottomTrack.scrollBy({ left: direction * step, behavior: 'smooth' });
			return;
		}
		if (mobile instanceof HTMLElement) {
			const step = scrollProgramGalleryStep(mobile);
			mobile.scrollBy({ left: direction * step, behavior: 'smooth' });
		}
	}

	type BioPart = { type: 'text' | 'link' | 'break'; value: string; href?: string };

	function toggleMentorBio(mentorId: number): void {
		expandedMentors = { ...expandedMentors, [mentorId]: !expandedMentors[mentorId] };
	}

	function cleanMentorBio(bio: string, yearJoined: number | null): string {
		if (!bio) return '';
		const normalized = bio.replace(/\r\n/g, '\n');
		const withoutMentorSince = normalized
			.replace(/\bDin\s+\d{4},\s*/gi, '')
			.replace(/\b(?:începând|incepand)\s+cu\s+anul\s+\d{4},?\s*/gi, '')
			.replace(/\bdin\s+anul\s+\d{4}\b/gi, '')
			.replace(/\b(?:este|e)\s+mentor[^.\n!?]*[.\n!?]?/gi, '')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
		void yearJoined;
		return withoutMentorSince || normalized.trim();
	}

	function buildMentorBioParts(text: string): BioPart[] {
		const parts: BioPart[] = [];
		const lines = text.replace(/\r\n/g, '\n').split('\n');
		const linkPattern = /\b((?:https?:\/\/|www\.)[^\s<]+|(?:instagram\.com\/[^\s<]+))/gi;

		for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
			const line = lines[lineIndex] ?? '';
			let cursor = 0;
			let match: RegExpExecArray | null;
			linkPattern.lastIndex = 0;

			while ((match = linkPattern.exec(line)) !== null) {
				const raw = match[0];
				const start = match.index;
				if (start > cursor) {
					parts.push({ type: 'text', value: line.slice(cursor, start) });
				}
				parts.push({
					type: 'link',
					value: raw,
					href: /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
				});
				cursor = start + raw.length;
			}

			if (cursor < line.length) {
				parts.push({ type: 'text', value: line.slice(cursor) });
			}

			if (lineIndex < lines.length - 1) {
				parts.push({ type: 'break', value: '' });
			}
		}

		return parts;
	}

	type HeroCtaPayload = {
		buttons?: { label: string; type: 'tel' | 'link'; value?: string; href?: string }[];
	};

	const heroCtaButtons = $derived(
		(getSection('hero_cta')?.payload as HeroCtaPayload | undefined)?.buttons ?? []
	);

	type EnrollPayload = {
		title?: string;
		intro?: string;
		steps?: { order: number; label: string }[];
		contactNote?: string;
		buttons?: { label: string; type: 'tel' | 'link'; value?: string; href?: string }[];
	};

	function resolveEnrollment(enroll: EnrollPayload): EnrollPayload {
		if (!isFamilyBootcamp46) return enroll;
		return {
			...enroll,
			intro: FB46_ENROLLMENT_INTRO,
			steps: enroll.steps?.length ? enroll.steps : FB46_ENROLLMENT_STEPS
		};
	}

	function defaultEnrollmentButtons(): {
		label: string;
		type: 'tel' | 'link';
		value?: string;
		href?: string;
	}[] {
		return [
			{ label: 'Sună', type: 'tel', value: '0720529398' },
			{ label: 'Cere detalii', type: 'link', href: contentHref('contact') },
			{ label: 'Formular de înscriere', type: 'link', href: contentHref('contact') }
		];
	}

	function enrollPrimaryTel(buttons: { type: string; value?: string }[]): { href: string; display: string } {
		const tel = buttons.find((b) => b.type === 'tel' && b.value && b.value.replace(/\D/g, '').length >= 9);
		const digits = (tel?.value ?? FB46_DEFAULT_TEL_VALUE).replace(/\D/g, '');
		return {
			href: `tel:${digits}`,
			display: tel?.value?.trim() ?? FB46_DEFAULT_TEL_VALUE
		};
	}

	function enrollWhatsappHref(buttons: { type: string; value?: string }[]): string {
		const tel = buttons.find((b) => b.type === 'tel' && b.value && b.value.replace(/\D/g, '').length >= 9);
		let d = (tel?.value ?? FB46_DEFAULT_TEL_VALUE).replace(/\D/g, '');
		if (d.startsWith('0')) {
			d = `40${d.slice(1)}`;
		} else if (d.length === 9) {
			d = `40${d}`;
		}
		const text = encodeURIComponent(
			'Bună! Am o întrebare despre Kogaion Family Bootcamp (4–6 ani).'
		);
		return `https://wa.me/${d}?text=${text}`;
	}
</script>

<svelte:head>
	<title>{program.title} – Kogaion Gifted Academy</title>
	<meta name="description" content={metaDescription} />
	{#if canonicalUrl}
		<link rel="canonical" href={canonicalUrl} />
	{/if}
	<meta property="og:title" content="{program.title} – Kogaion Gifted Academy" />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:image" content={ogImage} />
	{#if canonicalUrl}
		<meta property="og:url" content={canonicalUrl} />
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="ro_RO" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{program.title} – Kogaion Gifted Academy" />
	<meta name="twitter:description" content={metaDescription} />
	<meta name="twitter:image" content={ogImage} />
	<script type="application/ld+json">
		{JSON.stringify(schemaCourse)}
	</script>
</svelte:head>

<main class="min-h-dvh bg-white text-foreground" data-cms-type="program" data-cms-id={program.id}>
	<!-- Hero program: aliniat tonului homepage/about, păstrând imaginea de fundal -->
	<header class="relative min-h-[44vh] overflow-hidden rounded-br-[5.6rem] border-b-2 border-white/20 bg-[#0c3044] md:min-h-[46vh] md:rounded-br-[7rem]">
		<div class="absolute inset-0">
			{#if program.videoUrl && !heroVideoError}
				<video
					src={program.videoUrl}
					poster={program.image ?? FALLBACK_IMAGE}
					autoplay
					muted
					loop
					playsinline
					class="size-full object-cover object-center opacity-90"
					aria-hidden="true"
					onerror={() => (heroVideoError = true)}
				></video>
			{:else}
				<img
					src={program.image ?? FALLBACK_IMAGE}
					alt={isFamilyBootcamp46 ? FB46_HERO_IMAGE_ALT : (program.title ? `Imagine program: ${program.title}` : '')}
					class="size-full object-cover object-center opacity-95"
				/>
			{/if}
			<div class="absolute inset-0 bg-gradient-to-b from-[#154b6a]/85 via-[#154b6a]/58 to-[#091328]/82"></div>
			<div
				class="pointer-events-none absolute -right-24 -bottom-24 size-[28rem] rounded-full bg-[#c25067]/18 blur-3xl"
				aria-hidden="true"
			></div>
		</div>

		<div
			class="relative mx-auto max-w-6xl px-6 pb-12 pt-[calc(var(--admin-bar-height,0px)+var(--nav-height,5rem)+var(--below-nav-gap,0px))] md:px-10 md:pb-14 md:pt-[calc(var(--admin-bar-height,0px)+7rem+var(--below-nav-gap,0px))] lg:px-16"
		>
			<div class="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,22rem)] lg:items-end">
				<div>
					{#if categoryTitleKey}
						<p
							class="text-xs font-semibold tracking-[0.22em] text-white/85 uppercase [font-family:var(--font-sans)]"
						>
							{msg(categoryTitleKey)}
						</p>
					{/if}
					<h1
						class="mt-3 max-w-none text-[1.85rem] leading-[1.1] font-medium tracking-[-0.02em] text-white md:text-[2.5rem] lg:text-[2.7rem] xl:text-[2.8rem] [font-family:var(--font-spectral)]"
					>
						{program.title}
					</h1>
					{#if displayHeroSubtitle}
						<p
							class="mt-4 max-w-xl text-[0.98rem] leading-relaxed text-white/90 md:text-base [font-family:var(--font-sans)]"
						>
							{displayHeroSubtitle}
						</p>
					{/if}

					<div
						class="mt-7 space-y-3 text-[0.95rem] font-semibold leading-snug text-white md:space-y-3.5 md:text-[1.05rem] [font-family:var(--font-sans)]"
					>
						{#if formatAgeRangeLabel(program.categoryId, program.ageRange)}
							<p class="flex items-center gap-3">
								<Users class="size-5 shrink-0 text-[var(--brand-green)]" aria-hidden="true" />
								<span class="tracking-wide">{formatAgeRangeLabel(program.categoryId, program.ageRange)}</span>
							</p>
						{/if}
						{#if buildScheduleLines(program.datesText, program.durationText).length > 0}
							<p class="flex items-start gap-3 text-white">
								<Calendar class="mt-0.5 size-5 shrink-0 text-[var(--brand-green)]" aria-hidden="true" />
								<span class="space-y-1 font-semibold">
									{#each buildScheduleLines(program.datesText, program.durationText) as line, idx (`sched-${idx}`)}
										<span class="block tracking-wide">{line}</span>
									{/each}
								</span>
							</p>
						{/if}
						{#if program.locationText || program.location}
							<p class="flex items-start gap-3 text-white">
								<MapPin class="mt-0.5 size-5 shrink-0 text-[var(--brand-green)]" aria-hidden="true" />
								<span class="tracking-wide">{program.locationText ?? program.location}</span>
							</p>
						{/if}
					</div>

					{#if hasSections && heroCtaButtons.length > 0}
						<div class="mt-8 flex flex-wrap gap-3">
							{#each heroCtaButtons as btn, bi (`hero-cta-${bi}`)}
								{#if btn.type === 'tel'}
									<a
										href={'tel:' + (btn.value?.replace(/\D/g, '') ?? '')}
										class="btn-diagonal inline-flex min-h-12 items-center justify-center gap-2 border border-white bg-white px-6 py-3 text-center text-[0.9rem] font-semibold normal-case tracking-normal text-[var(--brand-blue)] shadow-lg shadow-black/15 transition-colors hover:bg-transparent hover:text-white [font-family:var(--font-sans)] md:text-[0.96rem]"
									>
										<Phone class="size-5 shrink-0" aria-hidden="true" />
										{btn.label}
									</a>
								{:else if btn.type === 'link'}
									<a
										href={btn.href ?? contentHref('contact')}
										class="btn-diagonal inline-flex min-h-12 items-center justify-center gap-2 border border-white bg-transparent px-6 py-3 text-center text-[0.9rem] font-semibold normal-case tracking-normal text-white transition-colors hover:bg-white hover:text-[var(--brand-blue)] [font-family:var(--font-sans)] md:text-[0.96rem]"
									>
										{btn.label}
										<ChevronRight class="size-4 shrink-0" aria-hidden="true" />
									</a>
								{/if}
							{/each}
						</div>
					{/if}
				</div>

				{#if hasSections}
					<div
						class="h-fit space-y-3 rounded-tl-[2.2rem] rounded-br-[2.2rem] border border-white/35 bg-white/12 p-5 shadow-[0_16px_40px_-22px_rgba(0,0,0,0.35)] backdrop-blur-md md:p-6 [font-family:var(--font-sans)] {isFamilyBootcamp46
							? 'hidden md:block'
							: ''}"
					>
						<p
							class="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-white/85 {isFamilyBootcamp46
								? ''
								: 'uppercase'}"
						>
							<HeartHandshake class="size-4" aria-hidden="true" />
							{#if isFamilyBootcamp46}
								{FB46_HERO_CARD_TITLE}
							{:else}
								În această experiență
							{/if}
						</p>
						<p class="mt-3 text-sm leading-relaxed text-white/90">
							{#if isFamilyBootcamp46}
								{FB46_HERO_CARD_LEAD}
							{:else}
								Program intensiv Kogaion: conținut structurat, mentori dedicați și suport pentru familie.
							{/if}
						</p>
						<ul class="mt-4 space-y-2 text-[0.9rem] text-white/88">
							{#if isFamilyBootcamp46}
								{#each FB46_HERO_CARD_BULLETS as bullet (`hb-${bullet.slice(0, 20)}`)}
									<li class="flex gap-2">
										<span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-white/80" aria-hidden="true"></span>
										<span>{bullet}</span>
									</li>
								{/each}
							{:else}
								<li class="flex gap-2">
									<span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-white/80" aria-hidden="true"></span>
									<span>Mediu mic, atenție reală la fiecare copil</span>
								</li>
								<li class="flex gap-2">
									<span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-white/80" aria-hidden="true"></span>
									<span>Mentori cu experiență în educație integrată</span>
								</li>
								<li class="flex gap-2">
									<span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-white/80" aria-hidden="true"></span>
									<span>Natură, ritm blând, conversații cu sens</span>
								</li>
							{/if}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	</header>

	{#if hasSections && heroHighlightsItems.length > 0}
		<section class="relative border-b border-border bg-white px-0 py-6 md:py-8" aria-label="Repere program">
			<div
				class="w-full overflow-hidden rounded-tl-[5.6rem] rounded-br-[5.6rem] bg-[#fcfeff] md:rounded-tl-[7rem] md:rounded-br-[7rem]"
			>
				<div class="mx-auto max-w-6xl px-6 py-10 md:py-12">
					<p
						class="text-center text-xs font-semibold tracking-[0.22em] text-primary uppercase [font-family:var(--font-sans)]"
					>
						Despre ce este vorba
					</p>
					<div
						class="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:justify-center [&::-webkit-scrollbar]:hidden"
					>
						{#each heroHighlightsItems as item, hi (`hl-${hi}`)}
							<span
								class="btn-diagonal inline-block shrink-0 border border-[#dfeaf8] bg-[#f5fafd] px-4 py-2.5 text-center text-[0.88rem] font-medium normal-case tracking-normal text-[#0c3044] transition-colors hover:border-[#cfd9e6] hover:bg-[#e4eaf1] [font-family:var(--font-sans)] md:text-sm"
							>
								{item}
							</span>
						{/each}
					</div>
				</div>
			</div>
		</section>
	{/if}

	{#if hasSections}
		<div class="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-20 lg:px-16">
			{#each displaySectionsEndAtEnrollment as { section, payload }, sectionIndex (`${section}-${sectionIndex}`)}
				{#if section === 'hero_cta' || section === 'hero_highlights'}
					<!-- deja integrate în hero / bandă -->
				{:else if section === 'intro'}
					{#if resolvedIntroBlocks.length}
						<section
							class="mb-16 space-y-8 border-b border-border pb-16"
							data-cms-type="program_section"
							data-cms-program-id={program.id}
							data-cms-section={section}
						>
							<div class="mx-auto max-w-3xl text-center">
								<p
									class="text-xs font-semibold tracking-[0.2em] text-primary uppercase [font-family:var(--font-sans)]"
								>
									{isFamilyBootcamp46 ? FB46_INTRO_EYEBROW : 'De ce există această tabără'}
								</p>
								<h2
									class="mt-3 text-2xl font-medium tracking-[-0.02em] text-[#0c3044] md:text-3xl [font-family:var(--font-spectral)]"
								>
									{isFamilyBootcamp46
										? FB46_INTRO_H2
										: 'O săptămână în care familia învață din nou să respire împreună'}
								</h2>
							</div>
							{#if introPayload?.videoBetweenBlocks?.videoId}
								<div class="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-border shadow-md">
									{#if introPayload.videoBetweenBlocks.provider === 'vimeo'}
										<LazyVideoEmbed
											embedSrc={`https://player.vimeo.com/video/${introPayload.videoBetweenBlocks.videoId}?dnt=1`}
											title={introPayload.videoBetweenBlocks.title ??
												(isFamilyBootcamp46 ? FB46_INTRO_VIDEO_TITLE : 'Video program')}
											videoId={introPayload.videoBetweenBlocks.videoId}
											provider="vimeo"
										/>
									{:else}
										<LazyVideoEmbed
											embedSrc={`https://www.youtube-nocookie.com/embed/${introPayload.videoBetweenBlocks.videoId}`}
											title={introPayload.videoBetweenBlocks.title ??
												(isFamilyBootcamp46 ? FB46_INTRO_VIDEO_TITLE : 'Video program')}
											videoId={introPayload.videoBetweenBlocks.videoId}
											provider="youtube"
										/>
									{/if}
								</div>
							{/if}
							<article
								class="mx-auto max-w-5xl rounded-3xl border border-border bg-white p-6 shadow-[0_16px_40px_-28px_rgba(21,75,106,0.18)] md:p-8"
							>
								<div class="space-y-4 [font-family:var(--font-sans)]">
									{#each resolvedIntroBlocks as block, blockIndex (`intro-merged-${blockIndex}`)}
										<p class="text-base leading-relaxed text-muted-foreground md:text-[1.05rem]">
											{block.body}
										</p>
									{/each}
								</div>
							</article>
							{#if introPayload?.imageBetweenBlocks}
								<div class="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-border">
									<img
										src={introPayload.imageBetweenBlocks}
										alt={isFamilyBootcamp46 ? FB46_INTRO_IMAGE_ALT : ''}
										class="h-auto w-full object-cover"
										loading="lazy"
									/>
								</div>
							{/if}
						</section>
					{/if}
				{:else if section === 'curriculum_areas'}
					{@const cur = payload as {
						title?: string;
						areas?: { title: string }[];
						groups?: { title: string; areas?: { title: string }[] }[];
						image?: string;
					}}
					{#if isFamilyBootcamp46}
						<section
							class="relative left-1/2 right-1/2 -mx-[50vw] mb-16 w-screen border-b border-border bg-white px-0 pb-0"
							data-cms-type="program_section"
							data-cms-program-id={program.id}
							data-cms-section={section}
						>
							<div
								class="w-full overflow-hidden rounded-tl-[5.6rem] rounded-br-[5.6rem] bg-[#2f6f52] text-white md:rounded-tl-[7rem] md:rounded-br-[7rem]"
							>
								<div class="mx-auto w-full max-w-[1600px] px-6 py-12 md:px-10 md:py-14">
									<p
										class="text-center text-xs font-semibold tracking-[0.2em] text-white/85 uppercase [font-family:var(--font-sans)]"
									>
										Parcursul zilelor
									</p>
									{#if cur.title}
										<h2
											class="mx-auto mt-4 max-w-[1200px] text-center text-[1.45rem] leading-tight font-medium text-white md:text-[2rem] lg:text-[2.35rem] xl:text-[2.55rem] [font-family:var(--font-spectral)]"
										>
											{cur.title}
										</h2>
									{/if}
									<p
										class="mx-auto mt-4 max-w-3xl text-center text-sm leading-relaxed text-white/88 [font-family:var(--font-sans)] md:text-base"
									>
										{FB46_CURRICULUM_LEAD}
									</p>
									{#if cur.image}
										<div
											class="media-diagonal mx-auto mt-10 max-w-4xl overflow-hidden border-2 border-white/35 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.35)]"
										>
											<img
												src={cur.image}
												alt="Activități și atmosferă — tabără Family Bootcamp Kogaion pentru familii"
												class="h-auto w-full object-cover"
												loading="lazy"
											/>
										</div>
									{/if}
									{#if cur.groups?.length}
										<div class="mt-10 space-y-12">
											{#each cur.groups as group (`g-${group.title}`)}
												<div>
													<h3
														class="mb-6 text-center text-xl font-semibold text-white [font-family:var(--font-spectral)]"
													>
														{group.title}
													</h3>
													{#if group.areas?.length}
														<div class="grid gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
															{#each group.areas as area, areaIndex (`ga-${areaIndex}`)}
																{@const parsed = splitCurriculumTitle(area.title)}
																{@const curriculumHeadline = formatCurriculumHeadline(parsed.headline)}
																<article
																	class="media-diagonal-reverse group relative flex min-h-[19rem] flex-col overflow-hidden border-2 border-transparent bg-[#245f4e] p-7 shadow-[0_14px_36px_-18px_rgba(8,35,28,0.5)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-white hover:shadow-[0_20px_44px_-20px_rgba(5,24,18,0.55)] md:min-h-[17.5rem] md:p-8"
																>
																	<h4
																		class="pr-2 text-[1.35rem] leading-[1.12] font-medium tracking-[-0.02em] text-white md:text-[1.5rem] [font-family:var(--font-spectral)]"
																	>
																		{curriculumHeadline}
																	</h4>
																	{#if parsed.body}
																		<p
																			class="mt-4 flex-1 text-[0.98rem] leading-relaxed text-white/92 [font-family:var(--font-sans)]"
																		>
																			{parsed.body}
																		</p>
																	{/if}
																</article>
															{/each}
														</div>
													{/if}
												</div>
											{/each}
										</div>
									{:else if cur.areas?.length}
										<div class="mt-10 grid gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
											{#each cur.areas as area, i (`area-${i}`)}
												{@const parsed = splitCurriculumTitle(area.title)}
												{@const curriculumHeadline = formatCurriculumHeadline(parsed.headline)}
												<article
													class="media-diagonal-reverse group relative flex min-h-[19rem] flex-col overflow-hidden border-2 border-transparent bg-[#245f4e] p-7 shadow-[0_14px_36px_-18px_rgba(8,35,28,0.5)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-white hover:shadow-[0_20px_44px_-20px_rgba(5,24,18,0.55)] md:min-h-[17.5rem] md:p-8"
												>
													<h3
														class="pr-2 text-[1.35rem] leading-[1.12] font-medium tracking-[-0.02em] text-white md:text-[1.5rem] [font-family:var(--font-spectral)]"
													>
														{curriculumHeadline}
													</h3>
													{#if parsed.body}
														<p
															class="mt-4 flex-1 text-[0.98rem] leading-relaxed text-white/92 [font-family:var(--font-sans)]"
														>
															{parsed.body}
														</p>
													{/if}
												</article>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</section>
					{:else}
						<section
							class="mb-16 border-b border-border pb-16"
							data-cms-type="program_section"
							data-cms-program-id={program.id}
							data-cms-section={section}
						>
							<div class="mx-auto max-w-3xl text-center">
								<p
									class="text-xs font-semibold tracking-[0.2em] text-primary uppercase [font-family:var(--font-sans)]"
								>
									Parcursul zilelor
								</p>
								{#if cur.title}
									<h2
										class="mt-3 text-2xl font-medium tracking-[-0.02em] text-[#0c3044] md:text-3xl [font-family:var(--font-spectral)]"
									>
										{cur.title}
									</h2>
								{/if}
								<p class="mt-4 text-sm text-muted-foreground [font-family:var(--font-sans)] md:text-base">
									Fiecare temă leagă experiența din tabără de ce se întâmplă acasă: același limbaj,
									aceleași obiective, pași mici.
								</p>
							</div>
							{#if cur.image}
								<div class="mt-10 overflow-hidden rounded-3xl border border-border shadow-sm">
									<img src={cur.image} alt="" class="h-auto w-full object-cover" loading="lazy" />
								</div>
							{/if}
							{#if cur.groups?.length}
								<div class="mt-10 space-y-8">
									{#each cur.groups as group (`g-${group.title}`)}
										<div class="rounded-3xl border border-border bg-white p-6 shadow-sm md:p-8">
											<h3 class="text-lg font-semibold text-[#0c3044] [font-family:var(--font-spectral)]">
												{group.title}
											</h3>
											{#if group.areas?.length}
												<div class="mt-5 grid gap-4 sm:grid-cols-2">
													{#each group.areas as area, areaIndex (`ga-${areaIndex}`)}
														{@const parsed = splitCurriculumTitle(area.title)}
														{@const curriculumHeadline = formatCurriculumHeadline(parsed.headline)}
														<div
															class="flex flex-col gap-2 rounded-2xl border border-[#eef4fb] bg-[#f7fbff] p-5"
														>
															<p
																class="text-sm font-semibold leading-snug text-[#0c3044] [font-family:var(--font-sans)]"
															>
																{curriculumHeadline}
															</p>
															{#if parsed.body}
																<p
																	class="text-sm leading-relaxed text-muted-foreground [font-family:var(--font-sans)]"
																>
																	{parsed.body}
																</p>
															{/if}
														</div>
													{/each}
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{:else if cur.areas?.length}
								<div class="mt-10 grid gap-4 sm:grid-cols-2">
									{#each cur.areas as area, i (`area-${i}`)}
										{@const parsed = splitCurriculumTitle(area.title)}
										{@const curriculumHeadline = formatCurriculumHeadline(parsed.headline)}
										<div
											class="group flex flex-col gap-3 rounded-3xl border border-border bg-white p-6 shadow-[0_12px_32px_-24px_rgba(21,75,106,0.2)] transition hover:border-[#c25067]/35"
										>
											<span
												class="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c25067]/15 to-[#154b6a]/10 text-sm font-bold text-[#0c3044] [font-family:var(--font-sans)]"
											>
												{i + 1}
											</span>
											<div>
												<h3
													class="text-base font-semibold leading-snug text-[#0c3044] [font-family:var(--font-spectral)]"
												>
													{curriculumHeadline}
												</h3>
												{#if parsed.body}
													<p
														class="mt-2 text-sm leading-relaxed text-muted-foreground [font-family:var(--font-sans)]"
													>
														{parsed.body}
													</p>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</section>
					{/if}
				{:else if section === 'packages'}
					{@const pkg = payload as {
						title?: string;
						packages?: { title: string; items: string[] }[];
						note?: string;
					}}
					<section
						class="mb-16 border-b border-border pb-16"
						data-cms-type="program_section"
						data-cms-program-id={program.id}
						data-cms-section={section}
					>
						{#if pkg.title}
							<h2
								class="text-2xl font-medium text-[#0c3044] md:text-3xl [font-family:var(--font-spectral)]"
							>
								{pkg.title}
							</h2>
						{/if}
						{#if pkg.packages?.length}
							<div class="mt-8 space-y-4">
								{#each pkg.packages as p, pIndex (`pkg-${pIndex}`)}
									<details
										class="group rounded-3xl border border-border bg-white shadow-sm [&::-webkit-details-marker]:hidden"
										open={pIndex === 0}
									>
										<summary
											class="cursor-pointer list-none rounded-3xl px-5 py-4 text-base font-semibold text-[#0c3044] transition hover:bg-[#f7fbff] md:px-6 md:py-5 [font-family:var(--font-sans)]"
										>
											{p.title}
										</summary>
										<ul
											class="space-y-2 border-t border-[#eef4fb] px-5 py-5 text-sm text-muted-foreground md:px-6 [font-family:var(--font-sans)]"
										>
											{#each p.items as item (`${p.title}-${item.slice(0, 24)}`)}
												<li class="flex gap-2">
													<span class="mt-2 size-1 shrink-0 rounded-full bg-primary/70" aria-hidden="true"
													></span>
													<span>{item}</span>
												</li>
											{/each}
										</ul>
									</details>
								{/each}
							</div>
						{/if}
						{#if pkg.note}
							<p class="mt-6 text-sm text-muted-foreground [font-family:var(--font-sans)]">{pkg.note}</p>
						{/if}
					</section>
				{:else if section === 'extracurricular'}
					{@const extra = payload as {
						title?: string;
						groups?: { title: string; subtitle?: string; items: string[] }[];
						methods?: string;
					}}
					<section
						class="mb-16 border-b border-border pb-16"
						data-cms-type="program_section"
						data-cms-program-id={program.id}
						data-cms-section={section}
					>
						{#if extra.title}
							<h2
								class="text-2xl font-medium text-[#0c3044] md:text-3xl [font-family:var(--font-spectral)]"
							>
								{extra.title}
							</h2>
						{/if}
						{#if extra.groups?.length}
							<div class="mt-8 grid gap-6 md:grid-cols-2">
								{#each extra.groups as g, gi (`ex-${g.title}`)}
									<div class="rounded-3xl border border-border bg-white p-6 shadow-sm">
										<div class="flex items-start gap-3">
											<span
												class="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#dfeaf8] bg-[#f5fafd] text-sm font-semibold text-[#0c3044] [font-family:var(--font-sans)]"
											>
												{gi + 1}
											</span>
											<h3
												class="pt-1 text-lg font-semibold leading-snug text-[#0c3044] [font-family:var(--font-spectral)]"
											>
												{g.title}
											</h3>
										</div>
										{#if g.subtitle}
											<p class="mt-3 text-sm text-muted-foreground [font-family:var(--font-sans)]">
												{g.subtitle}
											</p>
										{/if}
										<ul class="mt-4 space-y-2 text-sm text-muted-foreground [font-family:var(--font-sans)]">
											{#each g.items as item (`${g.title}-${item.slice(0, 20)}`)}
												<li class="flex gap-2">
													<span class="mt-2 size-1 shrink-0 rounded-full bg-[#c25067]/60" aria-hidden="true"
													></span>
													<span>{item}</span>
												</li>
											{/each}
										</ul>
									</div>
								{/each}
							</div>
						{/if}
						{#if extra.methods}
							<p
								class="mt-8 rounded-2xl border border-border bg-[#f7fbff] p-5 text-sm leading-relaxed text-[#0c3044]/90 [font-family:var(--font-sans)]"
							>
								{extra.methods}
							</p>
						{/if}
					</section>
				{:else if section === 'benefits_family'}
					{@const ben = payload as {
						title?: string;
						items?: string[];
						note?: string;
						other?: string;
						otherItems?: string[];
					}}
					{@const displayTitle =
						ben.title === 'BENEFICII PENTRU FAMILIE' ? 'Beneficii pentru familie' : (ben.title ?? '')}
					<section
						class="mb-16 border-b border-border pb-16"
						data-cms-type="program_section"
						data-cms-program-id={program.id}
						data-cms-section={section}
					>
						{#if displayTitle}
							<h2
								class="text-2xl font-medium text-[#0c3044] md:text-3xl [font-family:var(--font-spectral)]"
							>
								{displayTitle}
							</h2>
						{/if}
						{#if ben.items?.length}
							<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{#each ben.items as item (`bf-${item.slice(0, 28)}`)}
									<div
										class="rounded-3xl border border-[#f0d6dc] bg-gradient-to-br from-[#fff5f7] to-[#f7fbff] p-5 shadow-sm"
									>
										<p class="text-sm leading-relaxed text-[#0c3044]/90 [font-family:var(--font-sans)]">
											{item}
										</p>
									</div>
								{/each}
							</div>
						{/if}
						{#if ben.note}
							<p
								class="mt-6 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted-foreground [font-family:var(--font-sans)]"
							>
								{ben.note}
							</p>
						{/if}
						{#if ben.other}
							<p class="mt-8 font-semibold text-[#0c3044] [font-family:var(--font-sans)]">{ben.other}</p>
						{/if}
						{#if ben.otherItems?.length}
							<ul class="mt-3 space-y-2 text-sm text-muted-foreground [font-family:var(--font-sans)]">
								{#each ben.otherItems as item (`bo-${item.slice(0, 24)}`)}
									<li class="flex gap-2">
										<span class="mt-2 size-1 shrink-0 rounded-full bg-primary/70" aria-hidden="true"></span>
										<span>{item}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</section>
				{:else if section === '__mentors__'}
					<section class="mb-16 border-b border-border pb-16">
						<div class="mx-auto max-w-3xl text-center">
							<p
								class="text-xs font-semibold tracking-[0.2em] text-primary uppercase [font-family:var(--font-sans)]"
							>
								{isFamilyBootcamp46 ? FB46_MENTORS_SECTION_EYEBROW : 'Echipa'}
							</p>
							<h2
								class="mt-3 text-2xl font-medium tracking-[-0.02em] text-[#0c3044] md:text-3xl [font-family:var(--font-spectral)]"
							>
								{isFamilyBootcamp46 ? FB46_MENTORS_SECTION_H2 : 'Mentorii care merg alături de voi'}
							</h2>
							<p class="mt-4 text-sm text-muted-foreground md:text-base [font-family:var(--font-sans)]">
								{isFamilyBootcamp46
									? FB46_MENTORS_SECTION_INTRO
									: 'Oameni cu experiență în educație și dezvoltare — prezenți, disponibili, ancorați în practică.'}
							</p>
						</div>
						<div class="mt-10 grid gap-6 md:grid-cols-2">
							{#each mentors as mentor (mentor.id)}
								{@const cleanedBio = cleanMentorBio(mentor.bio, mentor.yearJoined)}
								{@const bioParts = buildMentorBioParts(cleanedBio)}
								{@const isExpanded = !!expandedMentors[mentor.id]}
								<div
									class="group cursor-pointer overflow-hidden rounded-3xl border border-border bg-white shadow-[0_14px_40px_-28px_rgba(21,75,106,0.2)]"
									data-cms-type="mentor"
									data-cms-id={mentor.id}
									role="button"
									tabindex="0"
									aria-expanded={isExpanded}
									onclick={() => toggleMentorBio(mentor.id)}
									onkeydown={(event) => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault();
											toggleMentorBio(mentor.id);
										}
									}}
								>
									<div class="grid items-start gap-5 p-5 sm:grid-cols-[120px_1fr] sm:gap-6 sm:p-6">
										<div class="w-32 shrink-0 justify-self-start sm:w-32">
											<div
												class="aspect-square overflow-hidden rounded-3xl border border-border bg-muted/30"
												data-profile-photo
											>
												<img
													src={mentor.image ?? FALLBACK_IMAGE}
													alt={mentor.name}
													class="size-full object-cover"
													loading="lazy"
												/>
											</div>
										</div>
										<div class="min-w-0">
											<h3 class="text-lg font-semibold text-[#0c3044] [font-family:var(--font-spectral)]">
												{mentor.name}
											</h3>
											<p class="text-sm font-medium text-primary [font-family:var(--font-sans)]">
												{mentor.title}
											</p>
											{#if mentor.yearJoined}
												<p class="mt-1 text-sm text-muted-foreground [font-family:var(--font-sans)]">
													{m.mentors_since()}
													{mentor.yearJoined}
												</p>
											{/if}
											<div class="relative mt-3">
												<div
													class="overflow-hidden transition-[max-height] duration-300 ease-in-out"
													style={`max-height: ${isExpanded ? '220rem' : '4.8em'}`}
												>
													<p
														class="text-[0.9375rem] leading-relaxed text-muted-foreground [font-family:var(--font-sans)]"
													>
														{#each bioParts as part, partIndex (`bio-${mentor.id}-${partIndex}`)}
															{#if part.type === 'link'}
																<a
																	href={part.href}
																	target="_blank"
																	rel="noopener noreferrer"
																	class="font-medium text-primary underline decoration-primary/60 underline-offset-2"
																	onclick={(event) => event.stopPropagation()}
																>
																	{part.value}
																</a>
															{:else if part.type === 'break'}
																<br />
															{:else}
																{part.value}
															{/if}
														{/each}
													</p>
												</div>
												{#if !isExpanded}
													<div
														class="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent"
													></div>
												{/if}
											</div>
											<button
												type="button"
												class="mt-5 inline-flex items-center justify-center gap-3 text-[0.9rem] text-[var(--brand-blue)] [font-family:var(--font-sans)]"
												onclick={(event) => {
													event.stopPropagation();
													toggleMentorBio(mentor.id);
												}}
												aria-expanded={isExpanded}
											>
												<span
													class="btn-diagonal inline-flex size-10 items-center justify-center border border-current bg-transparent text-current transition-colors group-hover:bg-[var(--brand-blue)] group-hover:text-white"
													aria-hidden="true"
												>
													<ChevronRight class="size-4 transition-transform duration-300 {isExpanded ? 'rotate-90' : ''}" />
												</span>
												<span class="inline-flex min-w-[8.5rem] items-center text-left">
													{isExpanded ? 'Mai puțin' : 'Citește profilul'}
												</span>
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</section>
				{:else if section === 'benefits_main'}
					{@const benMain = payload as {
						eyebrow?: string;
						title?: string;
						intro?: string;
						items?: string[];
						note?: string;
						other?: string;
						otherItems?: string[];
						image?: string;
					}}
					{@const benefitsEyebrow =
						benMain.eyebrow ?? (isFamilyBootcamp46 ? FB46_BENEFITS_EYEBROW : undefined)}
					{@const benefitsTitle = isFamilyBootcamp46
						? FB46_BENEFITS_TITLE
						: (benMain.title ?? 'Beneficii principale și secundare')}
					{@const benefitsIntro =
						benMain.intro ?? (isFamilyBootcamp46 ? FB46_BENEFITS_INTRO : undefined)}
					{@const benSecondary = (getSection('benefits_secondary')?.payload as {
						title?: string;
						items?: string[];
						note?: string;
						other?: string;
						otherItems?: string[];
						image?: string;
					} | undefined)}
					{@const mergedBenefitItems = [...(benMain.items ?? []), ...(benSecondary?.items ?? [])]}
					{@const mergedOtherItems = [...(benMain.otherItems ?? []), ...(benSecondary?.otherItems ?? [])]}
					<section
						class="mb-16 border-b border-border pb-16"
						data-cms-type="program_section"
						data-cms-program-id={program.id}
						data-cms-section="benefits_combined"
					>
						<div class="mx-auto max-w-3xl text-center">
							{#if benefitsEyebrow}
								<p
									class="text-xs font-semibold tracking-[0.2em] text-primary uppercase [font-family:var(--font-sans)]"
								>
									{benefitsEyebrow}
								</p>
							{/if}
							<h2
								class="{benefitsEyebrow ? 'mt-3' : ''} text-2xl font-medium tracking-[-0.02em] text-[#0c3044] md:text-3xl [font-family:var(--font-spectral)]"
							>
								{benefitsTitle}
							</h2>
							{#if benefitsIntro}
								<p class="mt-4 text-sm text-muted-foreground md:text-base [font-family:var(--font-sans)]">
									{benefitsIntro}
								</p>
							{/if}
						</div>
						{#if benMain.image}
							<div class="mx-auto mt-8 max-w-4xl overflow-hidden rounded-3xl border border-border shadow-sm">
								<img
									src={benMain.image}
									alt={isFamilyBootcamp46 ? FB46_BENEFITS_IMAGE_ALT : ''}
									class="h-auto w-full object-cover"
									loading="lazy"
								/>
							</div>
						{/if}
						{#if mergedBenefitItems.length}
							<div class="mt-8 grid w-full gap-4 md:grid-cols-3 [font-family:var(--font-sans)]">
								{#each mergedBenefitItems as item (`bm-${item.slice(0, 32)}`)}
									<div
										class="rounded-2xl border border-border bg-white p-4 text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]"
									>
										<p class="flex gap-3">
											<span
												class="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--brand-blue)]"
												aria-hidden="true"
											></span>
											<span>{item}</span>
										</p>
									</div>
								{/each}
							</div>
						{/if}
						{#if benMain.note || benSecondary?.note}
							<p class="mt-6 text-sm text-muted-foreground [font-family:var(--font-sans)]">
								{benMain.note ?? benSecondary?.note}
							</p>
						{/if}
						{#if benMain.other || benSecondary?.other}
							<p class="mt-8 font-semibold text-[#0c3044] [font-family:var(--font-sans)]">
								{benMain.other ?? benSecondary?.other}
							</p>
						{/if}
						{#if mergedOtherItems.length}
							<ul class="mt-3 space-y-2 text-sm text-muted-foreground [font-family:var(--font-sans)]">
								{#each mergedOtherItems as item (`bmo-${item.slice(0, 24)}`)}
									<li class="flex gap-2">
										<span class="mt-2 size-1 shrink-0 rounded-full bg-[var(--brand-blue)]" aria-hidden="true"></span>
										<span>{item}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</section>
				{:else if section === 'benefits_secondary'}
					<!-- integrat în benefits_main -->
				{:else if section === 'gallery'}
					{@const gal = payload as { title?: string; images?: { url: string; alt?: string }[] }}
					{#if gal.images?.length}
						<section
							class="relative left-1/2 right-1/2 -mx-[50vw] mb-16 w-screen border-b border-border bg-white px-0 pb-14 md:pb-20"
							data-cms-type="program_section"
							data-cms-program-id={program.id}
							data-cms-section={section}
						>
							<div
								class="w-full overflow-hidden rounded-tl-[5.6rem] rounded-br-[5.6rem] bg-[#f8fbff] md:rounded-tl-[7rem] md:rounded-br-[7rem]"
							>
								<div class="w-full py-12 md:py-14">
									<div class="px-6 md:px-10">
										<p
											class="text-center text-xs font-semibold tracking-[0.22em] text-primary uppercase [font-family:var(--font-sans)]"
										>
											Galerie
										</p>
										<h2
											class="mx-auto mt-4 max-w-[1400px] text-center text-[1.45rem] leading-tight font-semibold text-foreground md:text-[2rem] lg:text-[2.35rem] [font-family:var(--font-spectral)]"
										>
											{gal.title ?? 'Momente din tabără'}
										</h2>
										<p
											class="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground md:text-base [font-family:var(--font-sans)]"
										>
											{isFamilyBootcamp46
												? FB46_GALLERY_LEAD
												: 'Câteva imagini din atmosfera taberei — lumină, joacă și momente sincere.'}
										</p>
									</div>
									<div class="mt-9 overflow-hidden">
										<!-- Mobil: carusel snap (ca pe homepage) -->
										<div
											id="program-gallery-track-mobile"
											class="flex gap-3 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] snap-x snap-mandatory md:hidden [&::-webkit-scrollbar]:hidden"
										>
											{#each galleryImages as img, i (`program-gallery-mobile-${img.url}-${i}`)}
												<div
													data-gallery-item
													class="media-diagonal w-[min(280px,calc(100vw-2.5rem))] shrink-0 snap-center overflow-hidden"
												>
													<img
														src={img.url}
														alt={img.alt ?? ''}
														class="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105"
														loading="lazy"
														draggable="false"
													/>
												</div>
											{/each}
										</div>
										<!-- md+: două rânduri derulabile -->
										<div class="hidden space-y-3 md:block">
											<div
												id="program-gallery-track-top"
												class="-mx-[145px] flex gap-3 overflow-x-auto px-[145px] scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
											>
												{#each programGalleryRowOne as img, i (`program-gallery-top-${img.url}-${i}`)}
													<div
														data-gallery-item
														class="media-diagonal block w-[260px] shrink-0 overflow-hidden md:w-[290px]"
													>
														<img
															src={img.url}
															alt={img.alt ?? ''}
															class="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105"
															loading="lazy"
															draggable="false"
														/>
													</div>
												{/each}
											</div>
											<div
												id="program-gallery-track-bottom"
												class="-mx-[145px] flex gap-3 overflow-x-auto px-[145px] scroll-smooth pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
											>
												{#each programGalleryRowTwo as img, i (`program-gallery-bottom-${img.url}-${i}`)}
													<div
														data-gallery-item
														class="media-diagonal block w-[260px] shrink-0 overflow-hidden md:w-[290px]"
													>
														<img
															src={img.url}
															alt={img.alt ?? ''}
															class="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105"
															loading="lazy"
															draggable="false"
														/>
													</div>
												{/each}
											</div>
										</div>
									</div>
									<div class="mt-8 flex items-center justify-center gap-4 px-6 md:px-10">
										<button
											type="button"
											class="btn-diagonal inline-flex size-11 items-center justify-center border border-[var(--brand-blue)] bg-transparent text-[var(--brand-blue)] transition-colors hover:bg-[var(--brand-blue)] hover:text-white"
											aria-label="Imagini anterioare"
											onclick={() => scrollProgramGallery(-1)}
										>
											<ArrowLeft class="size-4" />
										</button>
										<button
											type="button"
											class="btn-diagonal-reverse inline-flex size-11 items-center justify-center border border-[var(--brand-blue)] bg-transparent text-[var(--brand-blue)] transition-colors hover:bg-[var(--brand-blue)] hover:text-white"
											aria-label="Imagini următoare"
											onclick={() => scrollProgramGallery(1)}
										>
											<ArrowRight class="size-4" />
										</button>
									</div>
								</div>
							</div>
						</section>
					{/if}
				{:else if section === 'transport'}
					{@const trans = payload as { title?: string; body: string; contact?: string }}
					<section
						class="mb-16 border-b border-border pb-16"
						data-cms-type="program_section"
						data-cms-program-id={program.id}
						data-cms-section={section}
					>
						{#if trans.title}
							<h2
								class="text-center text-2xl font-medium text-[#0c3044] md:text-3xl [font-family:var(--font-spectral)]"
							>
								{trans.title}
							</h2>
						{/if}
						<p
							class="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground [font-family:var(--font-sans)] md:text-[0.95rem]"
						>
							{trans.body}
						</p>
						{#if trans.contact}
							<p
								class="mt-6 flex items-center justify-center gap-2 text-[#0c3044] [font-family:var(--font-sans)]"
							>
								<Phone class="size-5 shrink-0 text-primary" aria-hidden="true" />
								<a href="tel:+40736770669" class="font-medium underline-offset-2 hover:underline">
									{trans.contact}
								</a>
							</p>
						{/if}
					</section>
				{:else if section === 'menu'}
					{@const menu = payload as { title?: string; body: string; note?: string }}
					<section
						class="mb-16 border-b border-border pb-16"
						data-cms-type="program_section"
						data-cms-program-id={program.id}
						data-cms-section={section}
					>
						{#if menu.title}
							<h2
								class="text-center text-2xl font-medium text-[#0c3044] md:text-3xl [font-family:var(--font-spectral)]"
							>
								{menu.title}
							</h2>
						{/if}
						<p
							class="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground [font-family:var(--font-sans)] md:text-[0.95rem]"
						>
							{menu.body}
						</p>
						{#if menu.note}
							<p class="mt-6 text-sm text-muted-foreground [font-family:var(--font-sans)]">{menu.note}</p>
						{/if}
					</section>
				{:else if section === 'location'}
					{@const loc = payload as {
						eyebrow?: string;
						title?: string;
						intro?: string;
						subtitle?: string;
						body: string;
						amenities?: string[];
						closing?: string;
						image?: string;
						images?: string[];
						mapEmbedUrl?: string;
					}}
					{@const locationEyebrow =
						loc.eyebrow ?? (isFamilyBootcamp46 ? FB46_LOCATION_EYEBROW : undefined)}
					{@const locationTitle =
						isFamilyBootcamp46 && (!loc.title || loc.title.trim() === 'Locație')
							? FB46_LOCATION_TITLE
							: loc.title}
					{@const locationIntro =
						loc.intro ?? (isFamilyBootcamp46 ? FB46_LOCATION_INTRO : undefined)}
					<section
						class="mb-16 border-b border-border pb-16"
						data-cms-type="program_section"
						data-cms-program-id={program.id}
						data-cms-section={section}
					>
						{#if locationEyebrow || locationTitle || locationIntro}
							<div class="mx-auto max-w-3xl text-center">
								{#if locationEyebrow}
									<p
										class="text-xs font-semibold tracking-[0.2em] text-primary uppercase [font-family:var(--font-sans)]"
									>
										{locationEyebrow}
									</p>
								{/if}
								{#if locationTitle}
									<h2
										class="{locationEyebrow ? 'mt-3' : ''} text-2xl font-medium tracking-[-0.02em] text-[#0c3044] md:text-3xl [font-family:var(--font-spectral)]"
									>
										{locationTitle}
									</h2>
								{/if}
								{#if locationIntro}
									<p class="mt-4 text-sm text-muted-foreground md:text-base [font-family:var(--font-sans)]">
										{locationIntro}
									</p>
								{/if}
							</div>
						{/if}
						<div class="mt-8 grid gap-6 lg:grid-cols-2 lg:items-stretch">
							{#if loc.image}
								<div class="overflow-hidden rounded-3xl border border-border shadow-sm">
									<img
										src={loc.image}
										alt={isFamilyBootcamp46 ? FB46_LOCATION_MAIN_IMAGE_ALT : ''}
										class="h-full min-h-[16rem] w-full object-cover"
										loading="lazy"
									/>
								</div>
							{/if}
							<div class="overflow-hidden rounded-3xl border border-border shadow-sm">
								<iframe
									src={resolveMapEmbedUrl(loc.mapEmbedUrl) ||
										'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2799.4806759400667!2d25.338378376980906!3d45.439969071073676!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b3399ce553a2e1%3A0xae96c5429b8eb81e!2sPensiunea%20Nicoleta%20-%20Moieciu%20de%20Sus!5e0!3m2!1sen!2sro!4v1773683990236!5m2!1sen!2sro'}
									width="100%"
									height="100%"
									class="min-h-[16rem] w-full border-0"
									loading="lazy"
									referrerpolicy="no-referrer-when-downgrade"
									title="Locație program Kogaion"
								></iframe>
							</div>
						</div>
						<div class="mt-6">
							{#if loc.subtitle && loc.subtitle.trim() !== (locationTitle ?? '').trim()}
								<h3 class="text-xl font-semibold text-[#0c3044] [font-family:var(--font-spectral)]">
									{loc.subtitle}
								</h3>
							{/if}
							<p class="mt-3 text-sm leading-relaxed text-muted-foreground [font-family:var(--font-sans)] md:text-base">{loc.body}</p>
							{#if loc.amenities?.length}
								<ul class="mt-4 flex flex-wrap gap-2 [font-family:var(--font-sans)]">
									{#each loc.amenities as a (`am-${a}`)}
										<li class="rounded-full border border-[#d9e6f7] bg-[#f7fbff] px-3 py-1 text-sm text-[#0c3044]">
											{a}
										</li>
									{/each}
								</ul>
							{/if}
							{#if loc.closing}
								<p class="mt-4 text-sm text-muted-foreground [font-family:var(--font-sans)]">{loc.closing}</p>
							{/if}
						</div>
						{#if (loc.images ?? []).filter(Boolean).length}
							<div class="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3">
								{#each (loc.images ?? []).filter(Boolean) as url, locImgIdx (locImgIdx)}
									<div class="aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted/20">
										<img
											src={url}
											alt={isFamilyBootcamp46
												? `Pensiunea Nicoleta Moieciu — imagine ${locImgIdx + 1}, tabără familie Kogaion`
												: ''}
											class="size-full object-cover"
											loading="lazy"
										/>
									</div>
								{/each}
							</div>
						{/if}
					</section>
				{:else if section === 'testimonials'}
					{@const test = payload as {
						title?: string;
						items?: {
							videoId?: string;
							provider?: 'vimeo' | 'youtube';
							title?: string;
							quote?: string;
							author?: string;
						}[];
					}}
					{#if test.title || (test.items?.length ?? 0) > 0}
						<section
							class="mb-16 border-b border-border pb-16"
							data-cms-type="program_section"
							data-cms-program-id={program.id}
							data-cms-section={section}
						>
							{#if test.title}
								<h2
									class="text-2xl font-medium text-[#0c3044] md:text-3xl [font-family:var(--font-spectral)]"
								>
									{test.title}
								</h2>
							{/if}
							{#if test.items?.length}
								<div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
									{#each test.items as t, ti (`test-${ti}`)}
										{#if t.videoId}
											<div class="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
												{#if t.provider === 'vimeo'}
													<LazyVideoEmbed
														embedSrc={`https://player.vimeo.com/video/${t.videoId}?dnt=1`}
														title={t.title ?? 'Testimonial video'}
														videoId={t.videoId}
														provider="vimeo"
													/>
												{:else}
													<LazyVideoEmbed
														embedSrc={`https://www.youtube-nocookie.com/embed/${t.videoId}`}
														title={t.title ?? 'Testimonial video'}
														videoId={t.videoId}
														provider="youtube"
													/>
												{/if}
											</div>
										{:else if t.quote}
											<blockquote
												class="rounded-3xl border border-border bg-[#f7fbff] p-6 text-[#0c3044]/90 [font-family:var(--font-sans)]"
											>
												<p class="text-sm leading-relaxed italic md:text-base">„{t.quote}”</p>
												{#if t.author}
													<cite class="mt-3 block text-sm font-semibold not-italic text-muted-foreground">
														— {t.author}
													</cite>
												{/if}
											</blockquote>
										{/if}
									{/each}
								</div>
							{/if}
						</section>
					{/if}
				{:else if section === 'enrollment'}
					{@const rawEnroll = payload as EnrollPayload}
					{@const enroll = resolveEnrollment(rawEnroll)}
					{@const enrollButtons = enroll.buttons?.length ? enroll.buttons : defaultEnrollmentButtons()}
					{@const enrollTel = enrollPrimaryTel(enrollButtons)}
					{@const enrollWhatsapp = enrollWhatsappHref(enrollButtons)}
					{@const enrollTelBtns = enrollButtons.filter((b) => b.type === 'tel')}
					{@const enrollLinkBtns = enrollButtons.filter((b) => b.type === 'link')}
					<section
						class="relative left-1/2 right-1/2 -mx-[50vw] mb-8 w-screen bg-white px-0 pb-0"
						data-cms-type="program_section"
						data-cms-program-id={program.id}
						data-cms-section={section}
					>
						<div class="w-full overflow-hidden rounded-br-[5.6rem] bg-[#245f4e] text-white md:rounded-br-[7rem]">
							<div class="mx-auto w-full max-w-[1600px] px-6 py-12 md:px-10 md:py-14">
								<div
									class="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:items-start lg:gap-10 xl:gap-12"
								>
									<div class="min-w-0">
										{#if enroll.title}
											<h2
												class="text-[1.65rem] leading-tight font-medium text-white md:text-[2.1rem] [font-family:var(--font-spectral)]"
											>
												{enroll.title}
											</h2>
										{/if}
										{#if enroll.intro}
											<p
												class="mt-4 max-w-2xl text-base leading-relaxed text-white/85 [font-family:var(--font-sans)]"
											>
												{enroll.intro}
											</p>
										{/if}
										{#if enroll.steps?.length}
											<ol
												class="mt-8 max-w-2xl list-decimal space-y-3 pl-5 text-sm text-white/88 md:text-base [font-family:var(--font-sans)]"
											>
												{#each [...enroll.steps].sort((a, b) => a.order - b.order) as step (`step-${step.order}`)}
													<li>{step.label}</li>
												{/each}
											</ol>
										{/if}
										<div class="mt-8 flex flex-wrap items-stretch gap-3">
											{#each enrollTelBtns as btn, ei (`enroll-tel-${ei}`)}
												<a
													href={'tel:' + (btn.value?.replace(/\D/g, '') ?? '')}
													class="btn-diagonal inline-flex min-h-12 items-center justify-center gap-2 border border-white bg-white px-6 py-3 text-center text-[0.9rem] font-semibold normal-case tracking-normal text-[var(--brand-blue)] shadow-lg shadow-black/15 transition-colors hover:bg-transparent hover:text-white [font-family:var(--font-sans)] md:text-[0.96rem]"
												>
													<Phone class="size-5 shrink-0" aria-hidden="true" />
													{btn.label}
												</a>
											{/each}
											{#each enrollLinkBtns as btn, ei (`enroll-link-${ei}`)}
												<a
													href={btn.href ?? contentHref('contact')}
													class="btn-diagonal inline-flex min-h-12 items-center justify-center gap-2 border border-white bg-transparent px-6 py-3 text-center text-[0.9rem] font-semibold normal-case tracking-normal text-white transition-colors hover:bg-white hover:text-[var(--brand-blue)] [font-family:var(--font-sans)] md:text-[0.96rem]"
												>
													{btn.label}
												</a>
											{/each}
										</div>
									</div>
									{#if isFamilyBootcamp46}
										<aside
											class="mt-10 flex h-fit w-full shrink-0 flex-col rounded-tl-[1.25rem] rounded-br-[1.25rem] border-2 border-[#25D366]/45 bg-[#1a332b]/75 p-8 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.5)] backdrop-blur-sm [font-family:var(--font-sans)] md:rounded-tl-[1.4rem] md:rounded-br-[1.4rem] md:p-9 lg:mt-0"
										>
											<p
												class="text-[1.2rem] font-semibold leading-tight tracking-tight text-[#25D366] md:text-[1.3rem]"
											>
												{FB46_ENROLLMENT_SIDEBAR_TITLE}
											</p>
											<p class="mt-3 text-sm leading-relaxed text-white/88 md:text-[0.95rem]">
												{FB46_ENROLLMENT_SIDEBAR_BODY}
											</p>
											<a
												href={enrollWhatsapp}
												target="_blank"
												rel="noopener noreferrer"
												class="mt-6 inline-flex w-full min-h-[3.1rem] items-center justify-center gap-2 rounded-tl-[1.05rem] rounded-br-[1.05rem] border-0 bg-[#25D366] px-4 py-3 text-center text-[0.95rem] font-semibold text-[#0a1f18] shadow-[0_10px_28px_-14px_rgba(0,0,0,0.55)] transition-[filter,transform] hover:brightness-105 active:scale-[0.99]"
											>
												<MessageCircle class="size-5 shrink-0" aria-hidden="true" />
												{FB46_ENROLLMENT_SIDEBAR_WHATSAPP_CTA}
											</a>
											<p class="mt-4 text-center text-xs text-white/65">
												{FB46_ENROLLMENT_SIDEBAR_TEL_HINT}
												<a
													href={enrollTel.href}
													class="ml-1 font-semibold text-white/95 underline decoration-white/40 underline-offset-2 hover:decoration-white"
												>
													{enrollTel.display}
												</a>
											</p>
										</aside>
									{/if}
								</div>
							</div>
						</div>
					</section>
				{/if}
			{/each}
		</div>
	{:else}
		<div class="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24 lg:px-14">
			<div class="rounded-3xl border border-border bg-white p-8 shadow-sm md:p-12">
				{#if program.description}
					<p class="text-lg leading-relaxed text-muted-foreground [font-family:var(--font-sans)]">
						{program.description}
					</p>
				{/if}
				<div class="mt-8 space-y-4 border-t border-border pt-8 [font-family:var(--font-sans)]">
					{#if buildScheduleLines(program.datesText, program.durationText).length > 0}
						<p class="flex items-start gap-3 text-[#0c3044]">
							<Calendar class="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
							<span class="space-y-1 text-sm md:text-base">
								{#each buildScheduleLines(program.datesText, program.durationText) as line, idx (`fb-${idx}`)}
									<span class="block">{line}</span>
								{/each}
							</span>
						</p>
					{/if}
					<p class="flex items-center gap-3 text-[#0c3044]">
						<MapPin class="size-5 shrink-0 text-primary" aria-hidden="true" />
						<span class="text-sm md:text-base">{program.locationText ?? program.location ?? ''}</span>
					</p>
				</div>
				<div class="mt-10 flex flex-wrap gap-3">
					<Button href={contentHref('programs')} variant="outline" class="rounded-2xl gap-2">
						<ArrowLeft class="size-4 shrink-0" aria-hidden="true" />
						{m.nav_programs()}
					</Button>
					<Button href={contentHref('home')} class="rounded-2xl gap-2">
						{m.nav_home()}
						<ChevronRight class="size-4 shrink-0" aria-hidden="true" />
					</Button>
				</div>
			</div>
		</div>
	{/if}
</main>

<style>
	:global(main[data-cms-type='program'] .rounded-3xl) {
		border-radius: 0 !important;
		border-top-left-radius: 2rem !important;
		border-bottom-right-radius: 2rem !important;
	}

	:global(main[data-cms-type='program'] .rounded-2xl) {
		border-radius: 0 !important;
		border-top-left-radius: 1.25rem !important;
		border-bottom-right-radius: 1.25rem !important;
	}
</style>
