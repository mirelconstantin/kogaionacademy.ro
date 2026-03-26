<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { contentHref } from '$lib/content-routes';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	let {
		data
	}: {
		data: {
			post: {
				id: number;
				title: string;
				body: string;
				excerpt: string | null;
				featuredImage: string | null;
				publishedAt: Date | null;
			};
		};
	} = $props();

	const FALLBACK_IMAGE = '/media/uploads/about/age-3-6.webp';
	const metaDescription = $derived(data.post.excerpt?.slice(0, 160) ?? data.post.title);
</script>

<svelte:head>
	<title>{data.post.title} | Kogaion Gifted Academy</title>
	<meta name="description" content={metaDescription} />
</svelte:head>

<!-- spațiu sub bara admin + meniul fix + mic aer suplimentar -->
<main class="min-h-dvh bg-muted/30 pt-[calc(8rem+var(--below-nav-gap,0px))]">
	<article class="mx-auto max-w-3xl px-6 pb-14 pt-6 md:px-12 md:pb-20 md:pt-8">
		<a
			href={contentHref('blog')}
			class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
		>
			<ArrowLeft class="size-4 shrink-0" />
			{m.menu_link_blog()}
		</a>
		<header class="mt-8 border-b border-border pb-8">
			<h1
				class="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl"
				style="font-family: var(--font-spectral);"
			>
				{data.post.title}
			</h1>
			{#if data.post.excerpt}
				<p class="mt-5 text-xl leading-relaxed text-muted-foreground md:text-[1.25rem]">
					{data.post.excerpt}
				</p>
			{/if}
			{#if data.post.publishedAt}
				<p class="mt-4 text-sm text-muted-foreground">
					{new Date(data.post.publishedAt).toLocaleDateString('ro-RO', {
						day: 'numeric',
						month: 'long',
						year: 'numeric'
					})}
				</p>
			{/if}
		</header>
		{#if data.post.featuredImage}
			<figure class="mt-10 overflow-hidden rounded-none border border-border bg-card shadow-sm">
				<div class="aspect-video w-full">
					<img
						src={data.post.featuredImage}
						alt=""
						class="size-full object-cover"
						loading="eager"
						fetchpriority="high"
					/>
				</div>
			</figure>
		{/if}
		<div
			class="blog-prose mt-10 max-w-none rounded-none border border-border bg-card p-8 text-foreground md:p-10"
			style="font-family: var(--font-spectral);"
		>
			{@html data.post.body}
		</div>
	</article>
</main>
