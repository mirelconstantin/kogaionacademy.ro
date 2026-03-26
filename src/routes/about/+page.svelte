<script lang="ts">
	import { resolve } from '$app/paths';
	import Hero from '$lib/components/Hero.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { contentHref } from '$lib/content-routes';
	import { formatAgeRangeLabel } from '$lib/program-schedule';
	import type { ProgramForDisplay } from '$lib/server/content';
	import Target from '@lucide/svelte/icons/target';
	import Users from '@lucide/svelte/icons/users';
	import Calendar from '@lucide/svelte/icons/calendar';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	let {
		data
	}: {
		data: {
			sections?: Record<string, Record<string, unknown>>;
			hero?: {
				videoUrl?: string;
				posterUrl?: string;
				ctaPrimaryLabel?: string;
				ctaPrimaryLink?: string;
				ctaSecondaryLabel?: string;
				ctaSecondaryLink?: string;
			} | null;
			canonicalUrl?: string;
			baseUrl?: string;
			programs?: ProgramForDisplay[];
		};
	} = $props();

	type HeroPayload = {
		label?: string;
		title?: string;
		tagline?: string;
		subline?: string;
		ctaLabel?: string;
		backgroundImage?: string;
	};
	type LetterPayload = {
		greeting?: string;
		p1?: string;
		p2?: string;
		p3?: string;
		visionTitle?: string;
		visionBody?: string;
	};
	type TimelineItem = { year: string; title: string; text: string };
	type IntegratedPayload = { title?: string; intro?: string; items?: string[] };
	type TransPayload = { title?: string; body?: string };
	type FoundersPayload = { title?: string; intro?: string };
	type CtaPayload = {
		programsTitle?: string;
		programsIntro?: string;
		mentorsTitle?: string;
		mentorsLead?: string;
		connect?: string;
	};
	type MissionPayload = { title?: string; bullet1?: string; bullet2?: string; bullet3?: string };
	type AboutStat = { key: string; n: string; l: string };

	const s = $derived(data?.sections ?? {});
	const locale = $derived(getLocale());

	const aboutHeroPayload = $derived(s.hero as HeroPayload | undefined);
	const heroForVideo = $derived({
		videoUrl: data?.hero?.videoUrl,
		posterUrl: aboutHeroPayload?.backgroundImage || data?.hero?.posterUrl,
		ctaPrimaryLabel: aboutHeroPayload?.ctaLabel ?? data?.hero?.ctaPrimaryLabel,
		ctaPrimaryLink: data?.hero?.ctaPrimaryLink,
		ctaSecondaryLabel: data?.hero?.ctaSecondaryLabel,
		ctaSecondaryLink: data?.hero?.ctaSecondaryLink
	});

	const heroLabel = $derived((aboutHeroPayload?.label ?? '').trim());
	const heroTitle = $derived(aboutHeroPayload?.title ?? m.about_title());
	const heroTagline = $derived(aboutHeroPayload?.tagline ?? m.about_hero_tagline());
	const heroSubline = $derived(aboutHeroPayload?.subline ?? m.about_hero_subline());

	const letterGreeting = $derived((s.letter as LetterPayload)?.greeting ?? m.about_letter_greeting());
	const letterP1 = $derived((s.letter as LetterPayload)?.p1 ?? m.about_potential_paragraph1());
	const letterP2 = $derived((s.letter as LetterPayload)?.p2 ?? m.about_potential_paragraph2());
	const letterP3 = $derived((s.letter as LetterPayload)?.p3 ?? m.about_potential_paragraph3());
	const visionTitle = $derived((s.letter as LetterPayload)?.visionTitle ?? m.about_vision_title());
	const visionBody = $derived((s.letter as LetterPayload)?.visionBody ?? m.about_vision_body());

	const timelinePayload = $derived(
		s.timeline as { title?: string; intro?: string; items?: TimelineItem[] } | undefined
	);
	const timelineIntroDefault = $derived(
		locale === 'ro'
			? 'Câteva repere care arată cum am crescut ca academie și cum ne-am păstrat focusul pe copil, familie și învățare cu sens.'
			: 'A few milestones showing how we have grown as an academy while keeping children, families, and meaningful learning at the center.'
	);
	const timelineIntro = $derived((timelinePayload?.intro ?? '').trim() || timelineIntroDefault);
	const storyTimeline = $derived(
		timelinePayload?.items?.length
			? timelinePayload.items
			: [
					{ year: '2013', title: m.about_timeline_2013_title(), text: m.about_founders_intro() },
					{ year: '2016', title: m.about_timeline_2016_title(), text: m.about_campaign_body() },
					{ year: m.about_timeline_year_today(), title: m.about_timeline_today_title(), text: m.about_hero_paradigm() }
				]
	);

	const integratedPayload = $derived(s.integrated as IntegratedPayload | undefined);
	const transPayload = $derived(s.transdisciplinary as TransPayload | undefined);
	const missionPayload = $derived(s.mission as MissionPayload | undefined);
	const missionTitle = $derived(missionPayload?.title ?? m.about_mission_title());
	const missionBullets = $derived(
		[
			missionPayload?.bullet1 ?? m.about_mission_bullet1(),
			missionPayload?.bullet2 ?? m.about_mission_bullet2(),
			missionPayload?.bullet3 ?? m.about_mission_bullet3()
		] as const
	);
	const missionIcons = [Target, Users, Calendar] as const;

	const foundersPayload = $derived(s.founders as FoundersPayload | undefined);

	const ctaPayload = $derived(s.cta_section as CtaPayload | undefined);

	const programsHref = contentHref('programs');
	const highlightedPrograms = $derived((data?.programs ?? []).slice(0, 4));
	const mentorsHref = contentHref('mentors');
	const contactHref = contentHref('contact');

	const seo = $derived(
		locale === 'ro'
			? {
					title:
						'Kogaion Gifted Academy | Despre noi — educație integrată, afterschool București, tabere (3–18 ani)',
					description:
						'Află cine suntem: educație integrată și mentorat pentru copii 3–18 ani — afterschool și enrichment în București, tabere și programe pentru familii. Misiune, metodologie și comunitate pentru creștere cu sens.'
				}
			: {
					title: 'Kogaion Gifted Academy | About — mission, integrated education & programs',
					description:
						'Learn about Kogaion Gifted Academy: integrated, individualized learning for children and teens, after-school and camps — mission, approach, and programs.'
				}
	);

	const ogImagePath = '/media/uploads/home/hero-poster.webp';
	const ogImageUrl = $derived(
		data?.baseUrl ? `${data.baseUrl}${ogImagePath}` : ogImagePath
	);
	const canonical = $derived(data?.canonicalUrl ?? '');

	/** Path-uri din contentHref / CMS; păstrează query (ex. ?age=3-6). */
	function resolvePath(href: string): string {
		const q = href.indexOf('?');
		const pathname = q === -1 ? href : href.slice(0, q);
		const search = q === -1 ? '' : href.slice(q);
		const r = resolve as unknown as (p: string) => string;
		return `${r(pathname)}${search}`;
	}

	const aboutUi = $derived(
		locale === 'ro' ? { foundersEyebrow: 'Echipa fondatoare' } : { foundersEyebrow: 'Founding team' }
	);
	const aboutLetterExtras = $derived(
		locale === 'ro'
			? [
					'Nu vindem „încă o activitate”. Construim direcție: obiective clare, ritm respectat și spații în care copilul poate încerca, ajusta și reveni mai stăpân pe el.',
					'Nu ne oprim la un rezultat de moment. Vrem autonomie, reziliență și plăcerea de a învăța ani la rând — pentru că asta ține și în viața adultă.'
				]
			: [
					'We are not selling “one more activity”. We build direction: clear goals, respectful pacing, and room to try, adjust, and return with stronger agency.',
					'We do not stop at a single short-term win. We grow autonomy, resilience, and the habit of learning for years — because that is what endures.'
				]
	);
	const aboutVisionExtra = $derived(
		locale === 'ro'
			? 'În practică, asta înseamnă proiecte care contează, feedback sincer și o relație reală cu familia ta. Împreună modelăm obiceiuri: curiozitate, inițiativă, responsabilitate și încrederea că poți crește fără să te pierzi pe drum.'
			: 'In practice, that means meaningful projects, honest feedback, and a real partnership with your family. Together we build habits: curiosity, initiative, responsibility, and the confidence to grow without losing yourself along the way.'
	);
	const aboutStats = $derived(
		locale === 'ro'
			? ([
					{ key: 'y', n: '10+', l: 'ani de practică în educație integrată' },
					{ key: 'a', n: '3–18', l: 'ani, trasee diferențiate pe etape' },
					{ key: 'f', n: '130+', l: 'familii implicate în comunitate, anual' }
				] satisfies AboutStat[])
			: ([
					{ key: 'y', n: '10+', l: 'years building integrated learning paths' },
					{ key: 'a', n: '3–18', l: 'years, differentiated by developmental stage' },
					{ key: 'f', n: '130+', l: 'families engaged in the community each year' }
				] satisfies AboutStat[])
	);
	const imgAltIntegrated = $derived(
		locale === 'ro'
			? 'Copii la activitate educațională integrată, lucru în echipă și învățare practică'
			: 'Children in an integrated educational activity, teamwork and hands-on learning'
	);
	const imgAltTrans = $derived(
		locale === 'ro'
			? 'Familie și copii în program educațional Kogaion, învățare împreună'
			: 'Family and children in a Kogaion educational programme, learning together'
	);
	const transBodyParagraphs = $derived.by(() => {
		const body = transPayload?.body ?? m.about_transdisciplinary_body();
		const sentences = body
			.split(/(?<=[.!?])\s+/)
			.map((s) => s.trim())
			.filter(Boolean);
		if (sentences.length <= 2) return [body];
		const paragraphs: string[] = [];
		for (let i = 0; i < sentences.length; i += 2) {
			paragraphs.push(sentences.slice(i, i + 2).join(' '));
		}
		return paragraphs;
	});
