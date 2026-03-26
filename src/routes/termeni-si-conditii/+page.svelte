<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.title} · Kogaion</title>
	<meta name="robots" content="index,follow" />
</svelte:head>

<div
	class="mx-auto max-w-3xl px-6 pb-12 pt-[calc(var(--admin-bar-height,0px)+var(--nav-height,5rem)+var(--below-nav-gap,0px))] sm:pb-16"
>
	<h1 class="text-3xl font-semibold tracking-tight text-foreground">{data.title}</h1>
	{#if data.lastUpdatedNote}
		<p class="mt-2 text-sm text-muted-foreground">Ultima actualizare: {data.lastUpdatedNote}</p>
	{/if}
	<div
		class="legal-prose mt-8 space-y-4 text-[0.98rem] leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-medium [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-6"
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- conținut sanitizat server-side -->
		{@html data.html}
	</div>
</div>
