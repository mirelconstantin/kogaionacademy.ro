<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { toastFromAction } from '$lib/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import MediaDetailModal from '$lib/components/admin/MediaDetailModal.svelte';
	import Search from '@lucide/svelte/icons/search';
	import Upload from '@lucide/svelte/icons/upload';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';

	type MediaFile = {
		name: string;
		url: string;
		mtime: number;
		title?: string;
		alt?: string;
		caption?: string;
		description?: string;
		tags?: string[];
	};

	const UPLOAD_FOLDER = 'general';
	let { data }: { data: import('./$types').PageData } = $props();
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let inputRef = $state<HTMLInputElement | null>(null);
	let modalOpen = $state(false);
	let selectedFile = $state<MediaFile | null>(null);
	let copyFeedbackUrl = $state<string | null>(null);
	let dragOver = $state(false);
	let searchQuery = $state('');
	let selectedUrls = $state<string[]>([]);
	let bulkDeleting = $state(false);
	let filterTag = $state<string | null>(null);
	let filterUsed = $state<'all' | 'used' | 'unused'>('all');
	let filterType = $state<'all' | 'image' | 'video'>('all');

	const usedUrls = $derived(data.usedUrls ?? []);
	const allTags = $derived.by(() => {
		const set = new Set<string>();
		for (const f of data.files) {
			for (const t of f.tags ?? []) if (t) set.add(t);
		}
		return [...set].sort();
	});

	const filteredFiles = $derived.by(() => {
		let list = data.files;
		const q = searchQuery.trim().toLowerCase();
		if (q) {
			list = list.filter(
				(f) =>
					f.name.toLowerCase().includes(q) ||
					f.url.toLowerCase().includes(q) ||
					(f.alt?.toLowerCase().includes(q) ?? false)
			);
		}
		if (filterTag) {
			list = list.filter((f) => (f.tags ?? []).includes(filterTag!));
		}
		if (filterUsed === 'used') list = list.filter((f) => usedUrls.includes(f.url));
		if (filterUsed === 'unused') list = list.filter((f) => !usedUrls.includes(f.url));
		if (filterType === 'image') list = list.filter((f) => !/\.(webm|mp4)$/i.test(f.name));
		if (filterType === 'video') list = list.filter((f) => /\.(webm|mp4)$/i.test(f.name));
		return list;
	});

	function openModal(file: MediaFile, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		selectedFile = file;
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
		selectedFile = null;
	}

	async function handleUpload(e: Event) {
		uploading = true;
		uploadError = null;
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			uploading = false;
			return;
		}
		try {
			const fd = new FormData();
			fd.append('file', file);
			fd.append('folder', UPLOAD_FOLDER);
			const res = await fetch('/admin/api/media/upload', { method: 'POST', body: fd });
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? 'Upload eșuat');
			toastFromAction({ success: true });
			await invalidateAll();
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Upload eșuat';
			uploadError = msg;
			toastFromAction({ error: msg });
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	function uploadFile(file: File) {
		if (!file) return;
		uploading = true;
		uploadError = null;
		const fd = new FormData();
		fd.append('file', file);
		fd.append('folder', UPLOAD_FOLDER);
		fetch('/admin/api/media/upload', { method: 'POST', body: fd })
			.then((res) => res.json())
			.then((json) => {
				if (!json.error) {
					toastFromAction({ success: true });
					invalidateAll();
				} else throw new Error(json.error);
			})
			.catch((err) => {
				const msg = err instanceof Error ? err.message : 'Upload eșuat';
				uploadError = msg;
				toastFromAction({ error: msg });
			})
			.finally(() => {
				uploading = false;
			});
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const file = e.dataTransfer?.files?.[0];
		if (!file) return;
		if (/^image\//.test(file.type) || /^video\//.test(file.type)) {
			uploadFile(file);
		} else {
			uploadError = 'Tip fișier neacceptat. Folosiți imagine sau video.';
		}
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragOver = true;
	}

	function onDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragOver = false;
	}

	function fullUrl(url: string): string {
		const base = data.publicSiteUrl ?? '';
		const pathPart = url.startsWith('/') ? url : `/${url}`;
		return base ? `${base}${pathPart}` : pathPart;
	}

	function displayFileName(file: MediaFile): string {
		const parts = file.name.split(/[\\/]/);
		return parts[parts.length - 1] ?? file.name;
	}

	async function copyUrl(url: string) {
		try {
			await navigator.clipboard.writeText(fullUrl(url));
			copyFeedbackUrl = url;
			setTimeout(() => (copyFeedbackUrl = null), 2000);
			if (!data.publicSiteUrl) {
				toastFromAction({ error: 'Set PUBLIC_SITE_URL sau ORIGIN în .env pentru URL absolut.' });
			}
		} catch {
			toastFromAction({ error: 'Nu s-a putut copia în clipboard.' });
		}
	}

	function toggleSelect(url: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		if (selectedUrls.includes(url)) {
			selectedUrls = selectedUrls.filter((u) => u !== url);
		} else {
			selectedUrls = [...selectedUrls, url];
		}
	}

	function selectNone() {
		selectedUrls = [];
	}

	async function bulkCopyUrls() {
		if (selectedUrls.length === 0) return;
		const text = selectedUrls.map((u) => fullUrl(u)).join('\n');
		try {
			await navigator.clipboard.writeText(text);
			toastFromAction({ success: true });
			if (!data.publicSiteUrl) {
				toastFromAction({ error: 'Set PUBLIC_SITE_URL în .env pentru URL-uri absolute.' });
			}
		} catch {
			toastFromAction({ error: 'Nu s-a putut copia în clipboard.' });
		}
	}

	async function bulkDelete() {
		if (selectedUrls.length === 0) return;
		if (!confirm(`Ștergi ${selectedUrls.length} fișier(e)? Fișierele folosite în conținut vor necesita confirmare.`)) return;
		bulkDeleting = true;
		let ok = 0;
		let blocked = 0;
		for (const url of selectedUrls) {
			const res = await fetch(`/admin/api/media/delete?url=${encodeURIComponent(url)}`, { method: 'DELETE' });
			const json = await res.json();
			if (res.ok) ok++;
			else if (res.status === 403 && json.used) blocked++;
		}
		bulkDeleting = false;
		selectedUrls = [];
		await invalidateAll();
		if (ok) toastFromAction({ success: true });
		if (blocked) toastFromAction({ error: `${blocked} fișier(e) sunt folosite; șterge-le din detaliu cu „Șterge oricum”.` });
	}
