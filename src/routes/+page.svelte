<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { contentHref } from '$lib/content-routes';
import { formatAgeRangeLabel } from '$lib/program-schedule';
	import type { ProgramForDisplay } from '$lib/server/content';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	let {
		data
	}: {
		data: {
			hero?: {
				videoUrl?: string;
				posterUrl?: string;
				ctaPrimaryLabel?: string;
				ctaPrimaryLink?: string;
				ctaSecondaryLabel?: string;
				ctaSecondaryLink?: string;
			} | null;
			programs?: ProgramForDisplay[];
			sections?: Record<string, Record<string, unknown>>;
		};
	} = $props();

	const s = $derived(data?.sections ?? {});
	const heroLabel = $derived((s.hero_label as { text?: string })?.text ?? 'Kogaion Gifted Academy');
	const introHeading = $derived((s.intro as { heading?: string })?.heading ?? m.home_intro_heading());
	const introBody = $derived((s.intro as { body?: string })?.body ?? m.home_intro_body());
	const aboutTeaser = $derived(
		s.about_teaser as { title?: string; body?: string; ctaLabel?: string; ctaLink?: string } | undefined
	);
	const aboutTeaserTitle = $derived(aboutTeaser?.title ?? m.about_vision_title());
	const aboutTeaserCta = $derived(aboutTeaser?.ctaLabel ?? m.nav_about());
	const aboutTeaserLink = $derived(aboutTeaser?.ctaLink ?? contentHref('about'));

	const programsHref = contentHref('programs');
	const ageFilterHref = (age: '3-6' | '7-12' | '13-18') => `${contentHref('programs')}?age=${age}`;
	const highlightedPrograms = $derived((data?.programs ?? []).slice(0, 4));
	const kogaionOverviewTitle = 'Educatie care construieste caracter, nu doar rezultate';
	const kogaionOverviewLead =
		'La Kogaion, copilul nu este tratat ca un scor sau un procent. Este vazut in intregime: minte, emotie, curiozitate, potential.';

	type HighlightLink = { label: string; href: string };
	type HomeHighlightColumn = {
		title: string;
		subtitle: string;
		image: string;
		links: HighlightLink[];
	};

	const homeHighlightColumns: HomeHighlightColumn[] = [
		{
			title: 'Abordarea noastra',
			subtitle: 'Invatare activa, fara presiune, cu rezultate reale',
			image: '/media/uploads/about/age-3-6.webp',
			links: [
				{ label: 'Cum invata copiii la Kogaion', href: contentHref('about') },
				{ label: 'Povesti ale familiilor noastre', href: contentHref('blog') },
				{ label: 'Ritmul personalizat al fiecarui copil', href: contentHref('about') },
				{ label: 'Cum urmarim progresul', href: contentHref('about') }
			]
		},
		{
			title: 'Programe',
			subtitle: 'Trasee flexibile pentru fiecare etapa de dezvoltare',
			image: '/media/uploads/about/age-7-12.webp',
			links: [
				{ label: 'Programe 3-6 ani', href: ageFilterHref('3-6') },
				{ label: 'Programe 7-12 ani', href: ageFilterHref('7-12') },
				{ label: 'Programe 13-18 ani', href: ageFilterHref('13-18') },
				{ label: 'Ateliere pentru familii', href: programsHref }
			]
		},
		{
			title: 'Suport si ghidare',
			subtitle: 'Echipa noastra te sustine de la primul pas',
			image: '/media/uploads/about/age-13-18.webp',
			links: [
				{ label: 'Consiliere educationala pentru parinti', href: contentHref('contact') },
				{ label: 'Mentorat pentru copii si adolescenti', href: contentHref('mentors') },
				{ label: 'Sprijin pentru motivatie si autonomie', href: contentHref('about') },
				{ label: 'Orientare pentru viitor academic', href: contentHref('contact') }
			]
		}
	];

	type KogaionStoryBlock = {
		eyebrow: string;
		titleLines: string[];
		image: string;
		badge: string;
		intro: string;
		bullets: string[];
		ctaLabel: string;
		ctaHref: string;
		/** Buton plin albastru + hover mai deschis (ca DESPRE KOGAION) */
		ctaFilled?: boolean;
	};
	const kogaionStoryBlocks: KogaionStoryBlock[] = [
		{
			eyebrow: 'Model educational Kogaion',
			titleLines: [
				'Viziunea noastra:',
				'dezvoltare completa,',
				'nu doar performanta punctuala'
			],
			image: '/media/uploads/programe/kogaion-gifted-family/kogaion-gifted-family-cover.webp',
			badge: 'Invatarea la Kogaion inseamna context real, comunitate si progres autentic.',
			intro: 'La Kogaion, copilul este vazut ca un intreg: minte, emotie, motivatie si potential. Construim trasee clare de crestere, cu obiective relevante pentru fiecare etapa de varsta.',
			bullets: [
				'Proiecte interdisciplinare, mentorat personalizat si experiente practice care transforma curiozitatea in competente reale.',
				'Urmarim evolutia constant, cu feedback clar pentru familie.',
				'Progres coerent, vizibil si sustenabil pe termen lung.'
			],
			ctaLabel: 'DESPRE KOGAION',
			ctaHref: contentHref('about'),
			ctaFilled: true
		},
		{
			eyebrow: 'Parteneriat cu familia',
			titleLines: [
				'Sustinem parintii cu claritate,',
				'strategie si directie',
				'personalizata'
			],
			image: '/media/uploads/about/age-13-18.webp',
			badge: 'Parintele devine partener activ in dezvoltarea copilului.',
			intro: 'Fiecare familie primeste ghidare aplicata: ce functioneaza pentru ritmul copilului, cum se construieste autonomia si ce decizii sustin cel mai bine parcursul academic.',
			bullets: [
				'Comunicare transparenta, pas cu pas, pentru obiective pe termen scurt si directie pe termen lung.',
				'Colaborare reala intre familie si academie.',
				'Copiii isi consolideaza increderea, disciplina interioara si invatarea cu sens.'
			],
			ctaLabel: 'DISCUTĂ CU ECHIPA NOASTRĂ',
			ctaHref: contentHref('contact'),
			ctaFilled: true
		}
	];

	type Differentiator = { title: string; body: string; href?: string };
	const differentiators: Differentiator[] = [
		{
			title: 'Inteligenta emotionala',
			body: 'Cultivam autocunoasterea, empatia si rezilienta prin activitati integrate in fiecare etapa de invatare.'
		},
		{
			title: 'Raport mic elev-profesor',
			body: 'Clasele cu numar redus de copii ne permit sprijin personalizat, feedback relevant si progres real pentru fiecare elev.'
		},
		{
			title: 'Proiecte cu impact real',
			body: 'Copiii aplica ce invata in contexte autentice, cu proiecte care dezvolta responsabilitatea si implicarea in comunitate.'
		},
		{
			title: 'Invatare prin intrebare',
			body: 'Punem accent pe curiozitate, investigatie si gandire critica, astfel incat elevii sa devina exploratori activi ai cunoasterii.'
		},
		{
			title: 'Stare de bine',
			body: 'Construim un mediu sigur emotional si relational, in care fiecare copil este vazut, sustinut si incurajat sa creasca.'
		},
		{
			title: 'Autonomie si initiativa',
			body: 'Dezvoltam capacitatea elevilor de a lua decizii, de a-si organiza invatarea si de a actiona cu incredere.'
		},
		{
			title: 'Ritm personalizat',
			body: 'Fiecare copil primeste un parcurs adaptat nivelului sau actual, pentru progres sustenabil si incredere reala.'
		},
		{
			title: 'Parteneriat cu familia',
			body: 'Lucram impreuna cu parintii prin comunicare constanta, obiective clare si recomandari aplicabile acasa.'
		},
		{
			title: 'Performanta cu sens',
			body: 'Urmarim rezultate academice solide fara a pierde din vedere caracterul, motivatia si echilibrul copilului.'
		}
	];

	const galleryImages: string[] = [
		'/media/uploads/programe/kogaion-gifted-family/kogaion-gifted-family-gallery-05.webp',
		'/media/uploads/programe/kogaion-gifted-family/kogaion-gifted-family-gallery-22.webp',
		'/media/uploads/programe/kogaion-family-bootcamp/kogaion-family-bootcamp-gallery-15.webp',
		'/media/uploads/programe/kogaion-family-bootcamp-4-6-ani/kogaion-family-bootcamp-4-6-ani-gallery-31.webp',
		'/media/uploads/programe/kogaion-architecture-bootcamp/kogaion-architecture-bootcamp-gallery-05.webp',
		'/media/uploads/programe/kogaion-gifted-family/kogaion-gifted-family-gallery-29.webp',
		'/media/uploads/programe/kogaion-family-bootcamp-4-6-ani/kogaion-family-bootcamp-4-6-ani-gallery-12.webp',
		'/media/uploads/programe/kogaion-gifted-family/kogaion-gifted-family-gallery-19.webp',
		'/media/uploads/programe/kogaion-family-bootcamp-4-6-ani/kogaion-family-bootcamp-4-6-ani-gallery-18.webp',
		'/media/uploads/programe/kogaion-family-bootcamp/kogaion-family-bootcamp-gallery-10.webp',
		'/media/uploads/programe/kogaion-family-bootcamp-4-6-ani/kogaion-family-bootcamp-4-6-ani-gallery-44.webp',
		'/media/uploads/programe/kogaion-family-bootcamp-4-6-ani/kogaion-family-bootcamp-4-6-ani-gallery-26.webp',
		'/media/uploads/programe/kogaion-gifted-family/kogaion-gifted-family-gallery-17.webp',
		'/media/uploads/programe/kogaion-gifted-family/kogaion-gifted-family-gallery-18.webp',
		'/media/uploads/programe/kogaion-science-bootcamp/kogaion-science-bootcamp-gallery-14.webp',
		'/media/uploads/programe/kogaion-science-bootcamp/kogaion-science-bootcamp-gallery-19.webp',
		'/media/uploads/programe/kogaion-family-bootcamp/kogaion-family-bootcamp-gallery-03.webp',
		'/media/uploads/programe/kogaion-family-bootcamp-4-6-ani/kogaion-family-bootcamp-4-6-ani-gallery-17.webp',
		'/media/uploads/programe/kogaion-architecture-bootcamp/kogaion-architecture-bootcamp-gallery-22.webp',
		'/media/uploads/programe/kogaion-gifted-family/kogaion-gifted-family-gallery-34.webp'
	];

	const galleryRowOne = $derived(galleryImages.filter((_, index) => index % 2 === 0));
	const galleryRowTwo = $derived(galleryImages.filter((_, index) => index % 2 === 1));

	function scrollGalleryStep(track: HTMLElement): number {
		const firstItem = track.querySelector('[data-gallery-item]');
		const gap = Number.parseFloat(globalThis.getComputedStyle(track).columnGap || '12') || 12;
		return firstItem instanceof HTMLElement ? firstItem.getBoundingClientRect().width + gap : 302;
	}

	function scrollGallery(direction: -1 | 1) {
		const mobile = document.getElementById('home-gallery-track-mobile');
		const topTrack = document.getElementById('home-gallery-track-top');
		const bottomTrack = document.getElementById('home-gallery-track-bottom');
		const dual =
			globalThis.matchMedia?.('(min-width: 768px)').matches &&
			topTrack instanceof HTMLElement &&
			bottomTrack instanceof HTMLElement;
		if (dual) {
			const step = scrollGalleryStep(topTrack);
			topTrack.scrollBy({ left: direction * step, behavior: 'smooth' });
			bottomTrack.scrollBy({ left: direction * step, behavior: 'smooth' });
			return;
		}
		if (mobile instanceof HTMLElement) {
			const step = scrollGalleryStep(mobile);
			mobile.scrollBy({ left: direction * step, behavior: 'smooth' });
		}
	}
