<script lang="ts">
	let {
		src = $bindable(),
		alt = '',
		fallback = '',
		size = 'md',
		class: className = ''
	}: {
		src?: string | null;
		alt?: string;
		fallback?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	} = $props();

	let imageError = $state(false);

	$effect(() => {
		src;
		imageError = false;
	});

	const initials = $derived(
		fallback || (alt ? alt.split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase() : '')
	);
	const sizeClass = $derived(
		size === 'sm' ? 'size-8' : size === 'lg' ? 'size-12' : 'size-9'
	);
	const showImage = $derived(Boolean(src && !imageError));
</script>

<span
	class="relative flex shrink-0 overflow-hidden rounded-full bg-muted {sizeClass} {className}"
	role="img"
	aria-label={alt || 'Avatar'}
>
	{#if showImage}
		<img
			src={src}
			alt={alt}
			class="aspect-square size-full object-cover"
			data-lightview="false"
			loading="eager"
			fetchpriority="high"
			onerror={() => (imageError = true)}
		/>
	{:else if initials}
		<span class="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
			{initials}
		</span>
	{:else}
		<span class="flex size-full items-center justify-center text-muted-foreground">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5">
				<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
				<circle cx="12" cy="7" r="4" />
			</svg>
		</span>
	{/if}
</span>
