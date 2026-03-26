<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FileText from '@lucide/svelte/icons/file-text';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-8">
	<header class="border-b border-border pb-6">
		<h2 class="text-2xl font-semibold text-foreground">Pagini</h2>
		<p class="mt-1 text-muted-foreground">
			Alege pagina pe care vrei să o editezi. Conținutul se gestionează pe secțiuni (hero, intro, etc.).
		</p>
	</header>

	<section aria-labelledby="pagini-heading">
		<h3 id="pagini-heading" class="sr-only">Lista pagini</h3>
		<div class="grid gap-4 sm:grid-cols-2">
			{#each data.pages as page (page.key)}
				<a
					href="/admin/pages/{page.key}"
					class="flex items-start gap-4 rounded-none border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow"
				>
					<div
						class="flex size-11 shrink-0 items-center justify-center rounded-none border border-border bg-muted/50"
					>
						<FileText class="size-5 text-muted-foreground" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="font-medium text-foreground">{page.label}</p>
						<p class="mt-1 text-sm leading-snug text-muted-foreground">{page.desc}</p>
					</div>
					<ChevronRight class="mt-1 size-5 shrink-0 text-muted-foreground" />
				</a>
			{/each}
		</div>
	</section>
</div>
