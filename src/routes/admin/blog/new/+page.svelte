<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { toastFromActionWithMessage } from '$lib/client';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import EdraFormField from '$lib/components/edra/EdraFormField.svelte';
	import MediaPicker from '$lib/components/cms/MediaPicker.svelte';
	import { slugify } from '$lib/utils';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import type { ActionData } from './$types';

	let { formAction, data }: { formAction: string; data: { success?: boolean; error?: string } } = $props();
	let titleValue = $state('');
	let slugValue = $state('');
	let slugManuallyEdited = $state(false);
	let statusValue = $state<'draft' | 'scheduled' | 'published'>('draft');
	let featuredImageUrl = $state('');

	function generateSlug() {
		if (titleValue.trim()) {
			slugValue = slugify(titleValue);
			slugManuallyEdited = false;
		}
	}

	$effect(() => {
		if (data?.success) goto('/admin/blog');
	});

	$effect(() => {
		if (!slugManuallyEdited && titleValue.trim()) slugValue = slugify(titleValue);
	});
</script>

<svelte:head>
	<title>Articol nou | Admin Blog</title>
</svelte:head>

<div>
	<a
		href="/admin/blog"
		class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
	>
		<ArrowLeft class="size-4" />
		Înapoi la Blog
	</a>
	<h2 class="mt-4 text-2xl font-semibold text-foreground">Articol nou</h2>

	<form
		method="POST"
		action={formAction}
		use:enhance={() => async ({ result: r }) => {
			if (r.type === 'success' || r.type === 'failure') toastFromActionWithMessage(r.data as ActionData, 'Articol creat.');
			if (r.type === 'success' && (r.data as ActionData)?.success) goto('/admin/blog');
		}}
		class="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]"
	>
		<div class="space-y-6 lg:order-1">
			<div>
				<Label for="title">Titlu</Label>
				<Input
					id="title"
					name="title"
					class="mt-1 rounded-none"
					required
					bind:value={titleValue}
				/>
			</div>
			<div>
				<div class="flex items-end gap-2">
					<div class="flex-1">
						<Label for="slug">Slug (URL)</Label>
						<Input
							id="slug"
							name="slug"
							class="mt-1 rounded-none"
							placeholder="Generat automat din titlu"
							bind:value={slugValue}
							oninput={() => (slugManuallyEdited = true)}
						/>
						<p class="mt-1 text-sm text-muted-foreground">URL: /blog/{slugValue || '…'}</p>
					</div>
					<Button type="button" variant="outline" class="shrink-0 rounded-none" onclick={generateSlug} title="Generează din titlu">
						<RefreshCw class="size-4" />
					</Button>
				</div>
			</div>
			<div>
				<Label for="excerpt">Rezumat (opțional)</Label>
				<textarea
					id="excerpt"
					name="excerpt"
					rows="3"
					class="mt-1 w-full rounded-none border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					placeholder="Apare pe lista de articole și în meta."
				></textarea>
			</div>
			<div>
				<Label for="body">Conținut</Label>
				<div class="mt-1">
					<EdraFormField proseVariant="blog" name="body" value="" placeholder="Scrie conținutul articolului..." />
				</div>
			</div>
		</div>

		<aside class="space-y-6 lg:order-2">
			<div class="rounded-none border border-border bg-card p-4">
				<h3 class="mb-3 text-sm font-semibold text-foreground">Publicare</h3>
				<input type="hidden" name="status" value={statusValue} />
				<Select.Root type="single" bind:value={statusValue}>
					<Select.Trigger class="w-full rounded-none">
						{statusValue === 'draft' ? 'Ciornă' : statusValue === 'scheduled' ? 'Programat' : 'Publicat'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="draft" label="Ciornă">Ciornă</Select.Item>
						<Select.Item value="scheduled" label="Programat">Programat</Select.Item>
						<Select.Item value="published" label="Publicat">Publicat</Select.Item>
					</Select.Content>
				</Select.Root>
				{#if statusValue === 'published'}
					<div class="mt-3">
						<Label for="publishedAt">Data publicării</Label>
						<Input id="publishedAt" name="publishedAt" type="datetime-local" class="mt-1 rounded-none" />
					</div>
				{/if}
				{#if statusValue === 'scheduled'}
					<div class="mt-3">
						<Label for="scheduledFor">Programat pentru</Label>
						<Input id="scheduledFor" name="scheduledFor" type="datetime-local" class="mt-1 rounded-none" />
					</div>
				{/if}
			</div>
			<div class="rounded-none border border-border bg-card p-4">
				<h3 class="mb-3 text-sm font-semibold text-foreground">Imagine reprezentativă</h3>
				<input type="hidden" name="featuredImage" value={featuredImageUrl} />
				<MediaPicker bind:value={featuredImageUrl} label="Selectează imagine" />
			</div>
		</aside>

		<div class="flex gap-2 border-t border-border pt-6 lg:col-span-2">
			<Button type="submit" class="rounded-none">Salvează articol</Button>
			<Button type="button" variant="outline" class="rounded-none" onclick={() => goto('/admin/blog')}>
				Anulare
			</Button>
		</div>
	</form>
</div>
