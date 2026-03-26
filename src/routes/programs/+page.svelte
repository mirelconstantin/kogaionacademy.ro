<script lang="ts">
	import { page } from '$app/state';
	import Hero from '$lib/components/Hero.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { contentHref } from '$lib/content-routes';
	import { isProgramPubliclyOpen } from '$lib/program-availability';
	import { buildScheduleLines, formatAgeRangeLabel, normalizeText } from '$lib/program-schedule';
	import { programCategories } from '$lib/programs-data';
	import type { ProgramForDisplay } from '$lib/server/content';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Calendar from '@lucide/svelte/icons/calendar';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Lock from '@lucide/svelte/icons/lock';

	let {
		data
	}: {
		data: {
			programs: ProgramForDisplay[];
			programCategories: typeof programCategories;
			sections?: Record<string, Record<string, unknown>>;
			activeAgeFilter?: string | null;
			canonicalUrl?: string;
			baseUrl?: string;
		};
	} = $props();

	const messages = m as unknown as Record<string, () => string>;
	function msg(key: string): string {
		const f = messages[key];
		return typeof f === 'function' ? f() : '';
	}

	const locale = $derived(getLocale());

	const FALLBACK_IMAGE = '/media/uploads/about/age-3-6.webp';
	const heroTitle = $derived(m.programs_title());
	const heroIntro = $derived(m.programs_intro());
	const heroLabel = $derived(m.programs_hero_label());
	const contactPath = $derived(contentHref('contact'));
	const aboutPath = $derived(contentHref('about'));
	const programsBasePath = $derived(contentHref('programs'));
	const heroConfig = $derived({
		posterUrl: '/media/uploads/about/age-13-18.webp',
		ctaPrimaryLabel: m.programs_hero_cta_contact(),
		ctaPrimaryLink: contactPath,
		ctaSecondaryLabel: m.programs_hero_cta_about(),
		ctaSecondaryLink: aboutPath
	});

	const activeAgeFilterLabel = $derived.by(() => {
		const f = data?.activeAgeFilter;
		if (!f) return null;
		const range = f.replace('-', '–');
		return locale === 'ro'
			? `Afișăm programe pentru grupa ${range} ani`
			: `Showing programmes for ages ${range}`;
	});

	const ageFilterOptions = [
		{ value: null as string | null, labelKey: 'programs_filter_all' as const },
		{ value: '3-6' as const, labelKey: 'programs_filter_age_36' as const },
		{ value: '7-12' as const, labelKey: 'programs_filter_age_712' as const },
		{ value: '13-18' as const, labelKey: 'programs_filter_age_1318' as const }
	] as const;

	function filterHref(age: string | null): string {
		const u = new URL(page.url.href);
		if (age) u.searchParams.set('age', age);
		else u.searchParams.delete('age');
		const q = u.searchParams.toString();
		const path = u.pathname;
		return q ? `${path}?${q}` : path;
	}

	function isAgeFilterActive(value: string | null): boolean {
		const cur = data?.activeAgeFilter ?? null;
		if (value === null) return cur === null;
		return cur === value;
	}

	const programCount = $derived((data.programs ?? []).length);

	function programsForCategory(categoryId: string): ProgramForDisplay[] {
		return (data.programs ?? []).filter((p) => p.categoryId === categoryId);
	}

	const categoriesWithPrograms = $derived(
		(data?.programCategories ?? programCategories)
			.map((category) => ({ category, programs: programsForCategory(category.id) }))
			.filter((entry) => entry.programs.length > 0)
	);

	function programHref(slug: string): string {
		return `${programsBasePath}/${slug}`;
	}

	const lockedProgramHint = $derived(
		locale === 'en' ? 'Program page not available yet' : 'Pagina programului nu este încă disponibilă'
	);

	function formatProgramLocation(program: ProgramForDisplay): string | null {
		const location = normalizeText(program.locationText) || normalizeText(program.location);
		return location.length > 0 ? location : null;
	}

	const ogImagePath = '/media/uploads/about/age-13-18.webp';
	const ogImageUrl = $derived(data?.baseUrl ? `${data.baseUrl}${ogImagePath}` : ogImagePath);
	const canonical = $derived(data?.canonicalUrl ?? '');
	const seoTitle = $derived(m.programs_seo_title());
	const seoDescription = $derived(m.programs_seo_description());
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:locale" content={locale === 'ro' ? 'ro_RO' : 'en_US'} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />
	<meta name="twitter:image" content={ogImageUrl} />