</script>

<main class="min-h-dvh bg-white">
	<div class="relative">
		<Hero
			hero={data?.hero ?? null}
			heroLabel={heroLabel}
			introHeading={introHeading}
			introBody={introBody}
		/>
	</div>

	<section class="relative border-b border-border bg-[#fcfeff] px-6 py-14 md:py-20">
		<div class="mx-auto max-w-6xl">
			<div class="mx-auto mb-10 max-w-4xl text-center">
				<h2 class="text-3xl font-medium text-[#0c3044] md:text-5xl">{kogaionOverviewTitle}</h2>
				<p class="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">{kogaionOverviewLead}</p>
			</div>

			<div class="grid gap-6 md:grid-cols-3">
				{#each homeHighlightColumns as column (column.title)}
					<article class="mx-auto w-full max-w-none overflow-hidden">
						<div class="media-diagonal h-[15.5rem] overflow-hidden border border-[#d9e6f7] bg-white shadow-[0_10px_24px_-18px_rgba(21,75,106,0.45)] md:h-[18.5rem] lg:h-[21rem]">
							<img
								src={column.image}
								alt={column.title}
								class="size-full object-cover transition-transform duration-500 hover:scale-[1.03]"
							/>
						</div>
						<div class="px-1 pt-5 text-center">
							<h3 class="text-[2rem] leading-tight font-medium text-[#0c3044] md:text-[2.1rem]">{column.title}</h3>
							<p class="mx-auto mt-2 max-w-[24rem] text-[0.98rem] text-muted-foreground">{column.subtitle}</p>
							<ul class="mt-5 space-y-2.5 text-left">
								{#each column.links as item (item.label)}
									<li>
										<a
											href={item.href}
											class="btn-diagonal block border border-[#dfeaf8] bg-[#f5fafd] px-4 py-2.5 text-center text-[0.88rem] font-medium normal-case tracking-normal text-[#0c3044] transition-colors hover:border-[#cfd9e6] hover:bg-[#e4eaf1] hover:text-[#0c3044] [font-family:var(--font-sans)]"
										>
											<span>{item.label}</span>
										</a>
									</li>
								{/each}
							</ul>
						</div>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="relative border-b border-border bg-white px-0 py-14 md:py-20">
		<div
			class="w-full overflow-hidden rounded-tr-[5.6rem] rounded-bl-[5.6rem] bg-[#c25067] text-white md:rounded-tr-[7rem] md:rounded-bl-[7rem]"
		>
			<div class="mx-auto w-full max-w-[1600px] px-6 py-12 md:px-10 md:py-14">
				<p class="text-center text-xs font-semibold tracking-[0.2em] text-white/85 uppercase [font-family:var(--font-sans)]">
					Abordarea noastra
				</p>
				<h2
					class="mx-auto mt-4 max-w-[1200px] text-center text-[1.45rem] leading-tight font-medium text-white md:text-[2rem] lg:text-[2.35rem] xl:text-[2.55rem]"
				>
					Ce ne diferentiaza?
				</h2>
				<div class="mt-10 grid gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
					{#each differentiators as item (item.title)}
						<article
							class="media-diagonal-reverse group relative flex min-h-[19rem] flex-col overflow-hidden border-2 border-transparent bg-[#9b3551] p-7 shadow-[0_14px_36px_-18px_rgba(48,12,24,0.5)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-white hover:shadow-[0_20px_44px_-20px_rgba(35,8,18,0.6)] md:min-h-[17.5rem] md:p-8"
						>
							<h3
								class="pr-2 text-[1.55rem] leading-[1.12] font-medium tracking-[-0.02em] text-white md:text-[1.7rem] [font-family:var(--font-spectral)]"
							>
								{item.title}
							</h3>
							<p
								class="mt-4 flex-1 text-[0.98rem] leading-relaxed text-white/92 [font-family:var(--font-sans)]"
							>
								{item.body}
							</p>
							<div class="mt-8 flex justify-end md:mt-6">
								<a
									href={item.href ?? contentHref('about')}
									class="btn-diagonal inline-flex size-10 shrink-0 items-center justify-center border-2 border-white/80 text-white transition-colors duration-300 ease-out hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
									aria-label={`Afla mai multe: ${item.title}`}
								>
									<ArrowRight class="size-[1.05rem]" stroke-width={2} aria-hidden="true" />
								</a>
							</div>
						</article>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section class="relative border-b border-border bg-white px-6 py-14 md:py-20">
		<div class="mx-auto max-w-6xl space-y-16 md:space-y-24">
			{#each kogaionStoryBlocks as block, i (`${block.eyebrow}-${i}`)}
				<div
					class="grid gap-10 md:items-center md:gap-12 lg:gap-16 {i % 2 === 0
						? 'md:grid-cols-[1.05fr_0.95fr]'
						: 'md:grid-cols-[0.95fr_1.05fr]'}"
				>
					<div
						class="media-diagonal relative aspect-[4/3] min-h-[18rem] w-full overflow-hidden bg-[#e8f0fa] shadow-[0_20px_50px_-28px_rgba(12,48,68,0.35)] md:aspect-auto md:min-h-[26rem] lg:min-h-[28rem] {i % 2 === 0 ? '' : 'md:order-2'}"
					>
						<img
							src={block.image}
							alt={block.titleLines.join(' ')}
							class="size-full object-cover"
						/>
						<div
							class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#0c3044]/10 via-transparent to-transparent"
						></div>
						<div
							class="media-diagonal-soft absolute z-[1] w-fit max-w-[calc(100%-2.5rem)] border border-white/70 bg-white/92 px-4 py-2.5 text-[0.82rem] font-medium leading-snug text-[#0c3044] shadow-[0_12px_28px_-18px_rgba(12,48,68,0.28)] backdrop-blur-sm [font-family:var(--font-sans)] md:max-w-[min(100%-2.5rem,22rem)] {i % 2 === 0
								? 'right-4 bottom-4 md:right-6 md:bottom-6'
								: 'left-4 top-4 md:left-6 md:top-6'}"
						>
							{block.badge}
						</div>
					</div>
					<div
						class="flex flex-col justify-center {i % 2 === 0 ? 'md:order-none md:pl-0' : 'md:order-1 md:pr-0'}"
					>
						<p
							class="text-xs font-semibold tracking-[0.14em] text-[#0c3044]/75 uppercase [font-family:var(--font-sans)]"
						>
							{block.eyebrow}
						</p>
						<h2
							class="mt-4 max-w-[34rem] text-[1.45rem] leading-[1.18] font-medium tracking-[-0.01em] text-[#0c3044] md:text-[1.85rem] lg:text-[2.05rem] [font-family:var(--font-spectral)]"
						>
							{block.titleLines.join(' ')}
						</h2>
						<p
							class="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-[1.05rem] [font-family:var(--font-sans)]"
						>
							{block.intro}
						</p>
						<ul
							class="mt-6 max-w-xl list-outside list-disc space-y-2.5 pl-[1.1em] text-base leading-relaxed text-muted-foreground marker:text-[#0c3044] md:text-[1.02rem] [font-family:var(--font-sans)]"
						>
							{#each block.bullets as bullet (bullet)}
								<li class="pl-1">{bullet}</li>
							{/each}
						</ul>
						<a
							href={block.ctaHref}
							class="btn-diagonal mt-9 inline-flex min-h-12 items-center justify-center self-start px-6 py-3 text-center text-[0.9rem] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:text-[0.96rem] [font-family:var(--font-sans)] {block.ctaFilled
								? 'border border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white hover:border-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue-hover)] focus-visible:outline-[var(--brand-blue)]'
								: 'border border-[var(--brand-blue)] bg-transparent text-[var(--brand-blue)] hover:bg-[var(--brand-blue)] hover:text-white focus-visible:outline-[var(--brand-blue)]'}"
						>
							{block.ctaLabel}
						</a>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="relative bg-white px-0 py-14 md:py-20">
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
							href={`${programsHref}/${program.slug}`}
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
								<span class="btn-diagonal ml-auto inline-flex size-10 items-center justify-center border border-white text-white transition-colors group-hover:border-white group-hover:bg-[var(--brand-blue)]">
									<ArrowRight class="size-4" />
								</span>
							</div>
						</a>
					{/each}
				</div>
					<div class="mt-8 flex justify-center">
						<a
							href={programsHref}
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

	<section class="relative bg-white px-0 pt-0 pb-14 md:pb-20">
		<div class="w-full overflow-hidden rounded-tl-[5.6rem] rounded-br-[5.6rem] bg-[#f8fbff] md:rounded-tl-[7rem] md:rounded-br-[7rem]">
			<div class="w-full py-12 md:py-14">
				<div class="px-6 md:px-10">
					<p class="text-center text-xs font-semibold tracking-[0.22em] text-primary uppercase">Povesti inspirationale din comunitatea noastra</p>
					<h2 class="mx-auto mt-4 max-w-[1400px] text-center text-[1.45rem] leading-tight font-semibold text-foreground md:text-[2rem] lg:text-[2.35rem] xl:text-[2.55rem]">
						Vezi cum copiii nostri isi descopera si isi dezvolta potentialul
					</h2>
				</div>
				<div class="mt-9 overflow-hidden">
					<!-- Mobile: single snap carousel -->
					<div
						id="home-gallery-track-mobile"
						class="flex gap-3 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] snap-x snap-mandatory md:hidden [&::-webkit-scrollbar]:hidden"
					>
						{#each galleryImages as image, i (`gallery-mobile-${i}`)}
							<div
								data-gallery-item
								class="media-diagonal w-[min(280px,calc(100vw-2.5rem))] shrink-0 snap-center overflow-hidden"
							>
								<img
									src={image}
									alt=""
									class="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105"
								/>
							</div>
						{/each}
					</div>
					<!-- md+: two-row marquee style -->
					<div class="hidden space-y-3 md:block">
						<div
							id="home-gallery-track-top"
							class="-mx-[145px] flex gap-3 overflow-x-auto px-[145px] scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
						>
							{#each galleryRowOne as image, i (`gallery-top-${i}`)}
								<div
									data-gallery-item
									class="media-diagonal block w-[260px] shrink-0 overflow-hidden md:w-[290px]"
								>
									<img
										src={image}
										alt=""
										class="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105"
									/>
								</div>
							{/each}
						</div>
						<div
							id="home-gallery-track-bottom"
							class="-mx-[145px] flex gap-3 overflow-x-auto px-[145px] scroll-smooth pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
						>
							{#each galleryRowTwo as image, i (`gallery-bottom-${i}`)}
								<div
									data-gallery-item
									class="media-diagonal block w-[260px] shrink-0 overflow-hidden md:w-[290px]"
								>
									<img
										src={image}
										alt=""
										class="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105"
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
						aria-label="Previous stories"
						onclick={() => scrollGallery(-1)}
					>
						<ArrowLeft class="size-4" />
					</button>
					<button
						type="button"
						class="btn-diagonal-reverse inline-flex size-11 items-center justify-center border border-[var(--brand-blue)] bg-transparent text-[var(--brand-blue)] transition-colors hover:bg-[var(--brand-blue)] hover:text-white"
						aria-label="Next stories"
						onclick={() => scrollGallery(1)}
					>
						<ArrowRight class="size-4" />
					</button>
				</div>
			</div>
		</div>
	</section>
</main>
