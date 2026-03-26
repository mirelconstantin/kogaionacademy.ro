<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toastFromAction } from '$lib/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import MediaPicker from '$lib/components/cms/MediaPicker.svelte';
	import History from '@lucide/svelte/icons/history';
	import type { ActionData } from './$types';

	let { data }: { data: import('./$types').PageData } = $props();
	const base = $derived(page.url.pathname);

	/** Afișează toate secțiunile editabile care fac parte din pagină (ca pe site). */
	function visibleSection(sectionKey: string): boolean {
		return (data.defaultSectionKeys?.includes(sectionKey) ?? false);
	}

	let heroVideoUrl = $state('');
	let heroPosterUrl = $state('');
	$effect(() => {
		if (data.pageKey === 'home' && data.heroRo) {
			heroVideoUrl = data.heroRo.videoUrl ?? '';
			heroPosterUrl = data.heroRo.posterUrl ?? '';
		}
	});

	let result = $state<ActionData | null>(null);
	let activeLocale = $state<'ro' | 'en'>('ro');

	const homeSectionAnchors = [
		{ id: 'admin-section-hero', label: 'Hero (banner)', sectionKey: null as string | null },
		{ id: 'admin-section-intro', label: 'Intro', sectionKey: 'intro' },
		{ id: 'admin-section-hero-label', label: 'Etichetă hero', sectionKey: 'hero_label' },
		{ id: 'admin-section-stats', label: 'Statistici', sectionKey: 'stats' },
		{ id: 'admin-section-why-us', label: 'De ce Kogaion?', sectionKey: 'why_us' },
		{ id: 'admin-section-about-teaser', label: 'DESPRE', sectionKey: 'about_teaser' },
		{ id: 'admin-section-programs', label: 'Programe', sectionKey: 'programs_section' },
		{ id: 'admin-section-mentors', label: 'Mentori', sectionKey: 'mentors_preview' },
		{ id: 'admin-section-blog', label: 'Blog', sectionKey: 'blog_teaser' },
		{ id: 'admin-section-contact', label: 'Contact CTA', sectionKey: 'contact_cta' },
		{ id: 'admin-section-featured-heading', label: 'Titlu Programe', sectionKey: 'featured_heading' }
	];
	const aboutSectionAnchors = [
		{ id: 'admin-about-hero', label: 'Hero', sectionKey: 'hero' },
		{ id: 'admin-about-letter', label: 'Scrisoare / Viziune', sectionKey: 'letter' },
		{ id: 'admin-about-timeline', label: 'Timeline', sectionKey: 'timeline' },
		{ id: 'admin-about-mission', label: 'Misiune', sectionKey: 'mission' },
		{ id: 'admin-about-integrated', label: 'Integrat', sectionKey: 'integrated' },
		{ id: 'admin-about-transdisciplinary', label: 'Transdisciplinar', sectionKey: 'transdisciplinary' },
		{ id: 'admin-about-skills', label: 'Competențe', sectionKey: 'skills' },
		{ id: 'admin-about-founders', label: 'Fondatori', sectionKey: 'founders' },
		{ id: 'admin-about-age-cards', label: 'Carduri vârstă', sectionKey: 'age_cards' },
		{ id: 'admin-about-cta', label: 'CTA', sectionKey: 'cta_section' }
	];

	let aboutHero = $state<Record<string, string>>({
		backgroundImage: '',
		label: '',
		title: '',
		tagline: '',
		subline: '',
		ctaLabel: ''
	});
	let aboutLetter = $state<Record<string, string>>({
		greeting: '',
		p1: '',
		p2: '',
		p3: '',
		visionTitle: '',
		visionBody: ''
	});

	type StatsCard = { label: string; number: string; text: string };
	let homeIntro = $state<{ heading: string; body: string }>({ heading: '', body: '' });
	let homeHeroLabel = $state<string>('');
	let homeStat1 = $state<StatsCard>({ label: 'Susținere', number: '130+', text: 'familii implicate anual' });
	let homeStat2 = $state<StatsCard>({ label: 'Experiență', number: '10+ ani', text: 'programe integrate Kogaion' });
	let homeStat3 = $state<StatsCard>({ label: 'Comunitate', number: '3–17', text: 'ani, programe adaptate pe etape' });
	let homeFeaturedHeading = $state<string>('');
	let homeMentorsPreview = $state<{ title: string; lead: string; ctaLabel: string; ctaLink: string }>({
		title: '',
		lead: '',
		ctaLabel: '',
		ctaLink: ''
	});
	type WhyItem = { title: string; text: string };
	let homeWhyUs = $state<{ title: string; lead: string; item1: WhyItem; item2: WhyItem; item3: WhyItem }>({
		title: 'De ce Kogaion?',
		lead: '',
		item1: { title: '', text: '' },
		item2: { title: '', text: '' },
		item3: { title: '', text: '' }
	});
	let homeAboutTeaser = $state<{ title: string; body: string; ctaLabel: string; ctaLink: string }>({
		title: '',
		body: '',
		ctaLabel: '',
		ctaLink: ''
	});
	let homeProgramsSection = $state<{ title: string; lead: string; ctaLabel: string }>({
		title: '',
		lead: '',
		ctaLabel: ''
	});
	let homeBlogTeaser = $state<{ title: string; lead: string; ctaLabel: string; ctaLink: string }>({
		title: '',
		lead: '',
		ctaLabel: '',
		ctaLink: ''
	});
	let homeContactCta = $state<{ title: string; body: string; ctaLabel: string; ctaLink: string }>({
		title: '',
		body: '',
		ctaLabel: '',
		ctaLink: ''
	});

	$effect(() => {
		if (data.pageKey === 'home') {
			const intro = data.sections.find((s) => s.section === 'intro' && s.locale === 'ro')?.payload as { heading?: string; body?: string } | undefined;
			homeIntro = { heading: intro?.heading ?? '', body: intro?.body ?? '' };
			const heroLabel = data.sections.find((s) => s.section === 'hero_label' && s.locale === 'ro')?.payload as { text?: string } | undefined;
			homeHeroLabel = heroLabel?.text ?? 'Kogaion Gifted Academy';
			const stats = data.sections.find((s) => s.section === 'stats' && s.locale === 'ro')?.payload as { card1?: StatsCard; card2?: StatsCard; card3?: StatsCard } | undefined;
			if (stats?.card1 && stats?.card2 && stats?.card3) {
				homeStat1 = { ...stats.card1 };
				homeStat2 = { ...stats.card2 };
				homeStat3 = { ...stats.card3 };
			}
			const feat = data.sections.find((s) => s.section === 'featured_heading' && s.locale === 'ro')?.payload as { title?: string } | undefined;
			homeFeaturedHeading = feat?.title ?? '';
			const mentors = data.sections.find((s) => s.section === 'mentors_preview' && s.locale === 'ro')?.payload as {
				title?: string;
				lead?: string;
				ctaLabel?: string;
				ctaLink?: string;
			} | undefined;
			if (mentors)
				homeMentorsPreview = {
					title: mentors.title ?? '',
					lead: mentors.lead ?? '',
					ctaLabel: mentors.ctaLabel ?? '',
					ctaLink: mentors.ctaLink ?? ''
				};
			const why = data.sections.find((s) => s.section === 'why_us' && s.locale === 'ro')?.payload as typeof homeWhyUs | undefined;
			if (why) homeWhyUs = { title: why.title ?? '', lead: why.lead ?? '', item1: why.item1 ?? { title: '', text: '' }, item2: why.item2 ?? { title: '', text: '' }, item3: why.item3 ?? { title: '', text: '' } };
			const aboutT = data.sections.find((s) => s.section === 'about_teaser' && s.locale === 'ro')?.payload as typeof homeAboutTeaser | undefined;
			if (aboutT) homeAboutTeaser = { title: aboutT.title ?? '', body: aboutT.body ?? '', ctaLabel: aboutT.ctaLabel ?? '', ctaLink: aboutT.ctaLink ?? '' };
			const prog = data.sections.find((s) => s.section === 'programs_section' && s.locale === 'ro')?.payload as typeof homeProgramsSection | undefined;
			if (prog) homeProgramsSection = { title: prog.title ?? '', lead: prog.lead ?? '', ctaLabel: prog.ctaLabel ?? '' };
			const blog = data.sections.find((s) => s.section === 'blog_teaser' && s.locale === 'ro')?.payload as typeof homeBlogTeaser | undefined;
			if (blog)
				homeBlogTeaser = {
					title: blog.title ?? '',
					lead: blog.lead ?? '',
					ctaLabel: blog.ctaLabel ?? '',
					ctaLink: blog.ctaLink ?? ''
				};
			const contact = data.sections.find((s) => s.section === 'contact_cta' && s.locale === 'ro')?.payload as typeof homeContactCta | undefined;
			if (contact) homeContactCta = { title: contact.title ?? '', body: contact.body ?? '', ctaLabel: contact.ctaLabel ?? '', ctaLink: contact.ctaLink ?? '' };
		}
	});

	$effect(() => {
		if (data.pageKey !== 'about') return;
		const hero = data.sections.find((s) => s.section === 'hero' && s.locale === 'ro')?.payload as Record<string, string> | undefined;
		const letter = data.sections.find((s) => s.section === 'letter' && s.locale === 'ro')?.payload as Record<string, string> | undefined;
		aboutHero = { backgroundImage: '', label: '', title: '', tagline: '', subline: '', ctaLabel: '', ...hero };
		aboutLetter = { greeting: '', p1: '', p2: '', p3: '', visionTitle: '', visionBody: '', ...letter };
	});

	type TimelineItem = { year: string; title: string; text: string };
	let aboutTimeline = $state<{ title: string; intro: string; items: TimelineItem[] }>({
		title: '',
		intro: '',
		items: [{ year: '', title: '', text: '' }, { year: '', title: '', text: '' }, { year: '', title: '', text: '' }]
	});
	let aboutMission = $state<Record<string, string>>({ title: '', bullet1: '', bullet2: '', bullet3: '' });
	let aboutIntegrated = $state<{ title: string; intro: string; items: string[] }>({ title: '', intro: '', items: ['', '', '', '', ''] });
	let aboutTrans = $state<Record<string, string>>({ title: '', body: '' });
	let aboutSkills = $state<{ intro: string; skills: string[] }>({ intro: '', skills: Array.from({ length: 9 }, () => '') });
	let aboutFounders = $state<Record<string, string>>({ title: '', intro: '' });
	type AgeCard = { title: string; age: string; image: string; ctaLabel: string; ctaLink: string };
	let aboutAgeCards = $state<{ title: string; intro: string; cards: AgeCard[] }>({
		title: '',
		intro: '',
		cards: [
			{ title: '', age: '', image: '', ctaLabel: '', ctaLink: '' },
			{ title: '', age: '', image: '', ctaLabel: '', ctaLink: '' },
			{ title: '', age: '', image: '', ctaLabel: '', ctaLink: '' }
		]
	});
	let aboutCta = $state<Record<string, string>>({
		programsTitle: '',
		programsIntro: '',
		mentorsTitle: '',
		mentorsLead: '',
		connect: ''
	});

	$effect(() => {
		if (data.pageKey !== 'about') return;
		const tl = data.sections.find((s) => s.section === 'timeline' && s.locale === 'ro')?.payload as
			| { title?: string; intro?: string; items?: TimelineItem[] }
			| undefined;
		if (tl) {
			aboutTimeline = {
				title: tl.title ?? '',
				intro: tl.intro ?? '',
				items: Array.isArray(tl.items) && tl.items.length >= 3
					? [tl.items[0], tl.items[1], tl.items[2]]
					: [{ year: '', title: '', text: '' }, { year: '', title: '', text: '' }, { year: '', title: '', text: '' }]
			};
		}
		const mission = data.sections.find((s) => s.section === 'mission' && s.locale === 'ro')?.payload as Record<string, string> | undefined;
		if (mission) aboutMission = { title: '', bullet1: '', bullet2: '', bullet3: '', ...mission };
		const int = data.sections.find((s) => s.section === 'integrated' && s.locale === 'ro')?.payload as { title?: string; intro?: string; items?: string[] } | undefined;
		if (int) aboutIntegrated = { title: int.title ?? '', intro: int.intro ?? '', items: Array.isArray(int.items) ? [...int.items, '', '', '', '', ''].slice(0, 5) : ['', '', '', '', ''] };
		const tr = data.sections.find((s) => s.section === 'transdisciplinary' && s.locale === 'ro')?.payload as Record<string, string> | undefined;
		if (tr) aboutTrans = { title: '', body: '', ...tr };
		const sk = data.sections.find((s) => s.section === 'skills' && s.locale === 'ro')?.payload as { intro?: string; skills?: string[] } | undefined;
		if (sk) aboutSkills = { intro: sk.intro ?? '', skills: Array.isArray(sk.skills) ? [...sk.skills, ...Array(9).fill('')].slice(0, 9) : Array.from({ length: 9 }, () => '') };
		const fo = data.sections.find((s) => s.section === 'founders' && s.locale === 'ro')?.payload as Record<string, string> | undefined;
		if (fo) aboutFounders = { title: '', intro: '', ...fo };
		const ac = data.sections.find((s) => s.section === 'age_cards' && s.locale === 'ro')?.payload as { title?: string; intro?: string; cards?: AgeCard[] } | undefined;
		if (ac) aboutAgeCards = { title: ac.title ?? '', intro: ac.intro ?? '', cards: Array.isArray(ac.cards) && ac.cards.length >= 3 ? ac.cards.slice(0, 3).map((c) => ({ title: c?.title ?? '', age: c?.age ?? '', image: c?.image ?? '', ctaLabel: c?.ctaLabel ?? '', ctaLink: c?.ctaLink ?? '' })) : [{ title: '', age: '', image: '', ctaLabel: '', ctaLink: '' }, { title: '', age: '', image: '', ctaLabel: '', ctaLink: '' }, { title: '', age: '', image: '', ctaLabel: '', ctaLink: '' }] };
		const cta = data.sections.find((s) => s.section === 'cta_section' && s.locale === 'ro')?.payload as Record<string, string> | undefined;
		if (cta) aboutCta = { programsTitle: '', programsIntro: '', mentorsTitle: '', mentorsLead: '', connect: '', ...cta };
	});

	let programsHero = $state<Record<string, string>>({ title: '', intro: '' });
	let mentorsHero = $state<Record<string, string>>({ title: '', intro: '' });
	let mentorsCta = $state<Record<string, string>>({ title: '', body: '', buttonLabel: '' });
	let contactHero = $state<Record<string, string>>({ title: '', intro: '' });

	const SOCIAL_NETWORKS = [
		{ key: 'instagram', label: 'Instagram' },
		{ key: 'facebook', label: 'Facebook' },
		{ key: 'linkedin', label: 'LinkedIn' },
		{ key: 'youtube', label: 'YouTube' },
		{ key: 'twitter', label: 'X (Twitter)' },
		{ key: 'tiktok', label: 'TikTok' }
	] as const;
	let contactSocials = $state<Record<string, string>>({});

	let editingProgramId = $state<number | null>(null);
	let programImageUrl = $state('');

	$effect(() => {
		if (editingProgramId && data.programs) {
			const prog = data.programs.find((p) => p.id === editingProgramId);
			programImageUrl = prog?.image ?? '';
		}
	});

	$effect(() => {
		if (data.pageKey === 'programs') {
			const h = data.sections.find((s) => s.section === 'hero' && s.locale === 'ro')?.payload as Record<string, string> | undefined;
			if (h) programsHero = { title: '', intro: '', ...h };
		}
		if (data.pageKey === 'mentors') {
			const h = data.sections.find((s) => s.section === 'hero' && s.locale === 'ro')?.payload as Record<string, string> | undefined;
			if (h) mentorsHero = { title: '', intro: '', ...h };
			const c = data.sections.find((s) => s.section === 'cta' && s.locale === 'ro')?.payload as Record<string, string> | undefined;
			if (c) mentorsCta = { title: '', body: '', buttonLabel: '', ...c };
		}
		if (data.pageKey === 'contact') {
			const h = data.sections.find((s) => s.section === 'hero' && s.locale === 'ro')?.payload as Record<string, string> | undefined;
			if (h) contactHero = { title: '', intro: '', ...h };
			const socials = (data.contactRo?.socials ?? []) as { name: string; url: string }[];
			contactSocials = Object.fromEntries(
				SOCIAL_NETWORKS.map((n) => [n.key, socials.find((s) => s.name?.toLowerCase() === n.key)?.url ?? ''])
			);
		}
	});