</svelte:head>

<main class="min-h-dvh bg-white">
	<div class="relative">
		<Hero
			hero={heroConfig}
			heroLabel={heroLabel}
			introHeading={heroTitle}
			introBody={heroIntro}
			cmsPage="programs"
			cmsSection="hero"
			cmsHeadingField="title"
			cmsBodyField="intro"
			showEyebrow={true}
			eyebrowCmsField="label"
			headingMultiline={true}
		/>
	</div>

	{#if activeAgeFilterLabel}
		<section class="border-b border-border bg-[#f4f8ff] px-6 py-4">
			<div class="mx-auto max-w-6xl text-center">
				<p class="inline-flex items-center gap-2 text-sm text-[#0c3044] [font-family:var(--font-sans)]">
					<span class="size-1.5 rounded-full bg-[var(--brand-green)]"></span>
					{activeAgeFilterLabel}
				</p>
			</div>
		</section>
	{/if}

	<section class="border-b border-border bg-[#fcfeff] px-6 py-14 md:py-20">
		<div class="mx-auto max-w-6xl">
			<div
				class="rounded-tl-[4.3rem] rounded-br-[4.3rem] border border-[#dfeaf8] bg-[#f7fbff] px-6 py-9 shadow-[0_10px_24px_-18px_rgba(21,75,106,0.18)] md:px-10 md:py-11"
			>
				<div class="mx-auto max-w-4xl text-center">
					<p class="text-xs font-semibold tracking-[0.2em] text-[#0c3044]/70 uppercase [font-family:var(--font-sans)]">
						{m.programs_list_eyebrow()}
					</p>
					<h2 class="mt-4 text-3xl font-medium text-[#0c3044] md:text-5xl [font-family:var(--font-spectral)]">
						{m.programs_list_heading()}
					</h2>
					<p class="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg [font-family:var(--font-sans)]">
						{m.programs_list_lead()}
					</p>
				</div>
				<nav class="mt-9 flex flex-wrap justify-center gap-3" aria-label={m.programs_filter_aria()}>
					{#each ageFilterOptions as opt (opt.value ?? 'all')}
						<a
							href={filterHref(opt.value)}
							class="btn-diagonal inline-flex min-h-11 items-center justify-center border px-5 py-2.5 text-sm font-semibold transition-colors [font-family:var(--font-sans)] {isAgeFilterActive(opt.value)
								? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white'
								: 'border-[#dfeaf8] bg-white text-[#0c3044] hover:border-[#cfd9e6] hover:bg-[#e4eaf1]'}"
						>
							{msg(opt.labelKey)}
						</a>
					{/each}
				</nav>
			</div>
		</div>
	</section>

	{#if programCount === 0}
		<section class="px-6 py-16 md:py-20">
			<div class="mx-auto max-w-3xl text-center">
				<h2 class="text-2xl text-[#0c3044] [font-family:var(--font-spectral)]">
					{m.programs_empty_title()}
				</h2>
				<p class="mt-3 text-muted-foreground [font-family:var(--font-sans)]">
					{m.programs_empty_body()}
				</p>
				<a
					href={filterHref(null)}
					class="btn-diagonal mt-7 inline-flex min-h-11 items-center justify-center border border-[var(--brand-blue)] px-6 py-2.5 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:bg-[var(--brand-blue)] hover:text-white [font-family:var(--font-sans)]"
				>
					{m.programs_empty_cta()}
				</a>
			</div>
		</section>
	{:else}
		{#each categoriesWithPrograms as entry (entry.category.id)}
			<section class="relative bg-white px-6 py-9 md:py-12">
				<div class="mx-auto w-full max-w-6xl">
					<div class="rounded-tl-[4.3rem] rounded-br-[4.3rem] border border-transparent bg-[#f7fbff] px-6 py-9 md:px-10 md:py-11">
						<h2 class="mx-auto max-w-[1200px] text-center text-[1.45rem] leading-tight font-medium text-[#0c3044] md:text-[2rem] lg:text-[2.35rem] [font-family:var(--font-spectral)]">
							{msg(entry.category.titleKey)}
						</h2>
						<p class="mx-auto mt-4 max-w-4xl text-center text-base leading-relaxed text-muted-foreground [font-family:var(--font-sans)]">
							{msg(entry.category.subtitleKey)}
						</p>
						<div class="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
							{#each entry.programs as program (program.slug)}
								{@const isOpen = isProgramPubliclyOpen(program.slug)}
								{@const cardInnerClass =
									'media-diagonal-reverse relative isolate block min-h-[30rem] overflow-hidden bg-[#0b244f]'}
								{#if isOpen}
									<a
										href={programHref(program.slug)}
										class="{cardInnerClass} group cursor-pointer"
									>
										<img
											src={program.image ?? FALLBACK_IMAGE}
											alt={program.title}
											class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>
										<div class="absolute inset-0 bg-gradient-to-t from-black/93 via-black/62 to-black/28"></div>
										{#if program.badge}
											<span class="media-diagonal-soft absolute top-4 left-4 z-20 inline-flex items-center border border-white/75 bg-[#0c3044]/40 px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.11em] uppercase text-white backdrop-blur-sm [font-family:var(--font-sans)]">
												{program.badge === 'early_bird' ? m.programs_badge_early_bird() : m.programs_badge_new()}
											</span>
										{/if}
										<div class="relative flex h-full flex-col p-6 pt-14 pb-20">
											<div>
												<h3 class="text-[1.42rem] leading-[1.12] font-medium text-white md:text-[1.68rem] [font-family:var(--font-spectral)]">
													{program.title}
												</h3>
												{#if formatAgeRangeLabel(program.categoryId, program.ageRange)}
													<p class="mt-2 text-[0.95rem] text-white/90 [font-family:var(--font-sans)]">
														{formatAgeRangeLabel(program.categoryId, program.ageRange)}
													</p>
												{/if}
												{#if program.description}
													<p class="mt-4 line-clamp-4 text-[0.95rem] leading-relaxed text-white/86 [font-family:var(--font-sans)]">
														{program.description}
													</p>
												{/if}
												<div class="mt-4 flex flex-col gap-1.5 text-sm text-white/85 [font-family:var(--font-sans)]">
													{#if formatProgramLocation(program)}
														<span class="flex items-center gap-1.5">
															<MapPin class="size-4 shrink-0 opacity-90" />
															{formatProgramLocation(program)}
														</span>
													{/if}
													{#if buildScheduleLines(program.datesText, program.durationText).length > 0}
														<span class="flex items-start gap-1.5">
															<Calendar class="size-4 shrink-0 opacity-90" />
															<span class="space-y-1">
																{#each buildScheduleLines(program.datesText, program.durationText) as line, i (`${program.slug}-${i}-${line}`)}
																	<span class="block">{line}</span>
																{/each}
															</span>
														</span>
													{/if}
												</div>
											</div>
											<span class="btn-diagonal absolute right-6 bottom-6 inline-flex size-10 items-center justify-center border border-white/90 text-white transition-colors group-hover:bg-[var(--brand-blue)]">
												<ArrowRight class="size-4" />
											</span>
										</div>
									</a>
								{:else}
									<div
										class="{cardInnerClass} cursor-not-allowed"
										role="group"
										aria-label="{program.title}. {lockedProgramHint}"
									>
										<img
											src={program.image ?? FALLBACK_IMAGE}
											alt=""
											class="absolute inset-0 size-full object-cover opacity-80"
										/>
										<div class="absolute inset-0 bg-gradient-to-t from-black/93 via-black/68 to-black/40"></div>
										<div
											class="pointer-events-none absolute inset-0 z-10 bg-[#0b244f]/25"
											aria-hidden="true"
										></div>
										<span
											class="media-diagonal-soft absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 border border-white/75 bg-black/45 px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-white backdrop-blur-sm [font-family:var(--font-sans)]"
										>
											<Lock class="size-3.5 shrink-0 opacity-95" aria-hidden="true" />
											{locale === 'en' ? 'Coming soon' : 'În curând'}
										</span>
										{#if program.badge}
											<span class="media-diagonal-soft absolute top-4 left-4 z-20 inline-flex items-center border border-white/75 bg-[#0c3044]/40 px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.11em] uppercase text-white backdrop-blur-sm [font-family:var(--font-sans)]">
												{program.badge === 'early_bird' ? m.programs_badge_early_bird() : m.programs_badge_new()}
											</span>
										{/if}
										<div class="relative flex h-full flex-col p-6 pt-14 pb-20">
											<div>
												<h3 class="text-[1.42rem] leading-[1.12] font-medium text-white md:text-[1.68rem] [font-family:var(--font-spectral)]">
													{program.title}
												</h3>
												{#if formatAgeRangeLabel(program.categoryId, program.ageRange)}
													<p class="mt-2 text-[0.95rem] text-white/90 [font-family:var(--font-sans)]">
														{formatAgeRangeLabel(program.categoryId, program.ageRange)}
													</p>
												{/if}
												{#if program.description}
													<p class="mt-4 line-clamp-4 text-[0.95rem] leading-relaxed text-white/86 [font-family:var(--font-sans)]">
														{program.description}
													</p>
												{/if}
												<div class="mt-4 flex flex-col gap-1.5 text-sm text-white/85 [font-family:var(--font-sans)]">
													{#if formatProgramLocation(program)}
														<span class="flex items-center gap-1.5">
															<MapPin class="size-4 shrink-0 opacity-90" />
															{formatProgramLocation(program)}
														</span>
													{/if}
													{#if buildScheduleLines(program.datesText, program.durationText).length > 0}
														<span class="flex items-start gap-1.5">
															<Calendar class="size-4 shrink-0 opacity-90" />
															<span class="space-y-1">
																{#each buildScheduleLines(program.datesText, program.durationText) as line, i (`${program.slug}-l-${i}-${line}`)}
																	<span class="block">{line}</span>
																{/each}
															</span>
														</span>
													{/if}
												</div>
											</div>
											<span
												class="btn-diagonal absolute right-6 bottom-6 inline-flex size-10 items-center justify-center border border-white/50 text-white/80"
												aria-hidden="true"
											>
												<Lock class="size-4" />
											</span>
										</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			</section>
		{/each}
	{/if}

	<section
		class="relative mb-14 overflow-hidden rounded-tl-none rounded-br-[5.6rem] border-t border-[#0e3d55] bg-[#154b6a] py-16 text-white md:mb-16 md:rounded-br-[7rem] md:py-20"
	>
		<div class="relative mx-auto max-w-[1300px] px-6 text-center md:px-10">
			<h2 class="text-3xl leading-tight font-medium text-white md:text-[2.25rem] [font-family:var(--font-spectral)]">
				{m.programs_help_title()}
			</h2>
			<p class="mt-5 text-base leading-relaxed text-white [font-family:var(--font-sans)]">
				{m.programs_help_body()}
			</p>
			<div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
				<a
					href={contactPath}
					class="btn-diagonal inline-flex min-h-12 items-center justify-center border border-white bg-white px-6 py-3 text-center text-[0.9rem] font-semibold text-[var(--brand-blue)] transition-colors hover:bg-white/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:text-[0.96rem] [font-family:var(--font-sans)]"
				>
					{m.programs_help_contact()}
				</a>
				<a
					href={aboutPath}
					class="btn-diagonal inline-flex min-h-12 items-center justify-center border border-white bg-transparent px-6 py-3 text-center text-[0.9rem] font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:text-[0.96rem] [font-family:var(--font-sans)]"
				>
					{m.programs_help_about()}
				</a>
			</div>
		</div>
	</section>
</main>
