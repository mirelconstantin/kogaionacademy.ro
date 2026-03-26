<script lang="ts">
	import { page } from '$app/state';
	import { contentHref } from '$lib/content-routes';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Home from '@lucide/svelte/icons/home';

	let { status = 500, message = 'Ceva nu a mers bine' }: { status?: number; message?: string } = $props();
	const is404 = $derived(status === 404);
	const title = $derived(is404 ? 'Pagina nu a fost găsită' : 'Eroare');
	const desc = $derived(
		is404
			? 'Pagina pe care o cauți nu există sau a fost mutată.'
			: 'A apărut o eroare neașteptată. Te rugăm să încerci din nou.'
	);
</script>

<svelte:head>
	<title>{status} – {title}</title>
</svelte:head>

<main class="flex min-h-dvh flex-col items-center justify-center bg-muted/30 px-6 py-16">
	<div class="mx-auto w-full max-w-sm rounded-none border border-border bg-card p-8 text-center shadow-sm">
		<p class="text-8xl font-bold text-primary/30" aria-hidden="true">{status}</p>
		<h1 class="mt-4 text-2xl font-semibold text-foreground">{title}</h1>
		<p class="mt-3 text-muted-foreground">{desc}</p>
		{#if !page?.url?.pathname?.startsWith('/admin')}
			<div class="mt-8 flex flex-wrap justify-center gap-4">
				<button
					type="button"
					onclick={() => history.back()}
					class="inline-flex items-center gap-2 rounded-none border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
				>
					<ChevronLeft class="size-4" />
					Înapoi
				</button>
				<a
					href={contentHref('home')}
					class="inline-flex items-center gap-2 rounded-none bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-95"
				>
					<Home class="size-4" />
					Acasă
				</a>
			</div>
		{/if}
	</div>
</main>
