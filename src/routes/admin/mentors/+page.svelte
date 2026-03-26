<script lang="ts">
	import { tick } from 'svelte';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toastFromAction, toastFromActionWithMessage } from '$lib/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import MediaPicker from '$lib/components/cms/MediaPicker.svelte';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import History from '@lucide/svelte/icons/history';
	import type { ActionData } from './$types';

	let { data }: { data: import('./$types').PageData } = $props();
	const base = $derived(page.url.pathname);

	let result = $state<ActionData | null>(null);
	let editingId = $state<number | null>(null);
	let showNew = $state(false);
	let imageUrl = $state('');
	let orderedIds = $state<number[]>([]);
	let dragFromIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);
	let orderToSubmit = $state<string>('[]');
	let reorderForm = $state<HTMLFormElement | null>(null);
	const isDragging = $derived(dragFromIndex !== null);

	$effect(() => {
		if (showNew) imageUrl = '';
		else if (editingId) {
			const m = data.mentors.find((x) => x.id === editingId);
			imageUrl = m?.image ?? '';
		}
	});

	$effect(() => {
		orderedIds = data.mentors.map((m) => m.id);
	});

	const editingMentor = $derived(editingId ? data.mentors.find((m) => m.id === editingId) : null);

	function handleDragStart(e: DragEvent, index: number) {
		dragFromIndex = index;
		dragOverIndex = null;
		e.dataTransfer?.setData('text/plain', String(index));
		e.dataTransfer!.effectAllowed = 'move';
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
		dragOverIndex = index;
	}

	function handleDragLeave() {
		dragOverIndex = null;
	}

	function handleDragEnd() {
		dragFromIndex = null;
		dragOverIndex = null;
	}

	async function handleDrop(e: DragEvent, toIndex: number) {
		e.preventDefault();
		dragOverIndex = null;
		const from = dragFromIndex ?? parseInt(e.dataTransfer?.getData('text/plain') ?? '', 10);
		if (Number.isNaN(from) || from === toIndex) {
			dragFromIndex = null;
			return;
		}
		const next = [...orderedIds];
		const [removed] = next.splice(from, 1);
		next.splice(toIndex, 0, removed);
		orderedIds = next;
		dragFromIndex = null;
		orderToSubmit = JSON.stringify(next);
		await tick();
		reorderForm?.requestSubmit();
	}

	const orderedMentors = $derived(
		orderedIds
			.map((id) => data.mentors.find((m) => m.id === id))
			.filter((m): m is NonNullable<typeof m> => m != null)
	);
</script>