</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:locale" content={locale === 'ro' ? 'ro_RO' : 'en_US'} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
	<meta name="twitter:image" content={ogImageUrl} />
</svelte:head>

<main class="min-h-dvh bg-white">
	<div class="relative">
		<Hero
			hero={heroForVideo}
			heroLabel={heroLabel}
			introHeading={heroTitle}
			introBody={heroTagline}
			introBodySecondary={heroSubline}
			cmsPage="about"
			cmsSection="hero"
			cmsHeadingField="title"
			cmsBodyField="tagline"
			cmsBodySecondaryField="subline"
			showEyebrow={true}
			eyebrowCmsField="label"
			headingMultiline={true}
		/>
	</div>

	<section class="relative border-b border-border bg-white px-6 py-10 md:py-12" aria-label={locale === 'ro' ? 'Repere Kogaion' : 'Kogaion highlights'}>
		<div class="mx-auto max-w-6xl">
			<div class="grid gap-5 md:grid-cols-3 md:gap-6">
				{#each aboutStats as stat (stat.key)}
					<div
						class="media-diagonal border border-[#dfeaf8] bg-[#f7fbff] px-6 py-7 text-center shadow-[0_10px_24px_-18px_rgba(21,75,106,0.18)] md:px-7 md:py-8"
					>
						<p class="text-[2.1rem] font-semibold leading-none text-[#0c3044] md:text-[2.35rem] [font-family:var(--font-spectral)]">{stat.n}</p>
						<p class="mt-3 text-sm leading-relaxed text-muted-foreground [font-family:var(--font-sans)]">{stat.l}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="relative border-b border-border bg-[#fcfeff] px-6 py-14 md:py-20">
		<div class="mx-auto max-w-6xl">
			<div
				class="grid gap-12 lg:gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,22.5rem)] xl:grid-cols-[minmax(0,1.12fr)_minmax(0,24.5rem)]"
			>
				<div class="min-w-0 space-y-8">
					<article class="space-y-6">
						<p
							class="text-xs font-semibold tracking-[0.14em] text-[#0c3044]/75 uppercase [font-family:var(--font-sans)]"
						>
							{m.about_intro_letter()}
						</p>
						<h2
							class="text-[1.6rem] leading-[1.15] font-medium tracking-[-0.01em] text-[#0c3044] md:text-[2.05rem] [font-family:var(--font-spectral)]"
						>
							{m.about_letter_seo_heading()}
						</h2>
						<div data-cms-type="section" data-cms-page="about" data-cms-section="letter" data-cms-field="greeting" data-cms-locale="ro">
							<p class="text-lg font-semibold text-[#0c3044] [font-family:var(--font-sans)]">{letterGreeting}</p>
						</div>
						<div class="space-y-5 text-base leading-relaxed text-muted-foreground md:text-[1.06rem] [font-family:var(--font-sans)]">
							<div data-cms-type="section" data-cms-page="about" data-cms-section="letter" data-cms-field="p1" data-cms-locale="ro">
								<p>{letterP1}</p>
							</div>
							<div data-cms-type="section" data-cms-page="about" data-cms-section="letter" data-cms-field="p2" data-cms-locale="ro">
								<p>{letterP2}</p>
							</div>
							<div data-cms-type="section" data-cms-page="about" data-cms-section="letter" data-cms-field="p3" data-cms-locale="ro">
								<p>{letterP3}</p>
							</div>
							{#each aboutLetterExtras as paragraph (`letter-extra-${paragraph.slice(0, 32)}`)}
								<p>{paragraph}</p>
							{/each}
						</div>
						<div class="flex flex-wrap gap-3 pt-2">
							<a
								href={resolvePath(programsHref)}
								class="btn-diagonal inline-flex min-h-12 items-center justify-center border border-[var(--brand-blue)] bg-[var(--brand-blue)] px-6 py-3 text-center text-[0.9rem] font-semibold text-white transition-colors hover:border-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue-hover)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] md:text-[0.96rem] [font-family:var(--font-sans)]"
							>
								{m.about_cta_discover_programs()}
							</a>
							<a
								href={resolvePath(contactHref)}
								class="btn-diagonal inline-flex min-h-12 items-center justify-center border border-[var(--brand-blue)] bg-transparent px-6 py-3 text-center text-[0.9rem] font-semibold text-[var(--brand-blue)] transition-colors hover:border-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue-hover)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] md:text-[0.96rem] [font-family:var(--font-sans)]"
							>
								{m.home_cta_contact_label()}
							</a>
						</div>
					</article>
				</div>
				<aside
					class="h-fit space-y-5 rounded-tl-[2.5rem] rounded-br-[2.5rem] border border-[#d9e6f7] bg-white p-6 shadow-[0_16px_40px_-22px_rgba(21,75,106,0.22)] md:p-8 lg:sticky lg:top-28"
				>
					<div data-cms-type="section" data-cms-page="about" data-cms-section="letter" data-cms-field="visionTitle" data-cms-locale="ro">
						<h3
							class="text-[1.35rem] leading-tight font-medium text-[#0c3044] md:text-[1.65rem] [font-family:var(--font-spectral)]"
						>
							{visionTitle}
						</h3>
					</div>
					<div data-cms-type="section" data-cms-page="about" data-cms-section="letter" data-cms-field="visionBody" data-cms-locale="ro">
						<p class="text-base leading-relaxed text-muted-foreground md:text-[1.05rem] [font-family:var(--font-sans)]">
							{visionBody}
						</p>
					</div>
					<p class="text-base leading-relaxed text-muted-foreground md:text-[1.05rem] [font-family:var(--font-sans)]">{aboutVisionExtra}</p>
					<p class="border-t border-border pt-5 text-base leading-relaxed text-muted-foreground md:text-[1.05rem] [font-family:var(--font-sans)]">{m.about_hero_paradigm()}</p>
				</aside>
			</div>
		</div>
	</section>

	<section
		class="relative border-b border-border bg-white px-6 py-14 md:py-20"
		data-cms-type="section"
		data-cms-page="about"
		data-cms-section="mission"
		data-cms-locale="ro"
	>
		<div class="mx-auto max-w-6xl">
			<div class="mx-auto max-w-3xl text-center">
				<p class="text-xs font-semibold tracking-[0.2em] text-primary uppercase [font-family:var(--font-sans)]">
					{m.about_mission_eyebrow()}
				</p>
				<div data-cms-type="section" data-cms-page="about" data-cms-section="mission" data-cms-field="title" data-cms-locale="ro">
					<h2 class="mt-4 text-[1.65rem] font-medium text-[#0c3044] md:text-[2.1rem] [font-family:var(--font-spectral)]">
						{missionTitle}
					</h2>
				</div>
			</div>
			<div class="mt-10 grid gap-6 md:grid-cols-3">
				{#each missionBullets as bullet, i (`mission-${i}`)}
					{@const Icon = missionIcons[i] ?? Target}
					<article
						class="media-diagonal flex gap-4 border border-[#dfeaf8] bg-[#f7fbff] p-6 shadow-[0_10px_24px_-18px_rgba(21,75,106,0.18)] md:gap-5 md:p-7"
					>
						<div class="shrink-0 text-[var(--brand-blue)]" aria-hidden="true">
							<Icon class="size-9 md:size-10" />
						</div>
						<p
							class="min-w-0 flex-1 text-base leading-relaxed text-[#0c3044]/90 [font-family:var(--font-sans)]"
							data-cms-type="section"
							data-cms-page="about"
							data-cms-section="mission"
							data-cms-field={'bullet' + (i + 1)}
							data-cms-locale="ro"
						>
							{bullet}
						</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="relative border-b border-border bg-white px-0 py-14 md:py-20">
		<div
			class="w-full overflow-hidden rounded-tr-[5.6rem] rounded-bl-[5.6rem] bg-[#154b6a] text-white md:rounded-tr-[7rem] md:rounded-bl-[7rem]"
		>
			<div class="mx-auto w-full max-w-[1600px] px-6 py-12 md:px-10 md:py-14">
				<div data-cms-type="section" data-cms-page="about" data-cms-section="timeline" data-cms-field="title" data-cms-locale="ro">
					<h2
						class="mx-auto max-w-[900px] text-center text-[1.45rem] leading-tight font-medium text-white md:text-[2rem] lg:text-[2.2rem] [font-family:var(--font-spectral)]"
					>
						{timelinePayload?.title ?? m.about_timeline_title()}
					</h2>
				</div>
				<div data-cms-type="section" data-cms-page="about" data-cms-section="timeline" data-cms-field="intro" data-cms-locale="ro">
					<p
						class="mx-auto mt-4 max-w-3xl text-center text-sm leading-relaxed text-white/88 [font-family:var(--font-sans)] md:text-base"
					>
						{timelineIntro}
					</p>
				</div>
				<div class="mt-10 grid gap-5 md:grid-cols-3 md:gap-6">
					{#each storyTimeline as item, i (item.year)}
						<article
							class="media-diagonal-reverse flex min-h-[14rem] flex-col border-2 border-white/15 bg-white/10 p-6 shadow-[0_14px_36px_-18px_rgba(0,0,0,0.35)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-white/40 md:min-h-[15rem] md:p-7"
						>
							<div
								data-cms-type="section"
								data-cms-page="about"
								data-cms-section="timeline"
								data-cms-field={'items.' + i + '.year'}
								data-cms-locale="ro"
							>
								<p class="text-xs font-semibold tracking-[0.25em] text-white/75 uppercase [font-family:var(--font-sans)]">
									{item.year}
								</p>
							</div>
							<div
								data-cms-type="section"
								data-cms-page="about"
								data-cms-section="timeline"
								data-cms-field={'items.' + i + '.title'}
								data-cms-locale="ro"
							>
								<h3 class="mt-3 text-[1.25rem] leading-snug font-medium text-white [font-family:var(--font-spectral)]">
									{item.title}
								</h3>
							</div>
							<div
								data-cms-type="section"
								data-cms-page="about"
								data-cms-section="timeline"
								data-cms-field={'items.' + i + '.text'}
								data-cms-locale="ro"
							>
								<p class="mt-3 flex-1 text-[0.95rem] leading-relaxed text-white/88 [font-family:var(--font-sans)]">
									{item.text}
								</p>
							</div>
						</article>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section class="relative border-b border-border bg-white px-6 py-14 md:py-20">
		<div class="mx-auto max-w-6xl space-y-16 md:space-y-24">
				<div class="grid gap-10 md:items-center md:gap-12 lg:gap-16 md:grid-cols-[1.05fr_0.95fr]">
					<div
						class="media-diagonal relative aspect-[4/3] min-h-[18rem] w-full overflow-hidden bg-[#e8f0fa] shadow-[0_20px_50px_-28px_rgba(12,48,68,0.35)] md:aspect-auto md:min-h-[26rem] lg:min-h-[28rem]"
					>
						<img
							src="/media/uploads/about/age-7-12.webp"
							alt={imgAltIntegrated}
							class="size-full object-cover"
						/>
						<div
							class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#0c3044]/10 via-transparent to-transparent"
						></div>
						<div
							class="media-diagonal-soft absolute right-4 bottom-4 z-[1] w-fit max-w-[calc(100%-2.5rem)] border border-white/70 bg-white/92 px-4 py-2.5 text-[0.82rem] font-medium leading-snug text-[#0c3044] shadow-[0_12px_28px_-18px_rgba(12,48,68,0.28)] backdrop-blur-sm [font-family:var(--font-sans)] md:right-6 md:bottom-6 md:max-w-[min(100%-2.5rem,22rem)]"
						>
							{m.about_integrated_title()}
						</div>
					</div>
					<div class="flex flex-col justify-center">
						<p class="text-xs font-semibold tracking-[0.14em] text-[#0c3044]/75 uppercase [font-family:var(--font-sans)]">
							{m.about_integrated_title()}
						</p>
						<div data-cms-type="section" data-cms-page="about" data-cms-section="integrated" data-cms-field="title" data-cms-locale="ro">
							<h2
								class="mt-4 max-w-[34rem] text-[1.45rem] leading-[1.18] font-medium tracking-[-0.01em] text-[#0c3044] md:text-[1.85rem] [font-family:var(--font-spectral)]"
							>
								{integratedPayload?.title ?? m.about_integrated_title()}
							</h2>
						</div>
						<div data-cms-type="section" data-cms-page="about" data-cms-section="integrated" data-cms-field="intro" data-cms-locale="ro">
							<p class="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-[1.05rem] [font-family:var(--font-sans)]">
								{integratedPayload?.intro ?? m.about_integrated_intro()}
							</p>
						</div>
						<ul
							class="mt-6 max-w-xl list-outside list-disc space-y-2.5 pl-[1.1em] text-base leading-relaxed text-muted-foreground marker:text-[#0c3044] md:text-[1.02rem] [font-family:var(--font-sans)]"
						>
							{#each (integratedPayload?.items ?? [m.about_integrated_item1(), m.about_integrated_item2(), m.about_integrated_item3(), m.about_integrated_item4(), m.about_integrated_item5()]) as item, j (`int-${j}`)}
								<li class="pl-1" data-cms-type="section" data-cms-page="about" data-cms-section="integrated" data-cms-field={'items.' + j} data-cms-locale="ro">
									{item}
								</li>
							{/each}
						</ul>
					</div>
				</div>

				<div class="mt-16 grid gap-10 md:items-center md:gap-12 lg:gap-16 md:grid-cols-[0.95fr_1.05fr]">
					<div
						class="media-diagonal relative aspect-[4/3] min-h-[18rem] w-full overflow-hidden bg-[#e8f0fa] shadow-[0_20px_50px_-28px_rgba(12,48,68,0.35)] md:order-2 md:aspect-auto md:min-h-[26rem] lg:min-h-[28rem]"
					>
						<img
							src="/media/uploads/programe/kogaion-gifted-family/kogaion-gifted-family-cover.webp"
							alt={imgAltTrans}
							class="size-full object-cover"
						/>
						<div
							class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#0c3044]/10 via-transparent to-transparent"
						></div>
						<div
							class="media-diagonal-soft absolute top-4 left-4 z-[1] w-fit max-w-[calc(100%-2.5rem)] border border-white/70 bg-white/92 px-4 py-2.5 text-[0.82rem] font-medium leading-snug text-[#0c3044] shadow-[0_12px_28px_-18px_rgba(12,48,68,0.28)] backdrop-blur-sm [font-family:var(--font-sans)] md:top-6 md:left-6 md:max-w-[min(100%-2.5rem,22rem)]"
						>
							{m.about_transdisciplinary_title()}
						</div>
					</div>
					<div class="flex flex-col justify-center md:order-1">
						<p class="text-xs font-semibold tracking-[0.14em] text-[#0c3044]/75 uppercase [font-family:var(--font-sans)]">
							{m.about_transdisciplinary_title()}
						</p>
						<div data-cms-type="section" data-cms-page="about" data-cms-section="transdisciplinary" data-cms-field="title" data-cms-locale="ro">
							<h2
								class="mt-4 max-w-[34rem] text-[1.45rem] leading-[1.18] font-medium tracking-[-0.01em] text-[#0c3044] md:text-[1.85rem] [font-family:var(--font-spectral)]"
							>
								{transPayload?.title ?? m.about_transdisciplinary_title()}
							</h2>
						</div>
						<div data-cms-type="section" data-cms-page="about" data-cms-section="transdisciplinary" data-cms-field="body" data-cms-locale="ro">
							<div class="mt-5 max-w-xl space-y-4 text-base leading-relaxed text-muted-foreground md:text-[1.05rem] [font-family:var(--font-sans)]">
								{#each transBodyParagraphs as paragraph (`trans-par-${paragraph.slice(0, 24)}`)}
									<p>{paragraph}</p>
								{/each}
							</div>
						</div>
						<a
							href={resolvePath(programsHref)}
							class="btn-diagonal mt-9 inline-flex min-h-12 items-center justify-center self-start border border-[var(--brand-blue)] bg-[var(--brand-blue)] px-6 py-3 text-center text-[0.9rem] font-semibold text-white transition-colors hover:border-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue-hover)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] md:text-[0.96rem] [font-family:var(--font-sans)]"
						>
							{m.about_cta_discover_programs()}
						</a>
					</div>
				</div>
			</div>
	</section>

	<section class="relative border-b border-border bg-white px-0 py-14 md:py-20">
		<div class="w-full">
			<div class="w-full overflow-hidden rounded-tl-[5.6rem] rounded-br-[5.6rem] bg-[#245f4e] text-white md:rounded-tl-[7rem] md:rounded-br-[7rem]">
				<div class="mx-auto w-full max-w-[1600px] px-6 py-12 md:px-10 md:py-14">
					<p class="text-center text-xs tracking-[0.2em] uppercase text-white/85">Programe recomandate</p>
					<h2
						class="mx-auto mt-3 max-w-[52rem] text-center text-[0.98rem] leading-snug font-medium text-white/95 md:mt-3.5 md:text-[1.08rem] lg:text-[1.15rem] [font-family:var(--font-sans)]"
					>
						Programe Kogaion pentru copii gifted si familii care isi doresc educatie cu sens
					</h2>
					<div class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{#each highlightedPrograms as program (program.slug)}
							<a
								href={resolvePath(`${programsHref}/${program.slug}`)}
								class="media-diagonal group relative isolate flex min-h-[20rem] flex-col overflow-hidden sm:min-h-[24rem] md:min-h-[31rem]"
							>
								<img
									src={program.image ?? '/media/uploads/about/age-3-6.webp'}
									alt={program.title}
									class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
								/>
								<div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/68 to-black/35"></div>
								<div class="relative flex flex-1 flex-col justify-between p-4 md:p-6">
									<div>
										<h3 class="text-[1.25rem] leading-tight font-medium text-white sm:text-[1.4rem] md:text-[1.75rem]">
											{program.title}
										</h3>
										<p class="mt-1.5 text-sm text-white/92 md:mt-2 md:text-base">
											{formatAgeRangeLabel(program.categoryId, program.ageRange) ?? 'Toate varstele'}
										</p>
										<p
											class="mt-3 line-clamp-3 text-sm leading-relaxed text-white/88 [font-family:var(--font-sans)] md:mt-4 md:line-clamp-5 md:text-base"
										>
											{program.description ?? program.ageRange ?? ''}
										</p>
									</div>
									<span
										class="btn-diagonal ml-auto inline-flex size-10 items-center justify-center border border-white text-white transition-colors group-hover:border-white group-hover:bg-[var(--brand-blue)]"
									>
										<ArrowRight class="size-4" />
									</span>
								</div>
							</a>
						{/each}
					</div>
					<div class="mt-8 flex justify-center">
						<a
							href={resolvePath(programsHref)}
							class="group inline-flex items-center justify-center gap-3 text-white [font-family:var(--font-sans)]"
						>
							<span
								class="btn-diagonal inline-flex size-10 shrink-0 items-center justify-center border border-white text-white transition-colors group-hover:border-[var(--brand-blue-hover)] group-hover:bg-[var(--brand-blue-hover)]"
								aria-hidden="true"
							>
								<ArrowRight class="size-4" />
							</span>
							<span class="text-[1rem] font-medium [font-family:var(--font-sans)]">Vezi toate programele</span>
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="relative border-b border-border bg-white" data-cms-type="section" data-cms-page="about" data-cms-section="founders" data-cms-locale="ro">
		<div class="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-20 lg:px-16">
			<div class="mx-auto max-w-3xl text-center">
				<div data-cms-type="section" data-cms-page="about" data-cms-section="founders" data-cms-field="title" data-cms-locale="ro">
					<p class="text-xs font-semibold tracking-[0.2em] text-primary uppercase [font-family:var(--font-sans)]">
						{aboutUi.foundersEyebrow}
					</p>
					<h2
						class="mt-4 text-[1.45rem] leading-tight font-medium text-[#0c3044] md:text-[2rem] [font-family:var(--font-spectral)]"
					>
						{foundersPayload?.title ?? m.about_founders_title()}
					</h2>
				</div>
				<div data-cms-type="section" data-cms-page="about" data-cms-section="founders" data-cms-field="intro" data-cms-locale="ro">
					<p class="mt-4 text-base leading-relaxed text-muted-foreground [font-family:var(--font-sans)]">
						{foundersPayload?.intro ?? m.about_founders_intro()}
					</p>
				</div>
			</div>

			<div class="mx-auto mt-10 grid w-full max-w-5xl gap-6 md:mt-12 md:grid-cols-2 md:items-start md:gap-8">
				<article
					class="flex flex-col overflow-hidden border border-border bg-card shadow-[0_10px_24px_-18px_rgba(21,75,106,0.2)]"
				>
					<div
						class="media-diagonal relative aspect-[4/5] w-full min-h-[13rem] overflow-hidden bg-[#e8f0fa] md:min-h-[15rem]"
						data-profile-photo
					>
						<img
							src="/media/uploads/about/founder-diana.webp"
							alt={m.about_founders_diana_name()}
							class="size-full object-cover"
						/>
					</div>
					<div class="p-5 md:p-6">
						<h3 class="text-[1.25rem] font-medium text-[#0c3044] [font-family:var(--font-spectral)]">
							{m.about_founders_diana_name()}
						</h3>
						<p class="mt-2.5 text-sm leading-relaxed text-muted-foreground [font-family:var(--font-sans)]">
							{m.about_founders_diana_bio()}
						</p>
					</div>
				</article>
				<article
					class="flex flex-col overflow-hidden border border-border bg-card shadow-[0_10px_24px_-18px_rgba(21,75,106,0.2)]"
				>
					<div
						class="media-diagonal relative aspect-[4/5] w-full min-h-[13rem] overflow-hidden bg-[#e8f0fa] md:min-h-[15rem]"
						data-profile-photo
					>
						<img
							src="/media/uploads/about/founder-florian.webp"
							alt={m.about_founders_florian_name()}
							class="size-full object-cover"
						/>
					</div>
					<div class="p-5 md:p-6">
						<h3 class="text-[1.25rem] font-medium text-[#0c3044] [font-family:var(--font-spectral)]">
							{m.about_founders_florian_name()}
						</h3>
						<p class="mt-2.5 text-sm leading-relaxed text-muted-foreground [font-family:var(--font-sans)]">
							{m.about_founders_florian_bio()}
						</p>
					</div>
				</article>
			</div>
		</div>
	</section>

	<section class="relative bg-white px-0 pb-14 md:pb-20">
		<div
			class="w-full overflow-hidden rounded-tl-none rounded-br-[5.6rem] bg-[#154b6a] text-white md:rounded-br-[7rem]"
		>
			<div class="mx-auto w-full max-w-[1600px] px-6 py-12 md:px-10 md:py-14">
				<div class="grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-center md:gap-12">
					<div>
						<div data-cms-type="section" data-cms-page="about" data-cms-section="cta_section" data-cms-field="programsTitle" data-cms-locale="ro">
							<h2 class="text-[1.65rem] leading-tight font-medium text-white md:text-[2.1rem] [font-family:var(--font-spectral)]">
								{ctaPayload?.programsTitle ?? m.about_cta_discover_programs()}
							</h2>
						</div>
						<div data-cms-type="section" data-cms-page="about" data-cms-section="cta_section" data-cms-field="programsIntro" data-cms-locale="ro">
							<p class="mt-4 max-w-xl text-base leading-relaxed text-white/85 [font-family:var(--font-sans)]">
								{ctaPayload?.programsIntro ?? m.programs_from_about_intro()}
							</p>
						</div>
						<div class="mt-8 flex flex-wrap gap-4">
							<a
								href={resolvePath(programsHref)}
								class="btn-diagonal inline-flex min-h-12 items-center justify-center gap-2 border border-white bg-white px-7 py-3 text-center text-[0.9rem] font-semibold text-[var(--brand-blue)] transition-colors hover:bg-transparent hover:text-white [font-family:var(--font-sans)]"
							>
								{m.nav_programs()}
							</a>
							<a
								href={resolvePath(contactHref)}
								class="btn-diagonal inline-flex min-h-12 items-center justify-center gap-2 border border-white bg-transparent px-7 py-3 text-center text-[0.9rem] font-semibold text-white transition-colors hover:bg-white hover:text-[var(--brand-blue)] [font-family:var(--font-sans)]"
							>
								{m.home_cta_contact_label()}
							</a>
						</div>
					</div>
					<div class="media-diagonal border-2 border-white/20 bg-white/10 p-7 md:p-8">
						<div data-cms-type="section" data-cms-page="about" data-cms-section="cta_section" data-cms-field="mentorsTitle" data-cms-locale="ro">
							<h3 class="text-[1.25rem] font-medium text-white [font-family:var(--font-spectral)]">
								{ctaPayload?.mentorsTitle ?? m.about_cta_meet_mentors()}
							</h3>
						</div>
						<div data-cms-type="section" data-cms-page="about" data-cms-section="cta_section" data-cms-field="mentorsLead" data-cms-locale="ro">
							<p class="mt-4 text-[0.95rem] leading-relaxed text-white/85 [font-family:var(--font-sans)]">
								{ctaPayload?.mentorsLead ?? m.about_mentors_lead()}
							</p>
						</div>
						<div
							data-cms-type="section"
							data-cms-page="about"
							data-cms-section="cta_section"
							data-cms-field="connect"
							data-cms-locale="ro"
							class="mt-6"
						>
							<a
								href={resolvePath(mentorsHref)}
								class="btn-diagonal inline-flex min-h-11 items-center justify-center border-white bg-white px-6 py-2.5 text-[0.88rem] font-semibold text-[var(--brand-blue)] transition-colors duration-200 hover:bg-transparent hover:text-white [font-family:var(--font-sans)]"
							>
								{ctaPayload?.connect ?? m.menu_connect()}
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</main>
