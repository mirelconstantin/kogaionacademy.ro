<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let { data } = $props();
	const permissions = $derived((page.data as { permissions?: string[] }).permissions ?? []);
	const canEdit = $derived(permissions.includes('forms.edit'));
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Formulare</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Definiții versionate, răspunsuri și analiză. Formularul public se actualizează după publicare.
			</p>
		</div>
		{#if canEdit}
			<Button href="/admin/forms/new" class="rounded-none">Formular nou</Button>
		{/if}
	</div>

	<ul class="space-y-2">
		{#each data.forms as f (f.id)}
			<li>
				<a
					href="/admin/forms/{f.id}"
					class="flex items-center gap-3 border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted/50"
				>
					<ClipboardList class="size-5 shrink-0 text-muted-foreground" />
					<div class="min-w-0 flex-1">
						<p class="font-medium">
							<span class="font-mono text-xs text-muted-foreground">{f.key}</span>
							· {f.locale} · v{f.version}
							{#if f.status === 'published'}
								<span class="ml-2 text-xs font-normal text-green-700">publicat</span>
							{:else if f.status === 'archived'}
								<span class="ml-2 text-xs font-normal text-muted-foreground">arhivat</span>
							{:else}
								<span class="ml-2 text-xs font-normal text-amber-700">draft</span>
							{/if}
						</p>
						{#if f.title}
							<p class="truncate text-muted-foreground">{f.title}</p>
						{/if}
					</div>
					<ChevronRight class="size-4 shrink-0 opacity-50" />
				</a>
			</li>
		{/each}
	</ul>

	{#if data.forms.length === 0}
		<p class="text-sm text-muted-foreground">
			Nicio definiție încă. Rulează <code class="rounded bg-muted px-1">bun run scripts/seed-forms-default.ts</code> sau
			creează un formular nou.
		</p>
	{/if}
</div>
