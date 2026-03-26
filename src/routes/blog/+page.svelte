<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { contentHref } from '$lib/content-routes';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	let { data }: { data: { posts: { id: number; slug: string; title: string; excerpt: string | null; featuredImage: string | null; publishedAt: Date | null }[] } } = $props();

	const FALLBACK_IMAGE = '/media/uploads/about/age-3-6.webp';
</script>

<svelte:head>
	<title>{m.menu_link_blog()} | Kogaion Gifted Academy</title>
</svelte:head>

<main class="min-h-dvh bg-white">
	<header class="relative overflow-hidden">
		<img
			src="/media/uploads/blog/hero.webp"
			alt=""
			class="absolute inset-0 size-full object-cover"
		/>
		<div
			class="absolute inset-0"
			style="background: linear-gradient(130deg, rgba(16,28,55,0.88) 10%, rgba(16,28,55,0.75) 50%, rgba(216,97,21,0.45) 100%);"
		></div>
		<div class="relative mx-auto max-w-6xl px-6 pb-16 pt-[calc(8rem+var(--below-nav-gap,0px))] md:px-12 lg:px-16">
			<a
				href={contentHref('home')}
				class="inline-flex items-center gap-2 text-sm text-white/90 transition-colors hover:text-white"
			>
				<ArrowLeft class="size-4" />
				{m.nav_home()}
			</a>
			<h1
				class="mt-6 max-w-3xl text-4xl font-bold text-white md:text-5xl lg:text-6xl"
				style="font-family: var(--font-spectral);"
			>
				{m.menu_link_blog()}
			</h1>
			<p class="mt-4 max-w-2xl text-lg leading-relaxed text-white/95 md:text-xl">
				{m.blog_hero_intro()}
			</p>
		</div>
	</header>

	<div class="mx-auto max-w-6xl px-6 py-14 md:px-12 md:py-20 lg:px-16">
		{#if data.posts.length === 0}
			<p class="text-muted-foreground">Niciun articol publicat momentan.</p>
		{:else}
			<ul class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.posts as post (post.id)}
					<li>
						<a
							href={'/blog/' + encodeURIComponent(post.slug)}
							class="group flex h-full flex-col overflow-hidden rounded-none border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md"
						>
							<div class="aspect-video w-full overflow-hidden bg-muted/30">
								<img
									src={post.featuredImage ?? FALLBACK_IMAGE}
									alt=""
									class="size-full object-cover transition-transform group-hover:scale-105"
								/>
							</div>
							<div class="flex flex-1 flex-col p-5">
								<h2 class="font-semibold text-foreground group-hover:text-primary">
									{post.title}
								</h2>
								{#if post.excerpt}
									<p class="mt-2 line-clamp-2 text-sm text-muted-foreground">
										{post.excerpt}
									</p>
								{/if}
								{#if post.publishedAt}
									<p class="mt-auto pt-3 text-xs text-muted-foreground">
										{new Date(post.publishedAt).toLocaleDateString('ro-RO', {
											day: 'numeric',
											month: 'long',
											year: 'numeric'
										})}
									</p>
								{/if}
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</main>
