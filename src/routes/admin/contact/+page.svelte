<script lang="ts">
	import { enhance } from '$app/forms';
	import { toastFromAction } from '$lib/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import History from '@lucide/svelte/icons/history';
	import type { ActionData } from './$types';

	let { data }: { data: import('./$types').PageData } = $props();

	let result = $state<ActionData | null>(null);

	const contact = $derived(data.contactRo);

	const SOCIAL_NETWORKS = [
		{ key: 'instagram', label: 'Instagram' },
		{ key: 'facebook', label: 'Facebook' },
		{ key: 'linkedin', label: 'LinkedIn' },
		{ key: 'youtube', label: 'YouTube' },
		{ key: 'twitter', label: 'X (Twitter)' },
		{ key: 'tiktok', label: 'TikTok' }
	] as const;

	const socialsMap = $derived(new Map((contact?.socials ?? []).map((s) => [s.name.toLowerCase(), s.url])));
</script>

<div>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h2 class="text-2xl font-semibold text-foreground">Setări contact</h2>
		<Button href="/admin/history?context=contact" variant="outline" class="rounded-none" size="sm">
			<History class="size-4 shrink-0" aria-hidden="true" />
			Istoric modificări
		</Button>
	</div>
	<p class="mt-1 text-muted-foreground">Email, telefon, adresă și rețele sociale pentru pagina Contact.</p>

	<form
		method="POST"
		action="?/default"
		use:enhance={() => async ({ result: r }) => {
			if (r.type === 'success' || r.type === 'failure') toastFromAction(r.data as ActionData);
			if (r.type === 'success' && r.data) result = r.data as ActionData;
		}}
		class="mt-6 max-w-xl space-y-4"
	>
		<input type="hidden" name="locale" value="ro" />
		<div class="space-y-2">
			<Label for="email">Email</Label>
			<Input
				id="email"
				name="email"
				type="email"
				value={contact?.email ?? ''}
				class="rounded-none"
				required
			/>
		</div>
		<div class="space-y-2">
			<Label for="phone">Telefon</Label>
			<Input
				id="phone"
				name="phone"
				type="text"
				value={contact?.phone ?? ''}
				class="rounded-none"
				required
			/>
		</div>
		<div class="space-y-2">
			<Label for="address">Adresă</Label>
			<Textarea
				id="address"
				name="address"
				rows={2}
				value={contact?.address ?? ''}
				class="rounded-none"
				required
			/>
		</div>
		<div class="space-y-2">
			<Label for="mapUrl">URL hartă (opțional)</Label>
			<Input
				id="mapUrl"
				name="mapUrl"
				type="url"
				value={contact?.mapUrl ?? ''}
				class="rounded-none"
			/>
		</div>

		<div class="space-y-3 pt-4 border-t border-border">
			<h3 class="text-sm font-semibold text-foreground">Rețele sociale</h3>
			<p class="text-xs text-muted-foreground">
				Adaugă URL doar pentru rețelele pe care le folosești. Acestea vor apărea în footer și pe pagina Contact.
			</p>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each SOCIAL_NETWORKS as { key, label }}
					<div class="space-y-1">
						<Label for={'social_' + key} class="text-xs">{label}</Label>
						<Input
							id={'social_' + key}
							name={'social_' + key}
							type="url"
							value={socialsMap.get(key) ?? ''}
							class="rounded-none"
							placeholder={'https://' + key + '.com/...'}
						/>
					</div>
				{/each}
			</div>
		</div>

		{#if result?.error}
			<p class="text-sm text-destructive">{result.error}</p>
		{/if}
		{#if result?.success}
			<p class="text-sm text-primary">Salvat.</p>
		{/if}
		<Button type="submit" class="rounded-none">Salvează</Button>
	</form>
</div>
