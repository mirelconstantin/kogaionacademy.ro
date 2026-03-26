<script lang="ts">
	import { focusTrap } from '$lib/actions/focus-trap';
	import { dialogBehavior } from '$lib/actions/dialog-behavior';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import X from '@lucide/svelte/icons/x';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	let {
		open = $bindable(false),
		file = null as { name: string; url: string; mtime: number; title?: string; alt?: string; caption?: string; description?: string; tags?: string[] } | null,
		onClose = () => {}
	}: {
		open?: boolean;
		file?: { name: string; url: string; mtime: number; title?: string; alt?: string; caption?: string; description?: string; tags?: string[] } | null;
		onClose?: () => void;
	} = $props();

	let alt = $state('');
	let tagsStr = $state('');
	let saving = $state(false);
	let replacing = $state(false);
	let deleting = $state(false);
	let replaceError = $state<string | null>(null);
	let deleteError = $state<string | null>(null);
	let error = $state<string | null>(null);
	let replaceInputRef = $state<HTMLInputElement | null>(null);
	let showDeleteConfirm = $state(false);
	let usage = $state<{
		used: boolean;
		locations: { type: string; id: string; label: string; href?: string; detail?: string }[];
	} | null>(null);
	let deleteForceConfirm = $state(false);

	$effect(() => {
		if (file) {
			alt = file.alt ?? '';
			tagsStr = (file.tags ?? []).join(', ');
		}
	});

	$effect(() => {
		if (open && file?.url) {
			usage = null;
			fetch(`/admin/api/media/usage?url=${encodeURIComponent(file.url)}`)
				.then((r) => r.json())
				.then((data: {
					used?: boolean;
					locations?: { type: string; id: string; label: string; href?: string; detail?: string }[];
				}) => {
					usage = { used: data.used ?? false, locations: data.locations ?? [] };
				})
				.catch(() => {});
		}
	});

	async function saveMetadata() {
		if (!file) return;
		saving = true;
		error = null;
		try {
			const res = await fetch('/admin/api/media/metadata', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url: file.url,
					alt: alt || null,
					tags: tagsStr
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean)
				})
			});
			if (!res.ok) throw new Error((await res.json()).error ?? 'Eroare salvare');
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Eroare';
		} finally {
			saving = false;
		}
	}

	async function handleReplace(e: Event) {
		if (!file) return;
		const input = e.target as HTMLInputElement;
		const f = input.files?.[0];
		if (!f) return;
		replacing = true;
		replaceError = null;
		try {
			const fd = new FormData();
			fd.append('file', f);
			fd.append('url', file.url);
			const res = await fetch('/admin/api/media/replace', { method: 'POST', body: fd });
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? 'Eroare înlocuire');
			await invalidateAll();
			open = false;
			onClose();
		} catch (e) {
			replaceError = e instanceof Error ? e.message : 'Eroare';
		} finally {
			replacing = false;
			input.value = '';
		}
	}

	async function handleDelete(force = false) {
		if (!file) return;
		deleting = true;
		deleteError = null;
		try {
			const q = new URLSearchParams({ url: file.url });
			if (force) q.set('force', '1');
			const res = await fetch(`/admin/api/media/delete?${q}`, { method: 'DELETE' });
			const json = await res.json();
			if (!res.ok) {
				if (res.status === 403 && json.used && json.locations) {
					usage = { used: true, locations: json.locations };
					deleteForceConfirm = true;
					deleteError = 'Asset-ul este folosit. Ștergi oricum?';
					return;
				}
				throw new Error(json.error ?? 'Eroare ștergere');
			}
			open = false;
			showDeleteConfirm = false;
			deleteForceConfirm = false;
			onClose();
			await invalidateAll();
		} catch (e) {
			deleteError = e instanceof Error ? e.message : 'Eroare';
		} finally {
			deleting = false;
		}
	}

	function close() {
		open = false;
		error = null;
		replaceError = null;
		deleteError = null;
		showDeleteConfirm = false;
		deleteForceConfirm = false;
		usage = null;
		onClose();
	}
</script>

