<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { contentHref } from '$lib/content-routes';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Newspaper from '@lucide/svelte/icons/newspaper';

	type BlogPostSummary = {
		id: number;
		slug: string;
		title: string;
		excerpt: string | null;
		featuredImage: string | null;
		publishedAt: Date | null;
	};

	let { data }: { data: { posts: BlogPostSummary[] } } = $props();

	const FALLBACK_IMAGE = '/media/uploads/about/age-3-6.webp';
	const DATE_FORMAT_RO = { day: 'numeric', month: 'long', year: 'numeric' } as const;

	/**
	 * Tabelul `blog_post` nu are câmp „featured". Loaderul ordonează deja
	 * desc(publishedAt), deci articolul de deschidere este derivat din
	 * `publishedAt` (cel mai recent), fără date inventate.
	 */
	const posts = $derived(data.posts);
	const leadPost = $derived(posts[0] ?? null);
	const restPosts = $derived(posts.slice(1));

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

	function postHref(slug: string): string {
		return `${contentHref('blog')}/${encodeURIComponent(slug)}`;
	}

	/** acord românesc corect și pentru numere mari (20 de articole). */
	function articleCountLabel(count: number): string {
		if (count === 1) return '1 articol publicat';
		return `${count} ${count >= 20 ? 'de articole publicate' : 'articole publicate'}`;
	}
</script>

<svelte:head>
	<title>{m.menu_link_blog()} | Kogaion Gifted Academy</title>
	<meta name="description" content={m.blog_hero_intro()} />
</svelte:head>

