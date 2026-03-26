<script lang="ts">
	import { focusTrap } from '$lib/actions/focus-trap';
	import { dialogBehavior } from '$lib/actions/dialog-behavior';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';

	let {
		open = $bindable(false),
		value = $bindable(''),
		values = $bindable<string[]>([]),
		label = 'Selectează din media',
		inline = false,
		multiple = false,
		onSelect
	}: {
		open?: boolean;
		value?: string;
		values?: string[];
		label?: string;
		inline?: boolean;
		multiple?: boolean;
		onSelect?: (url: string) => void;
	} = $props();

	let files = $state<{ name: string; url: string }[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let selected = $state<string[]>([]);
	let searchQuery = $state('');

	const filteredFiles = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return files;
		return files.filter(
			(f) =>
				f.name.toLowerCase().includes(q) ||
				f.url.toLowerCase().includes(q)
		);
	});

	$effect(() => {
		if (!open) return;
		loading = true;
		error = null;
		fetch('/admin/api/media/list')
			.then((r) => r.json())
			.then((data: { files?: { name: string; url: string }[] }) => {
				files = data.files ?? [];
			})
			.catch((e) => {
				error = e instanceof Error ? e.message : 'Eroare la încărcare';
				files = [];
			})
			.finally(() => {
				loading = false;
			});
	});

	function select(url: string) {
		if (multiple) {
			selected = selected.includes(url) ? selected.filter((u) => u !== url) : [...selected, url];
			return;
		}
		value = url;
		onSelect?.(url);
		open = false;
	}

	function close() {
		open = false;
		selected = [];
		searchQuery = '';
	}

	const isVideo = $derived(value && (/\.(webm|mp4)$/i.test(value)));

	/** Normalize URL for comparison (leading slash consistent) */
	function normUrl(u: string | undefined): string {
		if (!u) return '';
		const t = u.trim();
		return t.startsWith('/') ? t : `/${t}`;
	}

	function isSelected(fileUrl: string): boolean {
		if (multiple) return selected.includes(fileUrl);
		const v = normUrl(value);
		return v !== '' && normUrl(fileUrl) === v;
	}

	function displayName(nameOrUrl: string): string {
		const raw = (nameOrUrl.split('/').pop() ?? nameOrUrl).split('\\').pop() ?? nameOrUrl;
		try {
			return decodeURIComponent(raw);
		} catch {
			return raw;
		}
	}

	function confirmMultiple() {
		values = [...selected];
		open = false;
		selected = [];
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	{#if value}
		<div class="flex items-center gap-2 rounded-none border border-border bg-muted/30 p-1.5">
			<span class="block size-14 shrink-0 overflow-hidden rounded-none bg-muted">
				{#if isVideo}
					<video
						src={value}
						preload="metadata"
						muted
						playsinline
						class="size-full object-cover"
					></video>
				{:else}
					<img src={value} alt="" class="size-full object-cover" />
				{/if}
			</span>
			<span class="max-w-[140px] truncate text-xs text-muted-foreground" title={value}>
				{value.split('/').pop() ?? value}
			</span>
		</div>
	{/if}
	<button
		type="button"
		class="rounded-none border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
		onclick={() => (open = true)}
	>
		{value ? 'Schimbă' : label}
	</button>
</div>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class={inline
			? 'mt-3 w-full rounded-none border border-border bg-background'
			: 'fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4'}
		role={inline ? 'region' : 'dialog'}
		aria-modal={inline ? undefined : true}
		aria-label="Selectează imagine din media"
		tabindex={inline ? undefined : -1}
		use:focusTrap={inline ? undefined : { initialFocus: false }}
		use:dialogBehavior={inline ? undefined : { onClose: close, backdrop: true, initialFocus: true }}
	>
		<div
			class={inline
				? 'max-h-[60vh] w-full overflow-hidden rounded-none bg-background flex flex-col'
				: 'max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-none border border-border bg-background shadow-xl flex flex-col'}
		>
			<div class="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3">
				<div class="flex items-center justify-between gap-2">
					<h2 class="text-lg font-semibold text-foreground">Bibliotecă media</h2>
					<button
						type="button"
						class="rounded-none p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
						onclick={close}
						aria-label="Închide"
					>
						<X class="size-5" />
					</button>
				</div>
				{#if !loading && !error && files.length > 0}
					<div class="relative">
						<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							class="rounded-none pl-9"
							placeholder="Caută după nume sau URL..."
							bind:value={searchQuery}
							aria-label="Caută în bibliotecă media"
						/>
					</div>
				{/if}
			</div>
			<div class="overflow-y-auto p-4">
				{#if loading}
					<p class="text-muted-foreground">Se încarcă...</p>
				{:else if error}
					<p class="text-sm text-destructive">{error}</p>
				{:else if files.length === 0}
					<p class="text-muted-foreground">Nicio imagine în bibliotecă. Încarcă din pagina Media.</p>
				{:else if filteredFiles.length === 0}
					<p class="text-muted-foreground">Niciun rezultat pentru „{searchQuery.trim() || '…'}”.</p>
				{:else}
					<ul class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
						{#each filteredFiles as file (file.url)}
							<li>
								<button
									type="button"
									class="relative block w-full rounded-none border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 {isSelected(file.url)
										? 'border-primary bg-primary/15 ring-2 ring-primary ring-offset-2'
										: 'border-border bg-muted/30 hover:border-primary hover:bg-primary/10'}"
									onclick={() => select(file.url)}
									aria-pressed={isSelected(file.url)}
								>
									<span class="block aspect-square overflow-hidden rounded-none">
										{#if file.name.endsWith('.webm') || file.name.endsWith('.mp4')}
											<video
												src={file.url}
												preload="metadata"
												muted
												playsinline
												class="h-full w-full object-cover"
											></video>
										{:else}
											<img
												src={file.url}
												alt={file.name}
												class="h-full w-full object-cover"
											/>
										{/if}
									</span>
									<span class="truncate block px-1 py-1 text-xs text-muted-foreground" title={displayName(file.name)}>
										{displayName(file.name)}
									</span>
									{#if isSelected(file.url)}
										<span class="absolute right-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
											Selectat
										</span>
									{/if}
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
			{#if multiple}
				<div class="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
					<p class="text-sm text-muted-foreground">{selected.length} selectate</p>
					<div class="flex gap-2">
						<Button type="button" variant="outline" class="rounded-none" onclick={close}>Anulare</Button>
						<Button type="button" class="rounded-none" onclick={confirmMultiple} disabled={selected.length === 0}>
							Inserează selectate
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
