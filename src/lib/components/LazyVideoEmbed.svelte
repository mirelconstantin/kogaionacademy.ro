<script lang="ts">
	import Play from '@lucide/svelte/icons/play';

	let {
		embedSrc,
		title = 'Video',
		videoId = '',
		provider = 'youtube'
	}: {
		embedSrc: string;
		title?: string;
		videoId?: string;
		provider?: 'youtube' | 'vimeo';
	} = $props();

	let loaded = $state(false);
	let container = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!container || loaded) return;
		const el = container;
		const obs = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) loaded = true;
			},
			{ rootMargin: '100px', threshold: 0.1 }
		);
		obs.observe(el);
		return () => obs.disconnect();
	});

	const posterUrl = $derived(
		provider === 'youtube' && videoId
			? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
			: null
	);
</script>

<div bind:this={container} class="relative aspect-video w-full overflow-hidden rounded-none border border-border bg-black">
	{#if loaded}
		<iframe
			src={embedSrc}
			{title}
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			allowfullscreen
			class="size-full"
			referrerpolicy="strict-origin-when-cross-origin"
		></iframe>
	{:else}
		<button
			type="button"
			class="absolute inset-0 flex size-full items-center justify-center bg-muted/30 transition-colors hover:bg-muted/50"
			onclick={() => (loaded = true)}
			aria-label="Încarcă video"
		>
			{#if posterUrl}
				<img
					src={posterUrl}
					alt=""
					class="absolute inset-0 size-full object-cover"
					loading="lazy"
				/>
			{/if}
			<span
				class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition hover:bg-primary"
				aria-hidden="true"
			>
				<Play class="size-7" />
			</span>
		</button>
	{/if}
</div>