{#if open && file}
	<div
		class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Detalii media"
		tabindex="-1"
		use:focusTrap={{ initialFocus: false }}
		use:dialogBehavior={{ onClose: close, backdrop: true, initialFocus: true }}
	>
		<div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-none border border-border bg-background shadow-xl flex flex-col">
			<div class="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
				<h2 class="text-lg font-semibold text-foreground">Detalii media</h2>
				<button
					type="button"
					class="rounded-none p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
					onclick={close}
					aria-label="Închide"
				>
					<X class="size-5" />
				</button>
			</div>
			<div class="flex flex-col gap-4 p-4">
				<div class="flex aspect-video items-center justify-center overflow-hidden rounded-none bg-muted/30">
					{#if file.url.match(/\.(webm|mp4)$/i)}
						<video
							src={file.url}
							controls
							muted
							playsinline
							class="max-h-full max-w-full object-contain"
						></video>
					{:else}
						<img
							src={file.url}
							alt={alt || file.name}
							class="max-h-full max-w-full object-contain"
						/>
					{/if}
				</div>
				<p class="truncate text-xs text-muted-foreground" title={file.url}>{file.name}</p>
				{#if usage?.used && usage.locations.length > 0}
					<div class="space-y-1 text-xs text-muted-foreground">
						<p><strong>Folosit în:</strong></p>
						<ul class="space-y-1">
							{#each usage.locations as location (location.id)}
								<li class="flex items-center gap-1">
									{#if location.href}
										<a class="inline-flex items-center gap-1 underline hover:no-underline" href={location.href}>
											{location.label}
											<ExternalLink class="size-3" />
										</a>
									{:else}
										<span>{location.label}</span>
									{/if}
									{#if location.detail}
										<span>• {location.detail}</span>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				<div>
					<Label for="alt">Alt Text</Label>
					<Input id="alt" class="mt-1 rounded-none" bind:value={alt} placeholder="Descriere scurtă pentru accesibilitate" />
				</div>
				<div>
					<Label for="tags">Tag-uri (separate prin virgulă)</Label>
					<Input id="tags" class="mt-1 rounded-none" bind:value={tagsStr} placeholder="ex: hero, despre" />
				</div>
				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}
				<div class="flex flex-wrap items-center gap-2">
					<Button class="rounded-none" onclick={saveMetadata} disabled={saving}>
						{saving ? 'Se salvează...' : 'Salvează'}
					</Button>
					<input
						type="file"
						accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm"
						class="hidden"
						bind:this={replaceInputRef}
						onchange={handleReplace}
					/>
					<Button
						variant="outline"
						class="rounded-none"
						disabled={replacing}
						onclick={() => replaceInputRef?.click()}
					>
						<ImagePlus class="size-4" />
						{replacing ? 'Se încarcă...' : 'Înlocuiește'}
					</Button>
					{#if showDeleteConfirm}
						{#if deleteForceConfirm}
							<Button
								variant="destructive"
								class="rounded-none"
								disabled={deleting}
								onclick={() => handleDelete(true)}
							>
								{deleting ? 'Se șterge...' : 'Șterge oricum'}
							</Button>
						{:else}
							<Button
								variant="destructive"
								class="rounded-none"
								disabled={deleting}
								onclick={() => handleDelete(false)}
							>
								{deleting ? 'Se șterge...' : 'Șterge'}
							</Button>
						{/if}
						<Button
							variant="outline"
							class="rounded-none"
							disabled={deleting}
							onclick={() => { showDeleteConfirm = false; deleteForceConfirm = false; deleteError = null; }}
						>
							Anulare
						</Button>
					{:else}
						<Button
							variant="outline"
							class="rounded-none text-destructive hover:bg-destructive/10 hover:text-destructive"
							disabled={saving || replacing}
							onclick={() => (showDeleteConfirm = true)}
						>
							<Trash2 class="size-4" />
							Șterge
						</Button>
					{/if}
				</div>
				{#if replaceError}
					<p class="w-full text-sm text-destructive">{replaceError}</p>
				{/if}
				{#if showDeleteConfirm && deleteError}
					<p class="w-full text-sm text-destructive">{deleteError}</p>
				{/if}
				{#if showDeleteConfirm}
					<p class="w-full text-xs text-muted-foreground">
						{deleteForceConfirm
							? 'Acest fișier este folosit în conținut. Ștergerea poate rupe linkurile.'
							: 'Sigur ștergi acest fișier? Acțiunea nu poate fi anulată.'}
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