<main class="min-h-dvh bg-white">
	<!--
		Hero bespoke (nu <Hero />): componenta shared este video-centrică și ar
		redirecționa editarea inline spre setările paginii „home"/„about".
		Aici păstrăm imaginea proprie a blogului, dar cu tratamentul vizual
		identic cu homepage (gradient, colț diagonal, scară tipografică).
	-->
	<header
		class="relative isolate min-h-[46vh] overflow-hidden rounded-br-[5.6rem] border-b-2 border-white/20 bg-[#0c3044] md:min-h-[50vh] md:rounded-br-[7rem]"
	>
		<img
			src="/media/uploads/blog/hero.webp"
			alt=""
			class="absolute inset-0 size-full object-cover object-center"
			fetchpriority="high"
		/>
		<div
			class="absolute inset-0 bg-gradient-to-b from-[#154b6a]/85 via-[#154b6a]/58 to-[#091328]/82"
		></div>
		<div
			class="pointer-events-none absolute -right-24 -bottom-24 size-[28rem] rounded-full bg-[#c25067]/18 blur-3xl"
			aria-hidden="true"
		></div>

		<div
			class="relative mx-auto flex min-h-[46vh] max-w-6xl flex-col items-center justify-center px-6 pt-[calc(var(--admin-bar-height,0px)+var(--nav-height,5rem)+var(--below-nav-gap,0px))] pb-12 text-center md:min-h-[50vh] md:px-12 md:pt-[calc(var(--admin-bar-height,0px)+7rem+var(--below-nav-gap,0px))] md:pb-14 lg:px-16"
		>
			<p
				class="[font-family:var(--font-sans)] text-xs font-semibold tracking-[0.22em] text-white/85 uppercase"
			>
				Jurnalul Kogaion
			</p>
			<h1
				class="mt-4 max-w-4xl [font-family:var(--font-spectral)] text-4xl leading-tight font-medium text-white md:text-5xl lg:text-6xl"
			>
				{m.menu_link_blog()}
			</h1>
			<p
				class="mt-5 max-w-3xl [font-family:var(--font-sans)] text-sm leading-relaxed text-white/90 md:text-base"
			>
				{m.blog_hero_intro()}
			</p>
			<div class="mt-8">
				<a
					href={contentHref('home')}
					class="btn-diagonal inline-flex min-h-12 w-fit items-center justify-center gap-2 border border-white bg-transparent px-6 py-3 text-center [font-family:var(--font-sans)] text-[0.9rem] font-semibold text-white transition-colors hover:border-white hover:bg-white hover:text-[var(--brand-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:text-[0.96rem]"
				>
					<ArrowLeft class="size-4 shrink-0" aria-hidden="true" />
					{m.nav_home()}
				</a>
			</div>
		</div>
	</header>

	{#if leadPost}
		<!-- Articolul de deschidere: derivat din publishedAt (cel mai recent). -->
		<section class="relative bg-white px-0 py-14 md:py-20" aria-labelledby="blog-lead-heading">
			<div
				class="w-full overflow-hidden rounded-tr-[5.6rem] rounded-bl-[5.6rem] bg-[#154b6a] text-white md:rounded-tr-[7rem] md:rounded-bl-[7rem]"
			>
				<div class="mx-auto w-full max-w-[1600px] px-6 py-12 md:px-10 md:py-14">
					<p
						class="text-center [font-family:var(--font-sans)] text-xs font-semibold tracking-[0.22em] text-white/85 uppercase"
					>
						Cel mai nou articol
					</p>
					<a
						href={postHref(leadPost.slug)}
						class="media-diagonal group mt-10 grid overflow-hidden bg-white shadow-[0_24px_60px_-30px_rgba(9,19,40,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:grid-cols-[1.05fr_0.95fr]"
					>
						<div class="relative min-h-[15rem] overflow-hidden bg-[#e8f0fa] md:min-h-[24rem]">
							<img
								src={leadPost.featuredImage ?? FALLBACK_IMAGE}
								alt={leadPost.title}
								class="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
								fetchpriority="high"
								decoding="async"
							/>
							<div
								class="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#0c3044]/25 via-transparent to-transparent"
							></div>
						</div>
						<div class="flex flex-col justify-center p-6 md:p-9 lg:p-11">
							<div
								class="flex flex-wrap items-center gap-x-4 gap-y-2 [font-family:var(--font-sans)] text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase"
							>
								{#if leadPost.publishedAt}
									<time
										datetime={machineDate(leadPost.publishedAt)}
										class="inline-flex items-center gap-2"
									>
										<span
											class="size-1.5 shrink-0 rounded-full bg-[var(--brand-blue)]"
											aria-hidden="true"
										></span>
										{formatDate(leadPost.publishedAt)}
									</time>
								{/if}
								<span class="inline-flex items-center gap-2 text-primary">
									<span class="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true"></span>
									Articol
								</span>
							</div>
							<h2
								id="blog-lead-heading"
								class="mt-4 [font-family:var(--font-spectral)] text-[1.45rem] leading-[1.14] font-medium tracking-[-0.01em] text-[#0c3044] md:text-[1.95rem] lg:text-[2.2rem]"
							>
								{leadPost.title}
							</h2>
							{#if leadPost.excerpt}
								<p
									class="mt-5 max-w-xl [font-family:var(--font-sans)] text-base leading-relaxed text-muted-foreground md:text-[1.05rem]"
								>
									{leadPost.excerpt}
								</p>
							{/if}
							<span
								class="btn-diagonal mt-8 inline-flex min-h-12 w-fit items-center justify-center gap-2 self-start border border-[var(--brand-blue)] bg-[var(--brand-blue)] px-6 py-3 text-center [font-family:var(--font-sans)] text-[0.9rem] font-semibold text-white transition-colors hover:border-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue-hover)] md:text-[0.96rem]"
							>
								Citește articolul
								<ArrowRight
									class="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
									aria-hidden="true"
								/>
							</span>
						</div>
					</a>
				</div>
			</div>
		</section>

		{#if restPosts.length > 0}
			<section
				class="relative border-b border-border bg-[#fcfeff] px-6 py-14 md:py-20"
				aria-labelledby="blog-archive-heading"
			>
				<div class="mx-auto max-w-6xl">
					<div class="mx-auto max-w-3xl text-center">
						<p
							class="[font-family:var(--font-sans)] text-xs font-semibold tracking-[0.2em] text-primary uppercase"
						>
							Arhivă
						</p>
						<h2
							id="blog-archive-heading"
							class="mt-4 [font-family:var(--font-spectral)] text-[1.45rem] leading-tight font-medium text-[#0c3044] md:text-[2rem]"
						>
							Restul articolelor
						</h2>
						<p
							class="mt-4 [font-family:var(--font-sans)] text-base leading-relaxed text-muted-foreground"
						>
							{articleCountLabel(restPosts.length)}
						</p>
					</div>

					<ul class="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
						{#each restPosts as post (post.id)}
							<li class="h-full">
								<article
									class="media-diagonal group relative flex h-full flex-col overflow-hidden border border-border bg-white shadow-[0_14px_40px_-28px_rgba(21,75,106,0.2)] transition-shadow duration-300 focus-within:shadow-[0_22px_55px_-28px_rgba(21,75,106,0.34)] hover:shadow-[0_22px_55px_-28px_rgba(21,75,106,0.34)]"
								>
									<div class="aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#e8f0fa]">
										<img
											src={post.featuredImage ?? FALLBACK_IMAGE}
											alt={post.title}
											class="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
											loading="lazy"
											decoding="async"
										/>
									</div>
									<div class="flex min-h-0 flex-1 flex-col p-5 md:p-6">
										{#if post.publishedAt}
											<time
												datetime={machineDate(post.publishedAt)}
												class="inline-flex items-center gap-2 [font-family:var(--font-sans)] text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase"
											>
												<span
													class="size-1.5 shrink-0 rounded-full bg-[var(--brand-blue)]"
													aria-hidden="true"
												></span>
												{formatDate(post.publishedAt)}
											</time>
										{/if}
										<h3
											class="mt-3 [font-family:var(--font-spectral)] text-xl leading-snug font-semibold text-[#0c3044]"
										>
											<a
												href={postHref(post.slug)}
												class="transition-colors after:absolute after:inset-0 after:content-[''] hover:text-[var(--brand-blue)] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-blue)]"
											>
												{post.title}
											</a>
										</h3>
										{#if post.excerpt}
											<p
												class="mt-4 line-clamp-3 [font-family:var(--font-sans)] text-[0.9375rem] leading-relaxed text-muted-foreground"
											>
												{post.excerpt}
											</p>
										{/if}
										<span
											class="mt-6 inline-flex items-center gap-3 [font-family:var(--font-sans)] text-[0.9rem] text-[var(--brand-blue)]"
											aria-hidden="true"
										>
											<span
												class="btn-diagonal inline-flex size-10 shrink-0 items-center justify-center border border-current bg-transparent text-current transition-colors group-hover:border-[var(--brand-blue)] group-hover:bg-[var(--brand-blue)] group-hover:text-white"
											>
												<ArrowRight
													class="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
												/>
											</span>
											<span class="normal-case">Citește articolul</span>
										</span>
									</div>
								</article>
							</li>
						{/each}
					</ul>
				</div>
			</section>
		{/if}
	{:else}
		<!-- Stare goală: panou diagonal, nu o propoziție izolată. -->
		<section class="relative bg-[#fcfeff] px-6 py-16 md:py-24" aria-labelledby="blog-empty-heading">
			<div class="mx-auto max-w-3xl">
				<div
					class="media-diagonal border border-[#dfeaf8] bg-white px-6 py-12 text-center shadow-[0_16px_44px_-26px_rgba(21,75,106,0.28)] md:px-12 md:py-16"
				>
					<div
						class="media-diagonal-soft mx-auto flex size-16 items-center justify-center border border-[#dfeaf8] bg-[#f5fafd] text-[var(--brand-blue)]"
						aria-hidden="true"
					>
						<Newspaper class="size-7" />
					</div>
					<h2
						id="blog-empty-heading"
						class="mt-7 [font-family:var(--font-spectral)] text-[1.5rem] leading-tight font-medium text-[#0c3044] md:text-[2rem]"
					>
						Nu am publicat încă niciun articol
					</h2>
					<p
						class="mx-auto mt-4 max-w-xl [font-family:var(--font-sans)] text-base leading-relaxed text-muted-foreground"
					>
						Jurnalul Kogaion este în pregătire. Între timp, poți explora programele noastre sau să
						ne scrii direct — răspundem fiecărei familii.
					</p>
					<div class="mt-8 flex flex-wrap justify-center gap-3">
						<a
							href={contentHref('programs')}
							class="btn-diagonal inline-flex min-h-12 items-center justify-center gap-2 border border-[var(--brand-blue)] bg-[var(--brand-blue)] px-6 py-3 text-center [font-family:var(--font-sans)] text-[0.9rem] font-semibold text-white transition-colors hover:border-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] md:text-[0.96rem]"
						>
							{m.home_cta_programs_label()}
							<ArrowRight class="size-4 shrink-0" aria-hidden="true" />
						</a>
						<a
							href={contentHref('contact')}
							class="btn-diagonal inline-flex min-h-12 items-center justify-center border border-[var(--brand-blue)] bg-transparent px-6 py-3 text-center [font-family:var(--font-sans)] text-[0.9rem] font-semibold text-[var(--brand-blue)] transition-colors hover:border-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] md:text-[0.96rem]"
						>
							{m.home_cta_contact_label()}
						</a>
					</div>
				</div>
			</div>
		</section>
	{/if}

	<!-- Bandă finală de conversie, în geometria case-ului (colț diagonal verde). -->
	<section class="relative bg-white px-0 py-14 md:py-20">
		<div
			class="w-full overflow-hidden rounded-tl-[5.6rem] rounded-br-[5.6rem] bg-[#245f4e] text-white md:rounded-tl-[7rem] md:rounded-br-[7rem]"
		>
			<div class="mx-auto w-full max-w-[1600px] px-6 py-12 text-center md:px-10 md:py-14">
				<p class="[font-family:var(--font-sans)] text-xs tracking-[0.2em] text-white/85 uppercase">
					Continuă discuția
				</p>
				<h2
					class="mx-auto mt-4 max-w-[46rem] [font-family:var(--font-spectral)] text-[1.45rem] leading-tight font-medium text-white md:text-[2rem]"
				>
					Vrei să afli mai multe despre cum învățăm la Kogaion?
				</h2>
				<p
					class="mx-auto mt-4 max-w-2xl [font-family:var(--font-sans)] text-sm leading-relaxed text-white/85 md:text-base"
				>
					Programele, mentoratul și activitățile pentru familii sunt la un click distanță.
				</p>
				<div class="mt-8 flex flex-wrap justify-center gap-4">
					<a
						href={contentHref('programs')}
						class="btn-diagonal inline-flex min-h-12 items-center justify-center gap-2 border border-white bg-white px-6 py-3 text-center [font-family:var(--font-sans)] text-[0.9rem] font-semibold tracking-normal text-[var(--brand-blue)] normal-case transition-colors hover:bg-transparent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:text-[0.96rem]"
					>
						Descoperă programele
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
