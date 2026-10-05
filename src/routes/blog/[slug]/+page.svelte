<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { contentHref } from '$lib/content-routes';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';

	type PostNeighbour = {
		id: number;
		slug: string;
		title: string;
		excerpt: string | null;
		featuredImage: string | null;
		publishedAt: Date | null;
	};

	let {
		data
	}: {
		data: {
			post: {
				id: number;
				slug: string;
				title: string;
				body: string;
				excerpt: string | null;
				featuredImage: string | null;
				publishedAt: Date | null;
			};
			prevPost: PostNeighbour | null;
			nextPost: PostNeighbour | null;
			canonicalUrl?: string;
			baseUrl?: string;
		};
	} = $props();

	const DATE_FORMAT_RO = { day: 'numeric', month: 'long', year: 'numeric' } as const;
	const DEFAULT_OG_IMAGE = '/media/uploads/home/hero-poster.webp';
	const WORDS_PER_MINUTE = 200;

	const post = $derived(data.post);
	const metaDescription = $derived(post.excerpt?.slice(0, 160) ?? post.title);
	const canonical = $derived(data.canonicalUrl ?? '');

	function absoluteUrl(path: string | null, baseUrl: string): string {
		if (!path) return `${baseUrl}${DEFAULT_OG_IMAGE}`;
		if (/^https?:\/\//i.test(path)) return path;
		return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
	}

	const ogImageUrl = $derived(
		absoluteUrl(post.featuredImage, data.baseUrl ?? 'https://kogaionacademy.ro')
	);

	function toDate(value: Date | string | null | undefined): Date | null {
		if (!value) return null;
		const date = value instanceof Date ? value : new Date(value);
		return Number.isNaN(date.getTime()) ? null : date;
	}

	function formatDate(value: Date | string | null | undefined): string {
		const date = toDate(value);
		return date ? date.toLocaleDateString('ro-RO', DATE_FORMAT_RO) : '';
	}

	function machineDate(value: Date | string | null | undefined): string {
		return toDate(value)?.toISOString() ?? '';
	}

	/**
	 * Timp de citit derivat din conținutul real al articolului (nu un câmp
	 * invizibil în DB): textul din HTML e redus la cuvinte, apoi împărțit la
	 * ~200 cuvinte/minută.
	 */
	const readingMinutes = $derived.by(() => {
		const words = post.body
			.replace(/<[^>]*>/g, ' ')
			.replace(/&\w+;/g, ' ')
			.split(/\s+/)
			.filter(Boolean).length;
		return words > 0 ? Math.max(1, Math.round(words / WORDS_PER_MINUTE)) : 0;
	});

	/** „1 minut de citit", „7 minute de citit", „20 de minute de citit". */
	function readingTimeLabel(minutes: number): string {
		if (minutes === 1) return '1 minut de citit';
		return `${minutes} ${minutes >= 20 ? 'de minute' : 'minute'} de citit`;
	}

	function postHref(slug: string): string {
		return `${contentHref('blog')}/${encodeURIComponent(slug)}`;
	}
</script>

<svelte:head>
	<title>{post.title} | Kogaion Gifted Academy</title>
	<meta name="description" content={metaDescription} />
	{#if canonical}
		<link rel="canonical" href={canonical} />
		<meta property="og:url" content={canonical} />
	{/if}
	<meta property="og:type" content="article" />
	<meta property="og:title" content={post.title} />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:locale" content="ro_RO" />
</svelte:head>

<main class="min-h-dvh bg-white">
	<!--
		Masthead: imaginea reprezentativă devine fundal, cu aceeași mască de
		gradient ca homepage / detaliu program, peste care stă titlul, standfirst-ul
		și data. Fără imagine, masthead-ul rămâne gradientul navy.
	-->
	<header
		class="relative isolate min-h-[52vh] overflow-hidden rounded-br-[5.6rem] border-b-2 border-white/20 bg-[#0c3044] md:min-h-[56vh] md:rounded-br-[7rem]"
	>
		{#if post.featuredImage}
			<div
				data-cms-type="blog"
				data-cms-id={post.id}
				data-cms-field="featuredImage"
				class="absolute inset-0"
			>
				<img
					src={post.featuredImage}
					alt=""
					class="size-full object-cover object-center"
					loading="eager"
					fetchpriority="high"
				/>
			</div>
		{/if}
		<div
			class="absolute inset-0 bg-gradient-to-b from-[#154b6a]/88 via-[#154b6a]/62 to-[#091328]/88"
		></div>
		<div
			class="pointer-events-none absolute -right-24 -bottom-24 size-[28rem] rounded-full bg-[#c25067]/18 blur-3xl"
			aria-hidden="true"
		></div>

		<div
			class="relative mx-auto flex min-h-[52vh] max-w-6xl flex-col justify-end px-6 pt-[calc(var(--admin-bar-height,0px)+var(--nav-height,5rem)+var(--below-nav-gap,0px))] pb-12 md:min-h-[56vh] md:px-10 md:pt-[calc(var(--admin-bar-height,0px)+7rem+var(--below-nav-gap,0px))] md:pb-16 lg:px-16"
		>
			<a
				href={contentHref('blog')}
				class="btn-diagonal inline-flex min-h-11 w-fit max-w-full items-center justify-center gap-2 border border-white/75 bg-transparent px-5 py-2.5 text-center [font-family:var(--font-sans)] text-[0.82rem] font-semibold tracking-normal text-white normal-case transition-colors hover:border-white hover:bg-white hover:text-[var(--brand-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
			>
				<ArrowLeft class="size-4 shrink-0" aria-hidden="true" />
				{m.menu_link_blog()}
			</a>

			<p
				class="mt-9 [font-family:var(--font-sans)] text-xs font-semibold tracking-[0.22em] text-white/85 uppercase"
			>
				Articol
			</p>
			<h1
				data-cms-type="blog"
				data-cms-id={post.id}
				data-cms-field="title"
				class="mt-4 max-w-4xl [font-family:var(--font-spectral)] text-[2rem] leading-[1.1] font-medium tracking-[-0.02em] text-white md:text-[2.6rem] lg:text-[3rem] xl:text-[3.2rem]"
			>
				{post.title}
			</h1>

			{#if post.excerpt}
				<p
					data-cms-type="blog"
					data-cms-id={post.id}
					data-cms-field="excerpt"
					class="mt-6 max-w-[62ch] [font-family:var(--font-sans)] text-base leading-relaxed text-white/92 md:text-[1.15rem]"
				>
					{post.excerpt}
				</p>
			{/if}

			<div
				class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 [font-family:var(--font-sans)] text-sm text-white/85"
			>
				{#if post.publishedAt}
					<time datetime={machineDate(post.publishedAt)} class="inline-flex items-center gap-2">
						<Calendar class="size-4 shrink-0 text-[var(--brand-green)]" aria-hidden="true" />
						<span>{formatDate(post.publishedAt)}</span>
					</time>
				{/if}
				{#if readingMinutes > 0}
					<span class="inline-flex items-center gap-2">
						<Clock class="size-4 shrink-0 text-[var(--brand-green)]" aria-hidden="true" />
						<span>{readingTimeLabel(readingMinutes)}</span>
					</span>
				{/if}
			</div>
		</div>
	</header>

	<section class="relative bg-white px-6 py-12 md:py-16 lg:px-10 xl:px-16">
		<div class="mx-auto max-w-6xl">
			<div
				class="grid gap-10 lg:grid-cols-[minmax(0,41rem)_minmax(0,17rem)] lg:items-start lg:justify-center lg:gap-14 xl:gap-20"
			>
				<article class="min-w-0">
					<div
						class="article-body blog-prose max-w-[39rem] text-foreground md:max-w-[40rem]"
						data-cms-type="blog"
						data-cms-id={post.id}
						data-cms-field="body"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html post.body}
					</div>
				</article>

				<aside class="h-fit space-y-5 lg:sticky lg:top-28">
					<div
						class="media-diagonal border border-[#d9e6f7] bg-white p-6 shadow-[0_16px_40px_-22px_rgba(21,75,106,0.22)] md:p-7"
					>
						<p
							class="[font-family:var(--font-sans)] text-xs font-semibold tracking-[0.2em] text-primary uppercase"
						>
							Journal
						</p>
						<p
							class="mt-4 [font-family:var(--font-spectral)] text-[1.2rem] leading-snug font-medium text-[#0c3044]"
						>
							Toate articolele Kogaion, adunate într-un singur loc.
						</p>
						<a
							href={contentHref('blog')}
							class="btn-diagonal mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[var(--brand-blue)] bg-[var(--brand-blue)] px-5 py-2.5 text-center [font-family:var(--font-sans)] text-[0.85rem] font-semibold text-white transition-colors hover:border-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
						>
							Vezi toate articolele
							<ArrowRight class="size-4 shrink-0" aria-hidden="true" />
						</a>
					</div>

					<div class="media-diagonal-reverse border border-[#d9e6f7] bg-[#f7fbff] p-6 md:p-7">
						<p
							class="[font-family:var(--font-sans)] text-xs font-semibold tracking-[0.2em] text-[#0c3044]/75 uppercase"
						>
							Continuă discuția
						</p>
						<p
							class="mt-3 [font-family:var(--font-sans)] text-[0.95rem] leading-relaxed text-muted-foreground"
						>
							Programele și mentoratul nostru rămân aici, la un click distanță.
						</p>
						<a
							href={contentHref('programs')}
							class="btn-diagonal mt-5 inline-flex min-h-11 w-full items-center justify-center border border-[var(--brand-blue)] bg-transparent px-5 py-2.5 text-center [font-family:var(--font-sans)] text-[0.85rem] font-semibold text-[var(--brand-blue)] transition-colors hover:border-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
						>
							{m.nav_programs()}
						</a>
					</div>
				</aside>
			</div>
		</div>
	</section>

	<!-- Articol anterior / următor: date reale din loader, nu o interogare fictivă. -->
	{#if data.prevPost || data.nextPost}
		<section class="relative border-t border-border bg-[#fcfeff] px-6 py-14 md:py-20">
			<div class="mx-auto max-w-6xl">
				<p
					class="text-center [font-family:var(--font-sans)] text-xs font-semibold tracking-[0.2em] text-primary uppercase"
				>
					Mai mult din jurnal
				</p>
				<nav class="mt-8 grid gap-5 md:grid-cols-2" aria-label="Navigare între articole">
					{#if data.prevPost}
						<a
							href={postHref(data.prevPost.slug)}
							class="media-diagonal group flex flex-col items-start gap-3 border border-[#dfeaf8] bg-white p-6 shadow-[0_12px_30px_-24px_rgba(21,75,106,0.24)] transition-[border-color,box-shadow,transform] duration-300 hover:border-[#c3d6ec] hover:shadow-[0_20px_45px_-26px_rgba(21,75,106,0.34)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] md:p-7"
						>
							<span
								class="inline-flex items-center gap-2 [font-family:var(--font-sans)] text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase"
							>
								<ArrowLeft class="size-4 shrink-0" aria-hidden="true" />
								Articolul anterior
							</span>
							<span
								class="[font-family:var(--font-spectral)] text-[1.25rem] leading-snug font-semibold text-[#0c3044] transition-colors group-hover:text-[var(--brand-blue)] md:text-[1.4rem]"
							>
								{data.prevPost.title}
							</span>
						</a>
					{/if}
					{#if data.nextPost}
						<a
							href={postHref(data.nextPost.slug)}
							class="media-diagonal-reverse group flex flex-col items-end gap-3 border border-[#dfeaf8] bg-white p-6 text-right shadow-[0_12px_30px_-24px_rgba(21,75,106,0.24)] transition-[border-color,box-shadow,transform] duration-300 hover:border-[#c3d6ec] hover:shadow-[0_20px_45px_-26px_rgba(21,75,106,0.34)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] md:p-7"
						>
							<span
								class="inline-flex items-center gap-2 [font-family:var(--font-sans)] text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase"
							>
								Articolul următor
								<ArrowRight class="size-4 shrink-0" aria-hidden="true" />
							</span>
							<span
								class="[font-family:var(--font-spectral)] text-[1.25rem] leading-snug font-semibold text-[#0c3044] transition-colors group-hover:text-[var(--brand-blue)] md:text-[1.4rem]"
							>
								{data.nextPost.title}
							</span>
						</a>
					{/if}
				</nav>
			</div>
		</section>
	{/if}

	<section class="relative bg-white px-0 py-14 md:py-20">
		<div
			class="w-full overflow-hidden rounded-tl-[5.6rem] rounded-br-[5.6rem] bg-[#245f4e] text-white md:rounded-tl-[7rem] md:rounded-br-[7rem]"
		>
			<div class="mx-auto w-full max-w-[1600px] px-6 py-12 text-center md:px-10 md:py-14">
				<p class="[font-family:var(--font-sans)] text-xs tracking-[0.2em] text-white/85 uppercase">
					Jurnalul Kogaion
				</p>
				<h2
					class="mx-auto mt-4 max-w-[46rem] [font-family:var(--font-spectral)] text-[1.45rem] leading-tight font-medium text-white md:text-[2rem]"
				>
					{m.menu_link_blog()}
				</h2>
				<p
					class="mx-auto mt-4 max-w-2xl [font-family:var(--font-sans)] text-sm leading-relaxed text-white/85 md:text-base"
				>
					{m.blog_hero_intro()}
				</p>
				<div class="mt-8 flex flex-wrap justify-center gap-4">
					<a
						href={contentHref('blog')}
						class="btn-diagonal inline-flex min-h-12 items-center justify-center gap-2 border border-white bg-white px-6 py-3 text-center [font-family:var(--font-sans)] text-[0.9rem] font-semibold tracking-normal text-[var(--brand-blue)] normal-case transition-colors hover:bg-transparent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:text-[0.96rem]"
					>
						Vezi toate articolele
						<ArrowRight class="size-4 shrink-0" aria-hidden="true" />
					</a>
					<a
						href={contentHref('contact')}
						class="btn-diagonal inline-flex min-h-12 items-center justify-center border border-white bg-transparent px-6 py-3 text-center [font-family:var(--font-sans)] text-[0.9rem] font-semibold tracking-normal text-white normal-case transition-colors hover:bg-white hover:text-[var(--brand-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:text-[0.96rem]"
					>
						Contactează-ne
					</a>
				</div>
			</div>
		</div>
	</section>
</main>

<style>
	/*
		`.blog-prose` este definită în `layout.css` (fișier care nu îmi aparține),
		în afara oricărui cascade layer — deci orice utilitar Tailwind pe
		descendenți ar fi învins de el. De aceea rafinăm aspectul cu reguli
		`:global()` ancorate pe clasa unică `.article-body`, care au
		specificitate mai mare. Parserul rămâne neatinis ({@html}).
	*/
	:global(.article-body.blog-prose) {
		font-family: var(--font-sans);
		font-size: 1.125rem;
		line-height: 1.85;
	}

	/* Primul paragraf devine intrarea în articol (lead paragraph). */
	:global(.article-body.blog-prose > p:first-of-type) {
		font-size: 1.22rem;
		line-height: 1.75;
		color: #0c3044;
	}

	:global(.article-body.blog-prose p) {
		color: rgb(12 48 68 / 0.88);
	}

	:global(.article-body.blog-prose h2) {
		font-family: var(--font-spectral);
		font-size: 1.7rem;
		font-weight: 500;
		line-height: 1.2;
		letter-spacing: -0.01em;
		margin-top: 2.6em;
		margin-bottom: 0.65em;
		color: #0c3044;
	}

	:global(.article-body.blog-prose h3) {
		font-family: var(--font-spectral);
		font-size: 1.3rem;
		font-weight: 500;
		line-height: 1.3;
		margin-top: 2em;
		margin-bottom: 0.55em;
		color: #0c3044;
	}

	:global(.article-body.blog-prose h4) {
		font-family: var(--font-sans);
		font-size: 1.08rem;
		font-weight: 700;
		margin-top: 1.7em;
		margin-bottom: 0.5em;
		color: #0c3044;
	}

	:global(.article-body.blog-prose ul),
	:global(.article-body.blog-prose ol) {
		margin-top: 1.1em;
		margin-bottom: 1.1em;
		padding-left: 1.4em;
	}

	:global(.article-body.blog-prose ul) {
		list-style-type: disc;
	}

	:global(.article-body.blog-prose ol) {
		list-style-type: decimal;
	}

	:global(.article-body.blog-prose li) {
		margin-top: 0.4em;
		padding-left: 0.25em;
		color: rgb(12 48 68 / 0.88);
	}

	:global(.article-body.blog-prose li)::marker {
		color: var(--brand-blue);
	}

	/* Citat: panou de accent, nu un rând italic subțire. */
	:global(.article-body.blog-prose blockquote) {
		margin: 1.8em 0;
		padding: 1.25em 1.4em;
		border-left: 3px solid var(--brand-blue);
		background: #f7fbff;
		font-style: normal;
		font-size: 1.08rem;
		line-height: 1.75;
		color: rgb(12 48 68 / 0.85);
	}

	:global(.article-body.blog-prose blockquote p) {
		color: inherit;
	}

	:global(.article-body.blog-prose a) {
		color: var(--brand-blue);
		text-decoration: underline;
		text-decoration-color: rgb(21 75 106 / 0.35);
		text-underline-offset: 3px;
		transition: text-decoration-color 0.2s ease;
	}

	:global(.article-body.blog-prose a:hover) {
		text-decoration-color: var(--brand-blue-hover);
	}

	:global(.article-body.blog-prose a:focus-visible) {
		outline: 2px solid var(--brand-blue);
		outline-offset: 3px;
		border-radius: 2px;
	}

	:global(.article-body.blog-prose strong) {
		font-weight: 700;
		color: #0c3044;
	}

	:global(.article-body.blog-prose img) {
		display: block;
		width: 100%;
		height: auto;
		margin: 1.9em 0;
		border-top-left-radius: 1.5rem;
		border-bottom-right-radius: 1.5rem;
		box-shadow: 0 22px 46px -32px rgb(12 48 68 / 0.45);
	}

	:global(.article-body.blog-prose figure) {
		margin: 1.9em 0;
	}

	:global(.article-body.blog-prose figcaption) {
		margin-top: 0.75em;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		color: var(--muted-foreground);
	}

	:global(.article-body.blog-prose code) {
		background: #eef4fb;
		color: #0c3044;
		font-size: 0.86em;
		padding: 0.15em 0.35em;
		border-radius: 0.35rem;
	}

	:global(.article-body.blog-prose pre) {
		margin: 1.6em 0;
		padding: 1.25em;
		overflow-x: auto;
		background: #0c3044;
		color: rgb(255 255 255 / 0.9);
		border-top-left-radius: 1rem;
		border-bottom-right-radius: 1rem;
		font-size: 0.9rem;
		line-height: 1.7;
	}

	:global(.article-body.blog-prose pre code) {
		background: transparent;
		color: inherit;
		padding: 0;
		font-size: inherit;
	}

	:global(.article-body.blog-prose hr) {
		margin: 2.4em 0;
		border: 0;
		border-top: 1px solid #dfeaf8;
	}

	:global(.article-body.blog-prose table) {
		width: 100%;
		margin: 1.6em 0;
		border-collapse: collapse;
		font-size: 0.95rem;
	}

	:global(.article-body.blog-prose th),
	:global(.article-body.blog-prose td) {
		border: 1px solid #dfeaf8;
		padding: 0.6em 0.8em;
		text-align: left;
		vertical-align: top;
	}

	:global(.article-body.blog-prose th) {
		background: #f5fafd;
		font-weight: 700;
		color: #0c3044;
	}

	:global(.article-body.blog-prose > * + *) {
		margin-top: 1.35em;
	}

	/* h2/h3/hr primesc spațierea lor de mai sus. */
	:global(.article-body.blog-prose > h2) {
		margin-top: 2.6em;
	}

	:global(.article-body.blog-prose > h3) {
		margin-top: 2em;
	}

	:global(.article-body.blog-prose > hr) {
		margin-top: 2.4em;
	}
</style>