</script>

	<div>
	<h2 class="text-2xl font-semibold text-foreground">Bibliotecă Media</h2>
	<p class="mt-1 text-muted-foreground">Imaginile și video-urile se convertesc automat în WebP/WebM. Folosiți „Selectează” în formulare pentru a alege un fișier.</p>

	<div
		class="mt-6 flex flex-wrap items-center gap-4 rounded-none border-2 border-dashed p-6 transition-colors {dragOver
			? 'border-primary bg-primary/10'
			: 'border-primary/50 bg-muted/20'}"
		role="button"
		tabindex="0"
		ondragover={onDragOver}
		ondragleave={onDragLeave}
		ondrop={onDrop}
		onkeydown={(e) => e.key === 'Enter' && inputRef?.click()}
	>
		<input
			type="file"
			accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm"
			class="hidden"
			bind:this={inputRef}
			onchange={handleUpload}
		/>
		<Upload class="size-8 shrink-0 text-muted-foreground" />
		<div>
			<p class="font-medium text-foreground">
				{dragOver ? 'Lasă fișierele aici' : 'Trage imaginile sau video-urile aici'}
			</p>
			<p class="mt-0.5 text-sm text-muted-foreground">
				sau click pentru a selecta din calculator
			</p>
		</div>
		<Button
			type="button"
			class="rounded-none"
			onclick={() => inputRef?.click()}
			disabled={uploading}
		>
			{uploading ? 'Se încarcă...' : 'Alege fișier'}
		</Button>
		{#if uploadError}
			<p class="w-full text-sm text-destructive">{uploadError}</p>
		{/if}
	</div>

	{#if data.files.length > 0}
		<div class="mt-4 flex flex-col gap-3">
			<div class="relative max-w-sm">
				<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					class="rounded-none pl-9"
					placeholder="Caută după nume, URL sau alt text..."
					bind:value={searchQuery}
					aria-label="Caută în bibliotecă media"
				/>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-xs font-medium text-muted-foreground">Filtre:</span>
				<Button
					size="sm"
					variant={filterUsed === 'all' ? 'default' : 'outline'}
					class="rounded-none"
					onclick={() => (filterUsed = 'all')}
				>
					Toate
				</Button>
				<Button
					size="sm"
					variant={filterUsed === 'used' ? 'default' : 'outline'}
					class="rounded-none"
					onclick={() => (filterUsed = 'used')}
				>
					Folosite
				</Button>
				<Button
					size="sm"
					variant={filterUsed === 'unused' ? 'default' : 'outline'}
					class="rounded-none"
					onclick={() => (filterUsed = 'unused')}
				>
					Nefolosite
				</Button>
				<span class="ml-2 text-xs text-muted-foreground">|</span>
				<Button
					size="sm"
					variant={filterType === 'all' ? 'default' : 'outline'}
					class="rounded-none"
					onclick={() => (filterType = 'all')}
				>
					Toate
				</Button>
				<Button
					size="sm"
					variant={filterType === 'image' ? 'default' : 'outline'}
					class="rounded-none"
					onclick={() => (filterType = 'image')}
				>
					Imagini
				</Button>
				<Button
					size="sm"
					variant={filterType === 'video' ? 'default' : 'outline'}
					class="rounded-none"
					onclick={() => (filterType = 'video')}
				>
					Video
				</Button>
				{#if allTags.length > 0}
					<span class="ml-2 text-xs text-muted-foreground">| Tag-uri:</span>
					{#each allTags as tag (tag)}
						<button
							type="button"
							class="rounded-none px-2 py-1 text-xs {filterTag === tag
								? 'bg-primary text-primary-foreground'
								: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
							onclick={() => (filterTag = filterTag === tag ? null : tag)}
						>
							{tag}
						</button>
					{/each}
					{#if filterTag}
						<button
							type="button"
							class="rounded-none px-2 py-1 text-xs text-muted-foreground underline hover:no-underline"
							onclick={() => (filterTag = null)}
						>
							Elimină tag
						</button>
					{/if}
				{/if}
			</div>
		</div>
	{/if}

	<div class="mt-6">
		{#if data.files.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-none border-2 border-dashed py-20 transition-colors {dragOver
					? 'border-primary bg-primary/10'
					: 'border-primary/50 bg-muted/20'}"
				role="button"
				tabindex="0"
				ondragover={onDragOver}
				ondragleave={onDragLeave}
				ondrop={onDrop}
				onkeydown={(e) => e.key === 'Enter' && inputRef?.click()}
			>
				<Upload class="size-14 text-muted-foreground" />
				<p class="mt-4 font-medium text-foreground">Nicio imagine încărcată</p>
				<p class="mt-1 text-sm text-muted-foreground">Trage imaginile sau video-urile aici pentru upload</p>
				<p class="mt-0.5 text-xs text-muted-foreground">sau folosește butonul de mai sus</p>
			</div>
		{:else if filteredFiles.length === 0}
			<p class="text-muted-foreground">Niciun rezultat pentru „{searchQuery.trim() || '…'}”.</p>
		{:else}
			{#if selectedUrls.length > 0}
				<div class="mb-3 flex flex-wrap items-center gap-2 rounded-none border border-border bg-muted/30 px-3 py-2">
					<span class="text-sm font-medium text-foreground">{selectedUrls.length} selectate</span>
					<Button size="sm" variant="outline" class="rounded-none" onclick={bulkCopyUrls} disabled={bulkDeleting}>
						Copiază URL-uri
					</Button>
					<Button size="sm" variant="outline" class="rounded-none text-destructive hover:bg-destructive/10" onclick={bulkDelete} disabled={bulkDeleting}>
						{bulkDeleting ? 'Se șterg...' : 'Șterge'}
					</Button>
					<Button size="sm" variant="ghost" class="rounded-none" onclick={selectNone} disabled={bulkDeleting}>
						Deselectează
					</Button>
				</div>
			{/if}
			<div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{#each filteredFiles as file (file.url)}
					<div class="group relative overflow-hidden rounded-none border border-border bg-card {selectedUrls.includes(file.url) ? 'ring-2 ring-primary' : ''}">
						{#if data.usedUrls?.includes(file.url)}
							<span class="absolute left-2 top-2 z-10 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
								Folosit
							</span>
						{/if}
						<button
							type="button"
							class="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded border border-border bg-background shadow"
							onclick={(e) => toggleSelect(file.url, e)}
							aria-pressed={selectedUrls.includes(file.url)}
						>
							{#if selectedUrls.includes(file.url)}
								<span class="text-primary">✓</span>
							{:else}
								<span class="text-muted-foreground">○</span>
							{/if}
						</button>
						<button
							type="button"
							class="block w-full cursor-pointer text-left"
							onclick={(e) => openModal(file, e)}
						>
							<span class="block aspect-square">
								{#if /\.(webm|mp4)$/i.test(file.name)}
									<video
										src={file.url}
										preload="metadata"
										muted
										playsinline
										class="size-full object-cover transition-opacity group-hover:opacity-90"
									></video>
								{:else}
									<img
										src={file.url}
										alt={file.alt ?? displayFileName(file)}
										class="size-full object-cover transition-opacity group-hover:opacity-90"
									/>
								{/if}
							</span>
						</button>
						<div class="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-2 py-2">
							<span class="truncate text-xs text-muted-foreground">{displayFileName(file)}</span>
							<Button
								size="icon"
								variant="ghost"
								class="size-6 shrink-0 rounded-none"
								aria-label="Copiază URL"
								title={copyFeedbackUrl === file.url ? 'Copiat!' : 'Copiază URL'}
								onclick={(e) => {
									e.stopPropagation();
									copyUrl(file.url);
								}}
							>
								{#if copyFeedbackUrl === file.url}
									<Check class="size-3.5 text-primary" />
								{:else}
									<Copy class="size-3.5" />
								{/if}
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<MediaDetailModal bind:open={modalOpen} file={selectedFile} onClose={closeModal} />