<div>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h2 class="text-2xl font-semibold text-foreground">Mentori</h2>
		<Button href="/admin/history?context=mentors" variant="outline" class="rounded-none" size="sm">
			<History class="size-4 shrink-0" aria-hidden="true" />
			Istoric modificări
		</Button>
	</div>
	<p class="mt-1 text-muted-foreground">Adaugă, editează sau șterge mentori. Ordinea de aici se afișează pe site.</p>

	{#if result?.error}
		<p class="mt-4 text-sm text-destructive">{result.error}</p>
	{/if}
	{#if result?.success}
		<p class="mt-4 text-sm text-primary">Salvat.</p>
	{/if}

	<div class="mt-6">
		<button
			type="button"
			class="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
			onclick={() => {
				showNew = true;
				editingId = null;
			}}
		>
			+ Adaugă mentor
		</button>
	</div>

	{#if showNew}
		<div class="mt-6 rounded-none border border-border bg-card p-6">
			<h3 class="font-medium text-foreground">Mentor nou</h3>
			<form
				method="POST"
				action={`${base}?/create`}
				use:enhance={() => ({ result: r }) => {
					if (r.type === 'success' || r.type === 'failure') toastFromActionWithMessage(r.data as ActionData, 'Mentor creat.');
					if (r.type === 'success' && r.data != null) {
						const actionData = r.data as ActionData;
						result = actionData;
						if (actionData?.success) showNew = false;
					}
				}}
				class="mt-4 grid gap-4 sm:grid-cols-2"
			>
				<div class="space-y-2 sm:col-span-2">
					<Label for="nameRo">Nume</Label>
					<Input id="nameRo" name="nameRo" class="rounded-none" required />
				</div>
				<div class="space-y-2 sm:col-span-2">
					<Label for="titleRo">Titlu</Label>
					<Input id="titleRo" name="titleRo" class="rounded-none" required />
				</div>
				<div class="space-y-2 sm:col-span-2">
					<Label for="bioRo">Bio</Label>
					<Textarea id="bioRo" name="bioRo" rows={8} class="rounded-none" required />
				</div>
				<div class="space-y-2 sm:col-span-2">
					<Label>Imagine</Label>
					<input type="hidden" name="image" value={imageUrl} />
					<MediaPicker bind:value={imageUrl} label="Selectează din Media" />
				</div>
				<div class="space-y-2">
					<Label for="yearJoined">An adăugare</Label>
					<Input id="yearJoined" name="yearJoined" type="number" class="rounded-none" />
				</div>
				<div class="flex gap-2 sm:col-span-2">
					<Button type="submit" class="rounded-none">Creează</Button>
					<Button
						type="button"
						variant="outline"
						class="rounded-none"
						onclick={() => (showNew = false)}
					>
						Anulare
					</Button>
				</div>
			</form>
		</div>
	{/if}

	<p class="mt-2 text-sm text-muted-foreground">Trage mentori în sus/jos pentru a schimba ordinea pe site.</p>

	<form
		method="POST"
		action={`${base}?/reorder`}
		use:enhance={() => async ({ result: r }) => {
			const data = r.type === 'success' || r.type === 'failure' ? (r.data as ActionData | null) : null;
			if (data) toastFromAction(data);
			if (r.type === 'success' && data != null) {
				result = data;
				if (data.success) await invalidateAll();
			} else if (r.type === 'failure' && data != null) {
				result = { error: data.error ?? 'Reorder failed', action: 'reorder' };
			}
		}}
		class="hidden"
		bind:this={reorderForm}
	>
		<input type="hidden" name="order" value={orderToSubmit} />
	</form>

	<div class="mt-8 space-y-4">
		{#each orderedMentors as m, index (m.id)}
			<div class="space-y-0">
				<!-- Linie indicator: aici va fi inserat mentorul la drop -->
				{#if isDragging && dragOverIndex === index}
					<div
						class="h-1 w-full rounded-full bg-primary shadow-md"
						role="presentation"
						aria-hidden="true"
					></div>
				{/if}
			{#if editingId === m.id}
				<div class="rounded-none border border-border bg-card p-6">
					<h3 class="font-medium text-foreground">Editează {m.nameRo}</h3>
					<form
						method="POST"
						action={`${base}?/update`}
						use:enhance={() => ({ result: r }) => {
							if (r.type === 'success' || r.type === 'failure') toastFromAction(r.data as ActionData);
							if (r.type === 'success' && r.data != null) {
								const actionData = r.data as ActionData;
								result = actionData;
								if (actionData?.success) editingId = null;
							}
						}}
						class="mt-4 grid gap-4 sm:grid-cols-2"
					>
						<input type="hidden" name="id" value={m.id} />
						<div class="space-y-2 sm:col-span-2">
							<Label for="nameRo-{m.id}">Nume</Label>
							<Input
								id="nameRo-{m.id}"
								name="nameRo"
								value={m.nameRo}
								class="rounded-none"
								required
							/>
						</div>
						<div class="space-y-2 sm:col-span-2">
							<Label for="titleRo-{m.id}">Titlu</Label>
							<Input
								id="titleRo-{m.id}"
								name="titleRo"
								value={m.titleRo}
								class="rounded-none"
								required
							/>
						</div>
						<div class="space-y-2 sm:col-span-2">
							<Label for="bioRo-{m.id}">Bio</Label>
							<Textarea
								id="bioRo-{m.id}"
								name="bioRo"
								rows={8}
								value={m.bioRo}
								class="rounded-none"
								required
							/>
						</div>
						<div class="space-y-2 sm:col-span-2">
							<Label>Imagine</Label>
							<input type="hidden" name="image" value={imageUrl} />
							<MediaPicker bind:value={imageUrl} label="Selectează din Media" />
						</div>
						<div class="space-y-2">
							<Label for="yearJoined-{m.id}">An adăugare</Label>
							<Input
								id="yearJoined-{m.id}"
								name="yearJoined"
								type="number"
								value={m.yearJoined ?? ''}
								class="rounded-none"
							/>
						</div>
						<div class="flex gap-2 sm:col-span-2">
							<Button type="submit" class="rounded-none">Salvează</Button>
							<Button
								type="button"
								variant="outline"
								class="rounded-none"
								onclick={() => (editingId = null)}
							>
								Anulare
							</Button>
						</div>
					</form>
				</div>
			{:else}
				<div
					class="flex items-center justify-between gap-4 rounded-none border border-border bg-card p-4 transition-opacity {isDragging && dragFromIndex === index
						? 'opacity-50'
						: ''}"
					draggable="true"
					role="button"
					tabindex="0"
					ondragstart={(e) => handleDragStart(e, index)}
					ondragover={(e) => handleDragOver(e, index)}
					ondragleave={handleDragLeave}
					ondragend={handleDragEnd}
					ondrop={(e) => handleDrop(e, index)}
				>
					<div class="flex min-w-0 items-center gap-2">
						<span
							class="touch-none cursor-grab text-muted-foreground active:cursor-grabbing"
							aria-label="Trage pentru a reordona"
						>
							<GripVertical class="size-5" />
						</span>
						<div class="min-w-0">
							<p class="font-medium text-foreground">{m.nameRo}</p>
							<p class="truncate text-sm text-muted-foreground">{m.titleRo}</p>
						</div>
					</div>
					<div class="flex shrink-0 gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							class="rounded-none"
							onclick={() => {
								editingId = m.id;
								showNew = false;
							}}
						>
							Editează
						</Button>
						<form
							method="POST"
							action={`${base}?/delete`}
							use:enhance={() => async ({ result: r }) => {
								if (r.type === 'success' || r.type === 'failure') toastFromActionWithMessage(r.data as ActionData, 'Mentor șters.');
								if (r.type === 'success') await invalidateAll();
							}}
							class="inline"
						>
							<input type="hidden" name="id" value={m.id} />
							<Button
								type="submit"
								variant="outline"
								size="sm"
								class="rounded-none text-destructive"
							>
								Șterge
							</Button>
						</form>
					</div>
				</div>
			{/if}
			</div>
		{/each}
	</div>
</div>