</script>

<div>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h2 class="text-2xl font-semibold text-foreground">Editezi pagina {data.pageKey === 'home' ? 'Pagina principală' : data.pageKey === 'about' ? 'Despre' : data.pageKey === 'programs' ? 'Programe' : data.pageKey === 'contact' ? 'Contact' : data.pageKey === 'mentors' ? 'Mentori' : 'Conținut'}</h2>
		<Button href="/admin/history?context={data.pageKey}" variant="outline" class="rounded-none" size="sm">
			<History class="size-4 shrink-0" aria-hidden="true" />
			Istoric modificări
		</Button>
	</div>
	<p class="mt-2 rounded-none border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
		Conținutul din secțiuni se editează aici. Pentru paginile cu formulare dedicate (Home, Despre), folosește câmpurile de mai jos. Modificările se salvează în baza de date și apar imediat pe site.
	</p>
	{#if data.pageKey === 'home'}
		<nav class="mt-4 flex flex-wrap gap-2 rounded-none border border-border/60 bg-muted/20 px-3 py-2" aria-label="Secțiuni pagină">
			{#each homeSectionAnchors.filter((a) => a.sectionKey === null ? (data.heroRo || data.heroEn) : visibleSection(a.sectionKey)) as { id, label }}
				<a href="#{id}" class="text-sm text-muted-foreground underline hover:text-foreground">{label}</a>
			{/each}
		</nav>
	{/if}
	{#if data.pageKey === 'about'}
		<nav class="mt-4 flex flex-wrap gap-2 rounded-none border border-border/60 bg-muted/20 px-3 py-2" aria-label="Secțiuni pagină">
			{#each aboutSectionAnchors as { id, label }}
				<a href="#{id}" class="text-sm text-muted-foreground underline hover:text-foreground">{label}</a>
			{/each}
		</nav>
	{/if}

	{#if data.pageKey === 'home' && (data.heroRo || data.heroEn)}
		<details id="admin-section-hero" class="group mt-8 scroll-mt-4 rounded-none border border-border bg-card" open>
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">
				Setări hero (banner)
			</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Video, poster și butoanele din banner.</p>
			<form
				method="POST"
				action={`${base}?/updateHero`}
				use:enhance={() => ({ result: r }) => {
					const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
					if (r.type === 'success' && r.data) result = r.data as ActionData;
				}}
				class="mt-4 space-y-4"
			>
				<input type="hidden" name="locale" value="ro" />
				<input type="hidden" name="videoUrl" value={heroVideoUrl} />
				<input type="hidden" name="posterUrl" value={heroPosterUrl} />
				<div class="space-y-2">
					<Label>Video banner</Label>
					<MediaPicker bind:value={heroVideoUrl} label="Selectează video din Media" />
				</div>
				<div class="space-y-2">
					<Label>Imagine fundal banner (dacă video nu se încarcă)</Label>
					<MediaPicker bind:value={heroPosterUrl} label="Alege imagine din Media" />
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="ctaPrimaryLabel">Text buton principal</Label>
						<Input
							id="ctaPrimaryLabel"
							name="ctaPrimaryLabel"
							value={data.heroRo?.ctaPrimaryLabel ?? ''}
							class="rounded-none"
						/>
					</div>
					<div class="space-y-2">
						<Label for="ctaPrimaryLink">Link buton principal</Label>
						<Input
							id="ctaPrimaryLink"
							name="ctaPrimaryLink"
							value={data.heroRo?.ctaPrimaryLink ?? ''}
							class="rounded-none"
						/>
					</div>
					<div class="space-y-2">
						<Label for="ctaSecondaryLabel">Text buton secundar</Label>
						<Input
							id="ctaSecondaryLabel"
							name="ctaSecondaryLabel"
							value={data.heroRo?.ctaSecondaryLabel ?? ''}
							class="rounded-none"
						/>
					</div>
					<div class="space-y-2">
						<Label for="ctaSecondaryLink">Link buton secundar</Label>
						<Input
							id="ctaSecondaryLink"
							name="ctaSecondaryLink"
							value={data.heroRo?.ctaSecondaryLink ?? ''}
							class="rounded-none"
						/>
					</div>
				</div>
				<Button type="submit" class="rounded-none">Salvează hero</Button>
			</form>
			</div>
		</details>
	{/if}

	{#if data.pageKey === 'home' && visibleSection('intro')}
		<details id="admin-section-intro" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card" open>
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">
				Secțiune Intro (sub hero)
			</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Titlul și paragraful din blocul albastru deschis.</p>
			<form
				method="POST"
				action={`${base}?/updateSection`}
				use:enhance={() => async ({ result: r }) => {
					const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
					if (r.type === 'success' && r.data) {
						result = r.data as ActionData;
						await invalidateAll();
					}
				}}
				class="mt-4 space-y-4"
			>
				<input type="hidden" name="page" value="home" />
				<input type="hidden" name="section" value="intro" />
				<input type="hidden" name="locale" value="ro" />
				<input type="hidden" name="payload" value={JSON.stringify({ heading: homeIntro.heading, body: homeIntro.body })} />
				<div class="space-y-2">
					<Label for="home-intro-heading">Titlu secțiune</Label>
					<Input id="home-intro-heading" class="rounded-none" bind:value={homeIntro.heading} />
				</div>
				<div class="space-y-2">
					<Label for="home-intro-body">Text intro (paragraf sub titlu)</Label>
					<Textarea id="home-intro-body" class="rounded-none" rows={3} bind:value={homeIntro.body} />
				</div>
				<Button type="submit" class="rounded-none">Salvează Intro</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if data.pageKey === 'home' && visibleSection('hero_label')}
		<details id="admin-section-hero-label" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Etichetă hero</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Textul mic deasupra titlului principal (ex: Kogaion Gifted Academy).</p>
			<form
				method="POST"
				action={`${base}?/updateSection`}
				use:enhance={() => async ({ result: r }) => {
					const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
					if (r.type === 'success' && r.data) {
						result = r.data as ActionData;
						await invalidateAll();
					}
				}}
				class="mt-4 space-y-4"
			>
				<input type="hidden" name="page" value="home" />
				<input type="hidden" name="section" value="hero_label" />
				<input type="hidden" name="locale" value="ro" />
				<input type="hidden" name="payload" value={JSON.stringify({ text: homeHeroLabel })} />
				<div class="space-y-2">
					<Label for="home-hero-label">Text mic deasupra titlului (ex: Kogaion Gifted Academy)</Label>
					<Input id="home-hero-label" class="rounded-none" bind:value={homeHeroLabel} />
				</div>
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if data.pageKey === 'home' && visibleSection('stats')}
		<details id="admin-section-stats" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Statistici hero (3 carduri)</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Fiecare card se editează și se salvează separat.</p>
			<div class="space-y-6">
				<!-- Card 1 -->
				<form
					method="POST"
					action={`${base}?/updateSection`}
					use:enhance={() => async ({ result: r }) => {
						const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
						if (r.type === 'success' && r.data) {
							result = r.data as ActionData;
							await invalidateAll();
						}
					}}
					class="rounded border border-border/60 p-4 space-y-3"
				>
					<input type="hidden" name="page" value="home" />
					<input type="hidden" name="section" value="stats" />
					<input type="hidden" name="locale" value="ro" />
					<input type="hidden" name="payload" value={JSON.stringify({ card1: homeStat1 })} />
					<p class="text-sm font-medium text-muted-foreground">Card 1</p>
					<div class="grid gap-2 sm:grid-cols-3">
						<Input class="rounded-none" placeholder="Denumire (ex: Susținere)" bind:value={homeStat1.label} />
						<Input class="rounded-none" placeholder="Cifră (ex: 130+)" bind:value={homeStat1.number} />
						<Input class="rounded-none" placeholder="Descriere (ex: familii implicate anual)" bind:value={homeStat1.text} />
					</div>
					<Button type="submit" class="rounded-none">Salvează card 1</Button>
				</form>
				<!-- Card 2 -->
				<form
					method="POST"
					action={`${base}?/updateSection`}
					use:enhance={() => async ({ result: r }) => {
						const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
						if (r.type === 'success' && r.data) {
							result = r.data as ActionData;
							await invalidateAll();
						}
					}}
					class="rounded border border-border/60 p-4 space-y-3"
				>
					<input type="hidden" name="page" value="home" />
					<input type="hidden" name="section" value="stats" />
					<input type="hidden" name="locale" value="ro" />
					<input type="hidden" name="payload" value={JSON.stringify({ card2: homeStat2 })} />
					<p class="text-sm font-medium text-muted-foreground">Card 2</p>
					<div class="grid gap-2 sm:grid-cols-3">
						<Input class="rounded-none" placeholder="Denumire (ex: Experiență)" bind:value={homeStat2.label} />
						<Input class="rounded-none" placeholder="Cifră (ex: 10+ ani)" bind:value={homeStat2.number} />
						<Input class="rounded-none" placeholder="Descriere" bind:value={homeStat2.text} />
					</div>
					<Button type="submit" class="rounded-none">Salvează card 2</Button>
				</form>
				<!-- Card 3 -->
				<form
					method="POST"
					action={`${base}?/updateSection`}
					use:enhance={() => async ({ result: r }) => {
						const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
						if (r.type === 'success' && r.data) {
							result = r.data as ActionData;
							await invalidateAll();
						}
					}}
					class="rounded border border-border/60 p-4 space-y-3"
				>
					<input type="hidden" name="page" value="home" />
					<input type="hidden" name="section" value="stats" />
					<input type="hidden" name="locale" value="ro" />
					<input type="hidden" name="payload" value={JSON.stringify({ card3: homeStat3 })} />
					<p class="text-sm font-medium text-muted-foreground">Card 3</p>
					<div class="grid gap-2 sm:grid-cols-3">
						<Input class="rounded-none" placeholder="Denumire (ex: Comunitate)" bind:value={homeStat3.label} />
						<Input class="rounded-none" placeholder="Cifră (ex: 3–17)" bind:value={homeStat3.number} />
						<Input class="rounded-none" placeholder="Descriere" bind:value={homeStat3.text} />
					</div>
					<Button type="submit" class="rounded-none">Salvează card 3</Button>
				</form>
			</div>
			</div>
		</details>
	{/if}
	{#if data.pageKey === 'home' && visibleSection('featured_heading')}
		<details id="admin-section-featured-heading" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Titlu bloc Programe</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Titlul blocului Programe pe home.</p>
			<form
				method="POST"
				action={`${base}?/updateSection`}
				use:enhance={() => async ({ result: r }) => {
					const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
					if (r.type === 'success' && r.data) {
						result = r.data as ActionData;
						await invalidateAll();
					}
				}}
				class="mt-4 space-y-4"
			>
				<input type="hidden" name="page" value="home" />
				<input type="hidden" name="section" value="featured_heading" />
				<input type="hidden" name="locale" value="ro" />
				<input type="hidden" name="payload" value={JSON.stringify({ title: homeFeaturedHeading })} />
				<div class="space-y-2">
					<Label for="home-featured-heading">Titlu bloc Programe</Label>
					<Input id="home-featured-heading" class="rounded-none" bind:value={homeFeaturedHeading} />
				</div>
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if data.pageKey === 'home' && visibleSection('mentors_preview')}
		<details id="admin-section-mentors" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Secțiune Mentori</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Titlul și introducerea blocului Mentori pe home.</p>
			<form
				method="POST"
				action={`${base}?/updateSection`}
				use:enhance={() => async ({ result: r }) => {
					const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
					if (r.type === 'success' && r.data) {
						result = r.data as ActionData;
						await invalidateAll();
					}
				}}
				class="mt-4 space-y-4"
			>
				<input type="hidden" name="page" value="home" />
				<input type="hidden" name="section" value="mentors_preview" />
				<input type="hidden" name="locale" value="ro" />
				<input type="hidden" name="payload" value={JSON.stringify(homeMentorsPreview)} />
				<div class="space-y-2">
					<Label for="home-mentors-title">Titlu secțiune</Label>
					<Input id="home-mentors-title" class="rounded-none" bind:value={homeMentorsPreview.title} />
				</div>
				<div class="space-y-2">
					<Label for="home-mentors-lead">Introducere (text scurt)</Label>
					<Textarea id="home-mentors-lead" class="rounded-none" rows={2} bind:value={homeMentorsPreview.lead} />
				</div>
				<div class="space-y-2">
					<Label for="home-mentors-cta-label">Text buton</Label>
					<Input id="home-mentors-cta-label" class="rounded-none" bind:value={homeMentorsPreview.ctaLabel} />
				</div>
				<div class="space-y-2">
					<Label for="home-mentors-cta-link">Link buton</Label>
					<Input id="home-mentors-cta-link" class="rounded-none" bind:value={homeMentorsPreview.ctaLink} />
				</div>
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if data.pageKey === 'home' && visibleSection('why_us')}
		<details id="admin-section-why-us" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Secțiune De ce Kogaion?</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Titlu, lead și cele 3 carduri (De ce Kogaion?).</p>
			<form
				method="POST"
				action={`${base}?/updateSection`}
				use:enhance={() => async ({ result: r }) => {
					const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
					if (r.type === 'success' && r.data) {
						result = r.data as ActionData;
						await invalidateAll();
					}
				}}
				class="mt-4 space-y-4"
			>
				<input type="hidden" name="page" value="home" />
				<input type="hidden" name="section" value="why_us" />
				<input type="hidden" name="locale" value="ro" />
				<input type="hidden" name="payload" value={JSON.stringify(homeWhyUs)} />
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label>Titlu secțiune</Label>
						<Input class="rounded-none" bind:value={homeWhyUs.title} />
					</div>
					<div class="space-y-2 sm:col-span-2">
						<Label>Introducere (text scurt)</Label>
						<Textarea class="rounded-none" rows={2} bind:value={homeWhyUs.lead} />
					</div>
					{#each [homeWhyUs.item1, homeWhyUs.item2, homeWhyUs.item3] as item, i}
						<div class="space-y-2 rounded border border-border/60 p-3 sm:col-span-2">
							<p class="text-sm font-medium text-muted-foreground">Card {i + 1}</p>
							<Input class="rounded-none" placeholder="Titlu" bind:value={item.title} />
							<Textarea class="rounded-none" rows={2} placeholder="Text" bind:value={item.text} />
						</div>
					{/each}
				</div>
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if data.pageKey === 'home' && visibleSection('about_teaser')}
		<details id="admin-section-about-teaser" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Secțiune DESPRE</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Titlu, text și buton pentru blocul DESPRE pe home.</p>
			<form
				method="POST"
				action={`${base}?/updateSection`}
				use:enhance={() => async ({ result: r }) => {
					const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
					if (r.type === 'success' && r.data) {
						result = r.data as ActionData;
						await invalidateAll();
					}
				}}
				class="mt-4 space-y-4"
			>
				<input type="hidden" name="page" value="home" />
				<input type="hidden" name="section" value="about_teaser" />
				<input type="hidden" name="locale" value="ro" />
				<input type="hidden" name="payload" value={JSON.stringify(homeAboutTeaser)} />
				<div class="space-y-2">
					<Label>Titlu secțiune</Label>
					<Input class="rounded-none" bind:value={homeAboutTeaser.title} />
				</div>
				<div class="space-y-2">
					<Label>Body</Label>
					<Textarea class="rounded-none" rows={4} bind:value={homeAboutTeaser.body} />
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label>Text buton</Label>
						<Input class="rounded-none" bind:value={homeAboutTeaser.ctaLabel} />
					</div>
					<div class="space-y-2">
						<Label>Link buton</Label>
						<Input class="rounded-none" bind:value={homeAboutTeaser.ctaLink} />
					</div>
				</div>
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if data.pageKey === 'home' && visibleSection('programs_section')}
		<details id="admin-section-programs" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Secțiune Programe</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Titlu, introducere și buton pentru secțiunea Programe pe home.</p>
			<form
				method="POST"
				action={`${base}?/updateSection`}
				use:enhance={() => async ({ result: r }) => {
					const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
					if (r.type === 'success' && r.data) {
						result = r.data as ActionData;
						await invalidateAll();
					}
				}}
				class="mt-4 space-y-4"
			>
				<input type="hidden" name="page" value="home" />
				<input type="hidden" name="section" value="programs_section" />
				<input type="hidden" name="locale" value="ro" />
				<input type="hidden" name="payload" value={JSON.stringify(homeProgramsSection)} />
				<div class="space-y-2">
					<Label>Titlu secțiune</Label>
					<Input class="rounded-none" bind:value={homeProgramsSection.title} />
				</div>
				<div class="space-y-2">
					<Label>Introducere (text scurt)</Label>
					<Textarea class="rounded-none" rows={2} bind:value={homeProgramsSection.lead} />
				</div>
				<div class="space-y-2">
					<Label>Text buton</Label>
					<Input class="rounded-none" bind:value={homeProgramsSection.ctaLabel} />
				</div>
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if data.pageKey === 'home' && visibleSection('blog_teaser')}
		<details id="admin-section-blog" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Secțiune Blog</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Titlu, introducere și buton pentru secțiunea Blog pe home.</p>
			<form
				method="POST"
				action={`${base}?/updateSection`}
				use:enhance={() => async ({ result: r }) => {
					const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
					if (r.type === 'success' && r.data) {
						result = r.data as ActionData;
						await invalidateAll();
					}
				}}
				class="mt-4 space-y-4"
			>
				<input type="hidden" name="page" value="home" />
				<input type="hidden" name="section" value="blog_teaser" />
				<input type="hidden" name="locale" value="ro" />
				<input type="hidden" name="payload" value={JSON.stringify(homeBlogTeaser)} />
				<div class="space-y-2">
					<Label>Titlu secțiune</Label>
					<Input class="rounded-none" bind:value={homeBlogTeaser.title} />
				</div>
				<div class="space-y-2">
					<Label>Introducere (text scurt)</Label>
					<Textarea class="rounded-none" rows={2} bind:value={homeBlogTeaser.lead} />
				</div>
				<div class="space-y-2">
					<Label>Text buton</Label>
					<Input class="rounded-none" bind:value={homeBlogTeaser.ctaLabel} />
				</div>
				<div class="space-y-2">
					<Label>Link buton</Label>
					<Input class="rounded-none" bind:value={homeBlogTeaser.ctaLink} />
				</div>
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if data.pageKey === 'home' && visibleSection('contact_cta')}
		<details id="admin-section-contact" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Secțiune Contact CTA</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Titlu, body și butonul CTA din banda de contact de la finalul paginii.</p>
			<form
				method="POST"
				action={`${base}?/updateSection`}
				use:enhance={() => async ({ result: r }) => {
					const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
					if (r.type === 'success' && r.data) {
						result = r.data as ActionData;
						await invalidateAll();
					}
				}}
				class="mt-4 space-y-4"
			>
				<input type="hidden" name="page" value="home" />
				<input type="hidden" name="section" value="contact_cta" />
				<input type="hidden" name="locale" value="ro" />
				<input type="hidden" name="payload" value={JSON.stringify(homeContactCta)} />
				<div class="space-y-2">
					<Label>Titlu secțiune</Label>
					<Input class="rounded-none" bind:value={homeContactCta.title} />
				</div>
				<div class="space-y-2">
					<Label>Body</Label>
					<Textarea class="rounded-none" rows={3} bind:value={homeContactCta.body} />
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label>Text buton</Label>
						<Input class="rounded-none" bind:value={homeContactCta.ctaLabel} />
					</div>
					<div class="space-y-2">
						<Label>Link buton</Label>
						<Input class="rounded-none" bind:value={homeContactCta.ctaLink} />
					</div>
				</div>
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}

	{#if result?.error}
		<p class="mt-4 text-sm text-destructive">{result.error}</p>
	{/if}
	{#if result?.success}
		<p class="mt-4 text-sm text-primary">Salvat.</p>
	{/if}

	{#if data.pageKey === 'about'}
	{#if visibleSection('hero')}
		<details id="admin-about-hero" class="group mt-8 scroll-mt-4 rounded-none border border-border bg-card" open>
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Secțiune Hero (banner pagină Despre)</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Titlul și textele din partea de sus a paginii Despre.</p>
			<form
				method="POST"
				action={`${base}?/updateSection`}
				use:enhance={() => async ({ result: r }) => {
					const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
					if (r.type === 'success' && r.data) {
						result = r.data as ActionData;
						await invalidateAll();
					}
				}}
				class="mt-4 space-y-4"
			>
				<input type="hidden" name="page" value="about" />
				<input type="hidden" name="section" value="hero" />
				<input type="hidden" name="locale" value="ro" />
				<input type="hidden" name="payload" value={JSON.stringify(aboutHero)} />
				<div class="space-y-2">
					<Label for="about-hero-bg">Imagine fundal</Label>
					<MediaPicker bind:value={aboutHero.backgroundImage} label="Alege imagine din Media" />
				</div>
				<div class="space-y-2">
					<Label for="about-hero-label">Etichetă deasupra titlului</Label>
					<Input id="about-hero-label" class="rounded-none" bind:value={aboutHero.label} />
				</div>
				<div class="space-y-2">
					<Label for="about-hero-title">Titlu principal</Label>
					<Input id="about-hero-title" class="rounded-none" bind:value={aboutHero.title} />
				</div>
				<div class="space-y-2">
					<Label for="about-hero-tagline">Subtitlu / tagline</Label>
					<Input id="about-hero-tagline" class="rounded-none" bind:value={aboutHero.tagline} />
				</div>
				<div class="space-y-2">
					<Label for="about-hero-subline">Text sub tagline</Label>
					<Textarea id="about-hero-subline" class="rounded-none" rows={2} bind:value={aboutHero.subline} />
				</div>
				<div class="space-y-2">
					<Label for="about-hero-cta">Text buton CTA</Label>
					<Input id="about-hero-cta" class="rounded-none" bind:value={aboutHero.ctaLabel} />
				</div>
				<Button type="submit" class="rounded-none">Salvează secțiunea Hero</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if visibleSection('letter')}
		<details id="admin-about-letter" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Secțiune Scrisoare / Viziune</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Blocul cu salutul și paragrafele de prezentare.</p>
			<form
				method="POST"
				action={`${base}?/updateSection`}
				use:enhance={() => async ({ result: r }) => {
					const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p);
					if (r.type === 'success' && r.data) {
						result = r.data as ActionData;
						await invalidateAll();
					}
				}}
				class="mt-4 space-y-4"
			>
				<input type="hidden" name="page" value="about" />
				<input type="hidden" name="section" value="letter" />
				<input type="hidden" name="locale" value="ro" />
				<input type="hidden" name="payload" value={JSON.stringify(aboutLetter)} />
				<div class="space-y-2">
					<Label for="about-letter-greeting">Salut / primul paragraf scrisoare</Label>
					<Input id="about-letter-greeting" class="rounded-none" bind:value={aboutLetter.greeting} />
				</div>
				<div class="space-y-2">
					<Label for="about-letter-p1">Paragraf scrisoare 1</Label>
					<Textarea id="about-letter-p1" class="rounded-none" rows={3} bind:value={aboutLetter.p1} />
				</div>
				<div class="space-y-2">
					<Label for="about-letter-p2">Paragraf scrisoare 2</Label>
					<Textarea id="about-letter-p2" class="rounded-none" rows={3} bind:value={aboutLetter.p2} />
				</div>
				<div class="space-y-2">
					<Label for="about-letter-p3">Paragraf scrisoare 3</Label>
					<Textarea id="about-letter-p3" class="rounded-none" rows={3} bind:value={aboutLetter.p3} />
				</div>
				<div class="space-y-2">
					<Label for="about-vision-title">Titlu viziune</Label>
					<Input id="about-vision-title" class="rounded-none" bind:value={aboutLetter.visionTitle} />
				</div>
				<div class="space-y-2">
					<Label for="about-vision-body">Text viziune</Label>
					<Textarea id="about-vision-body" class="rounded-none" rows={3} bind:value={aboutLetter.visionBody} />
				</div>
				<Button type="submit" class="rounded-none">Salvează secțiunea Scrisoare</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if visibleSection('timeline')}
		<details id="admin-about-timeline" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Timeline</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<form method="POST" action={`${base}?/updateSection`} use:enhance={() => async ({ result: r }) => { const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p); if (r.type === 'success' && r.data) { result = r.data as ActionData; await invalidateAll(); } }} class="mt-4 space-y-4">
				<input type="hidden" name="page" value="about" /><input type="hidden" name="section" value="timeline" /><input type="hidden" name="locale" value="ro" /><input type="hidden" name="payload" value={JSON.stringify(aboutTimeline)} />
				<Label>Titlu</Label><Input class="rounded-none" bind:value={aboutTimeline.title} />
				<Label>Scurtă descriere (sub titlu)</Label><Textarea class="rounded-none" rows={2} bind:value={aboutTimeline.intro} />
				{#each aboutTimeline.items as item, i}
					<div class="space-y-2 rounded border border-border/60 p-3">
						<Label>An (ex: 2020)</Label><Input class="rounded-none" bind:value={item.year} />
						<Label>Titlu eveniment</Label><Input class="rounded-none" bind:value={item.title} />
						<Label>Descriere eveniment</Label><Textarea class="rounded-none" rows={2} bind:value={item.text} />
					</div>
				{/each}
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if visibleSection('mission')}
		<details id="admin-about-mission" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Misiune</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<form method="POST" action={`${base}?/updateSection`} use:enhance={() => async ({ result: r }) => { const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p); if (r.type === 'success' && r.data) { result = r.data as ActionData; await invalidateAll(); } }} class="mt-4 space-y-4">
				<input type="hidden" name="page" value="about" /><input type="hidden" name="section" value="mission" /><input type="hidden" name="locale" value="ro" /><input type="hidden" name="payload" value={JSON.stringify(aboutMission)} />
				<Label>Titlu</Label><Input class="rounded-none" bind:value={aboutMission.title} />
				<Label>Bullet 1</Label><Textarea class="rounded-none" rows={2} bind:value={aboutMission.bullet1} />
				<Label>Bullet 2</Label><Textarea class="rounded-none" rows={2} bind:value={aboutMission.bullet2} />
				<Label>Bullet 3</Label><Textarea class="rounded-none" rows={2} bind:value={aboutMission.bullet3} />
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if visibleSection('integrated')}
		<details id="admin-about-integrated" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Integrat</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<form method="POST" action={`${base}?/updateSection`} use:enhance={() => async ({ result: r }) => { const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p); if (r.type === 'success' && r.data) { result = r.data as ActionData; await invalidateAll(); } }} class="mt-4 space-y-4">
				<input type="hidden" name="page" value="about" /><input type="hidden" name="section" value="integrated" /><input type="hidden" name="locale" value="ro" /><input type="hidden" name="payload" value={JSON.stringify(aboutIntegrated)} />
				<Label>Titlu</Label><Input class="rounded-none" bind:value={aboutIntegrated.title} />
				<Label>Intro</Label><Textarea class="rounded-none" rows={2} bind:value={aboutIntegrated.intro} />
				{#each aboutIntegrated.items as _, i}
					<Label>Item {i + 1}</Label><Input class="rounded-none" bind:value={aboutIntegrated.items[i]} />
				{/each}
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if visibleSection('transdisciplinary')}
		<details id="admin-about-transdisciplinary" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Transdisciplinar</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<form method="POST" action={`${base}?/updateSection`} use:enhance={() => async ({ result: r }) => { const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p); if (r.type === 'success' && r.data) { result = r.data as ActionData; await invalidateAll(); } }} class="mt-4 space-y-4">
				<input type="hidden" name="page" value="about" /><input type="hidden" name="section" value="transdisciplinary" /><input type="hidden" name="locale" value="ro" /><input type="hidden" name="payload" value={JSON.stringify(aboutTrans)} />
				<Label>Titlu</Label><Input class="rounded-none" bind:value={aboutTrans.title} />
				<Label>Text</Label><Textarea class="rounded-none" rows={3} bind:value={aboutTrans.body} />
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if visibleSection('skills')}
		<details id="admin-about-skills" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Competențe</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<form method="POST" action={`${base}?/updateSection`} use:enhance={() => async ({ result: r }) => { const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p); if (r.type === 'success' && r.data) { result = r.data as ActionData; await invalidateAll(); } }} class="mt-4 space-y-4">
				<input type="hidden" name="page" value="about" /><input type="hidden" name="section" value="skills" /><input type="hidden" name="locale" value="ro" /><input type="hidden" name="payload" value={JSON.stringify(aboutSkills)} />
				<Label>Intro</Label><Textarea class="rounded-none" rows={2} bind:value={aboutSkills.intro} />
				{#each aboutSkills.skills as _, i}
					<Label>Competență {i + 1}</Label><Input class="rounded-none" bind:value={aboutSkills.skills[i]} />
				{/each}
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if visibleSection('founders')}
		<details id="admin-about-founders" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Fondatori</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<form method="POST" action={`${base}?/updateSection`} use:enhance={() => async ({ result: r }) => { const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p); if (r.type === 'success' && r.data) { result = r.data as ActionData; await invalidateAll(); } }} class="mt-4 space-y-4">
				<input type="hidden" name="page" value="about" /><input type="hidden" name="section" value="founders" /><input type="hidden" name="locale" value="ro" /><input type="hidden" name="payload" value={JSON.stringify(aboutFounders)} />
				<Label>Titlu</Label><Input class="rounded-none" bind:value={aboutFounders.title} />
				<Label>Intro</Label><Textarea class="rounded-none" rows={3} bind:value={aboutFounders.intro} />
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if visibleSection('age_cards')}
		<details id="admin-about-age-cards" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Carduri vârstă</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<form method="POST" action={`${base}?/updateSection`} use:enhance={() => async ({ result: r }) => { const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p); if (r.type === 'success' && r.data) { result = r.data as ActionData; await invalidateAll(); } }} class="mt-4 space-y-4">
				<input type="hidden" name="page" value="about" /><input type="hidden" name="section" value="age_cards" /><input type="hidden" name="locale" value="ro" /><input type="hidden" name="payload" value={JSON.stringify(aboutAgeCards)} />
				<Label>Titlu</Label><Input class="rounded-none" bind:value={aboutAgeCards.title} />
				<Label>Intro</Label><Textarea class="rounded-none" rows={2} bind:value={aboutAgeCards.intro} />
				{#each aboutAgeCards.cards as card, i}
					<div class="space-y-2 rounded border border-border/60 p-3">
						<Label>Card {i + 1} – Titlu</Label><Input class="rounded-none" bind:value={card.title} />
						<Label>Card {i + 1} – Vârstă</Label><Input class="rounded-none" bind:value={card.age} />
						<Label>Imagine card</Label>
						<MediaPicker bind:value={card.image} label="Alege imagine din Media" />
						<Label>Card {i + 1} – Text buton</Label><Input class="rounded-none" bind:value={card.ctaLabel} />
						<Label>Card {i + 1} – Link buton</Label><Input class="rounded-none" bind:value={card.ctaLink} />
					</div>
				{/each}
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if visibleSection('cta_section')}
		<details id="admin-about-cta" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">CTA (programe + mentori)</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<form method="POST" action={`${base}?/updateSection`} use:enhance={() => async ({ result: r }) => { const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p); if (r.type === 'success' && r.data) { result = r.data as ActionData; await invalidateAll(); } }} class="mt-4 space-y-4">
				<input type="hidden" name="page" value="about" /><input type="hidden" name="section" value="cta_section" /><input type="hidden" name="locale" value="ro" /><input type="hidden" name="payload" value={JSON.stringify(aboutCta)} />
				<Label>Titlu programe</Label><Input class="rounded-none" bind:value={aboutCta.programsTitle} />
				<Label>Intro programe</Label><Textarea class="rounded-none" rows={2} bind:value={aboutCta.programsIntro} />
				<Label>Titlu mentori</Label><Input class="rounded-none" bind:value={aboutCta.mentorsTitle} />
				<Label>Text mentori</Label><Textarea class="rounded-none" rows={2} bind:value={aboutCta.mentorsLead} />
				<Label>Conectare</Label><Input class="rounded-none" bind:value={aboutCta.connect} />
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{/if}

	{#if data.pageKey === 'programs'}
		<nav class="mt-4 flex flex-wrap gap-2 rounded-none border border-border/60 bg-muted/20 px-3 py-2" aria-label="Secțiuni pagină">
			<a href="#admin-programs-hero" class="text-sm text-muted-foreground underline hover:text-foreground">Hero</a>
			<a href="#admin-programs-list" class="text-sm text-muted-foreground underline hover:text-foreground">Lista programe</a>
		</nav>
	{#if visibleSection('hero')}
		<details id="admin-programs-hero" class="group mt-8 scroll-mt-4 rounded-none border border-border bg-card" open>
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Hero (titlu + intro)</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Titlul și intro-ul din partea de sus a paginii Programe.</p>
			<form method="POST" action={`${base}?/updateSection`} use:enhance={() => async ({ result: r }) => { const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p); if (r.type === 'success' && r.data) { result = r.data as ActionData; await invalidateAll(); } }} class="mt-4 space-y-4">
				<input type="hidden" name="page" value="programs" /><input type="hidden" name="section" value="hero" /><input type="hidden" name="locale" value="ro" /><input type="hidden" name="payload" value={JSON.stringify(programsHero)} />
				<Label>Titlu secțiune</Label><Input class="rounded-none" bind:value={programsHero.title} />
				<Label>Introducere</Label><Textarea class="rounded-none" rows={3} bind:value={programsHero.intro} />
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
		<div id="admin-programs-list" class="mt-8 scroll-mt-4">
			<h3 class="font-medium text-foreground">Programe</h3>
			<p class="mt-1 text-sm text-muted-foreground">Editează titlul, descrierea și detaliile fiecărui program.</p>
			<div class="mt-4 space-y-4">
				{#each (data.programs ?? []) as prog (prog.id)}
					<div class="rounded-none border border-border bg-card overflow-hidden">
						{#if editingProgramId === prog.id}
							<div class="p-6">
								<h4 class="font-medium text-foreground">Editează: {prog.title}</h4>
								<form
									class="mt-4 grid gap-4 sm:grid-cols-2"
									onsubmit={async (e) => {
										e.preventDefault();
										const form = e.currentTarget;
										const payload = {
											slug: (form.querySelector('[name="slug"]') as HTMLInputElement)?.value ?? prog.slug,
											image: (form.querySelector('[name="image"]') as HTMLInputElement)?.value || null,
											locales: {
												ro: {
													title: (form.querySelector('[name="title"]') as HTMLInputElement)?.value ?? prog.title,
													subtitle: (form.querySelector('[name="subtitle"]') as HTMLInputElement)?.value || null,
													description: (form.querySelector('[name="description"]') as HTMLTextAreaElement)?.value || null,
													ageRange: (form.querySelector('[name="ageRange"]') as HTMLInputElement)?.value || null,
													datesText: (form.querySelector('[name="datesText"]') as HTMLInputElement)?.value || null,
													durationText: (form.querySelector('[name="durationText"]') as HTMLInputElement)?.value || null,
													locationText: (form.querySelector('[name="locationText"]') as HTMLInputElement)?.value || null
												}
											}
										};
										const res = await fetch('../../api/cms', {
											method: 'PATCH',
											headers: { 'Content-Type': 'application/json' },
											body: JSON.stringify({ type: 'program', id: prog.id, payload })
										});
										if (res.ok) {
											result = { success: true };
											toastFromAction({ success: true });
											editingProgramId = null;
											await invalidateAll();
										} else {
											const j = await res.json().catch(() => ({}));
											const err = (j as { error?: string }).error ?? 'Eroare la salvare';
											result = { error: err };
											toastFromAction({ error: err });
										}
									}}
								>
									<div class="space-y-2 sm:col-span-2">
										<Label for="slug-{prog.id}">Slug (porțiunea din URL)</Label>
										<Input id="slug-{prog.id}" name="slug" class="rounded-none" value={prog.slug} />
									</div>
									<div class="space-y-2 sm:col-span-2">
										<Label for="title-{prog.id}">Titlu</Label>
										<Input id="title-{prog.id}" name="title" class="rounded-none" value={prog.title} />
									</div>
									<div class="space-y-2 sm:col-span-2">
										<Label for="subtitle-{prog.id}">Subtitlu</Label>
										<Input id="subtitle-{prog.id}" name="subtitle" class="rounded-none" value={prog.subtitle ?? ''} />
									</div>
									<div class="space-y-2 sm:col-span-2">
										<Label for="description-{prog.id}">Descriere</Label>
										<Textarea id="description-{prog.id}" name="description" class="rounded-none" rows={4} value={prog.description ?? ''} />
									</div>
									<div class="space-y-2">
										<Label for="ageRange-{prog.id}">Vârstă</Label>
										<Input id="ageRange-{prog.id}" name="ageRange" class="rounded-none" value={prog.ageRange ?? ''} />
									</div>
									<div class="space-y-2">
										<Label for="datesText-{prog.id}">Text perioadă (ex: Toamna 2024)</Label>
										<Input id="datesText-{prog.id}" name="datesText" class="rounded-none" value={prog.datesText ?? ''} />
									</div>
									<div class="space-y-2">
										<Label for="durationText-{prog.id}">Text durată (ex: 10 săptămâni)</Label>
										<Input id="durationText-{prog.id}" name="durationText" class="rounded-none" value={prog.durationText ?? ''} />
									</div>
									<div class="space-y-2">
										<Label for="locationText-{prog.id}">Text locație (ex: Sediu central)</Label>
										<Input id="locationText-{prog.id}" name="locationText" class="rounded-none" value={prog.locationText ?? ''} />
									</div>
									<div class="space-y-2 sm:col-span-2">
										<Label>Imagine program</Label>
										<input type="hidden" name="image" value={programImageUrl} />
										<MediaPicker bind:value={programImageUrl} label="Alege imagine din Media" />
									</div>
									<div class="flex gap-2 sm:col-span-2">
										<Button type="submit" class="rounded-none">Salvează</Button>
										<Button type="button" variant="outline" class="rounded-none" onclick={() => (editingProgramId = null)}>Anulare</Button>
									</div>
								</form>
							</div>
						{:else}
							<div class="flex flex-wrap items-center justify-between gap-4 p-4">
								<div class="flex min-w-0 items-center gap-4">
									{#if prog.image}
										<img src={prog.image} alt="" class="h-14 w-24 rounded-none object-cover" />
									{:else}
										<div class="flex h-14 w-24 items-center justify-center rounded-none bg-muted text-muted-foreground text-xs">Fără imagine</div>
									{/if}
									<div class="min-w-0">
										<p class="font-medium text-foreground truncate">{prog.title}</p>
										<p class="text-sm text-muted-foreground">{prog.slug} · {prog.ageRange ?? '—'}</p>
									</div>
								</div>
								<div class="flex shrink-0 gap-2">
									<Button href="/admin/programs/{prog.id}" variant="outline" class="rounded-none">Editează în pagină</Button>
									<Button type="button" variant="outline" class="rounded-none" onclick={() => (editingProgramId = prog.id)}>Editează rapid</Button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if data.pageKey === 'mentors'}
		<nav class="mt-4 flex flex-wrap gap-2 rounded-none border border-border/60 bg-muted/20 px-3 py-2" aria-label="Secțiuni pagină">
			<a href="#admin-mentors-hero" class="text-sm text-muted-foreground underline hover:text-foreground">Hero</a>
			<a href="#admin-mentors-cta" class="text-sm text-muted-foreground underline hover:text-foreground">CTA</a>
		</nav>
	{#if visibleSection('hero')}
		<details id="admin-mentors-hero" class="group mt-8 scroll-mt-4 rounded-none border border-border bg-card" open>
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Hero</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<form method="POST" action={`${base}?/updateSection`} use:enhance={() => async ({ result: r }) => { const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p); if (r.type === 'success' && r.data) { result = r.data as ActionData; await invalidateAll(); } }} class="mt-4 space-y-4">
				<input type="hidden" name="page" value="mentors" /><input type="hidden" name="section" value="hero" /><input type="hidden" name="locale" value="ro" /><input type="hidden" name="payload" value={JSON.stringify(mentorsHero)} />
				<Label>Titlu secțiune</Label><Input class="rounded-none" bind:value={mentorsHero.title} />
				<Label>Introducere</Label><Textarea class="rounded-none" rows={3} bind:value={mentorsHero.intro} />
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{#if visibleSection('cta')}
		<details id="admin-mentors-cta" class="group mt-6 scroll-mt-4 rounded-none border border-border bg-card">
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">CTA</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<form method="POST" action={`${base}?/updateSection`} use:enhance={() => async ({ result: r }) => { const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p); if (r.type === 'success' && r.data) { result = r.data as ActionData; await invalidateAll(); } }} class="mt-4 space-y-4">
				<input type="hidden" name="page" value="mentors" /><input type="hidden" name="section" value="cta" /><input type="hidden" name="locale" value="ro" /><input type="hidden" name="payload" value={JSON.stringify(mentorsCta)} />
				<Label>Titlu secțiune</Label><Input class="rounded-none" bind:value={mentorsCta.title} />
				<Label>Text</Label><Textarea class="rounded-none" rows={3} bind:value={mentorsCta.body} />
				<Label>Text buton</Label><Input class="rounded-none" bind:value={mentorsCta.buttonLabel} />
				<Button type="submit" class="rounded-none">Salvează</Button>
			</form>
			</div>
		</details>
	{/if}
	{/if}

	{#if data.pageKey === 'contact'}
		<nav class="mt-4 flex flex-wrap gap-2 rounded-none border border-border/60 bg-muted/20 px-3 py-2" aria-label="Secțiuni pagină">
			<a href="#admin-contact-hero" class="text-sm text-muted-foreground underline hover:text-foreground">Hero + rețele</a>
		</nav>
	{#if visibleSection('hero')}
		<details id="admin-contact-hero" class="group mt-8 scroll-mt-4 rounded-none border border-border bg-card" open>
			<summary class="cursor-pointer list-none px-6 py-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">Hero și rețele sociale</summary>
			<div class="border-t border-border px-6 pb-6 pt-4">
			<p class="mb-4 text-sm text-muted-foreground">Titlul și intro-ul din hero; URL-urile rețelelor sociale (apar în hero și în footer).</p>
			<form method="POST" action={`${base}?/updateSection`} use:enhance={() => async ({ result: r }) => { const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p); if (r.type === 'success' && r.data) { result = r.data as ActionData; await invalidateAll(); } }} class="mt-4 space-y-4">
				<input type="hidden" name="page" value="contact" /><input type="hidden" name="section" value="hero" /><input type="hidden" name="locale" value="ro" /><input type="hidden" name="payload" value={JSON.stringify(contactHero)} />
				<Label>Titlu secțiune</Label><Input class="rounded-none" bind:value={contactHero.title} />
				<Label>Introducere</Label><Textarea class="rounded-none" rows={3} bind:value={contactHero.intro} />
				<Button type="submit" class="rounded-none">Salvează titlu și intro</Button>
			</form>
			<div class="mt-6 border-t border-border pt-6">
				<h4 class="text-sm font-semibold text-foreground">URL-uri rețele (Instagram, Facebook, etc.)</h4>
				<p class="mt-1 text-xs text-muted-foreground">URL-urile apar în hero pe pagina Contact și în footer.</p>
				<form method="POST" action={`${base}?/updateContactSocials`} use:enhance={() => async ({ result: r }) => { const _p = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null; if (_p) toastFromAction(_p); if (r.type === 'success' && r.data) { result = r.data as ActionData; await invalidateAll(); } }} class="mt-4 space-y-4">
					<input type="hidden" name="locale" value="ro" />
					<div class="grid gap-3 sm:grid-cols-2">
						{#each SOCIAL_NETWORKS as { key, label }}
							<div class="space-y-1">
								<Label for={'contact-social-' + key} class="text-xs">{label}</Label>
								<Input
									id={'contact-social-' + key}
									name={'social_' + key}
									type="url"
									class="rounded-none"
									placeholder={'https://' + key + '.com/...'}
									bind:value={contactSocials[key]}
								/>
							</div>
						{/each}
					</div>
					<Button type="submit" class="rounded-none">Salvează rețele sociale</Button>
				</form>
			</div>
			</div>
		</details>
	{/if}
	{/if}
</div>
