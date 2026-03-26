<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { toastFromAction } from '$lib/client';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Avatar } from '$lib/components/ui/avatar';
	import MediaPicker from '$lib/components/cms/MediaPicker.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const BADGE_OPTIONS = [
		{ value: '', label: 'Fără badge' },
		{ value: 'early_bird', label: 'Early Bird' },
		{ value: 'new', label: 'Nou' }
	] as const;

	const STATUS_OPTIONS = [
		{ value: 'published', label: 'Publicat' },
		{ value: 'draft', label: 'Ciornă' }
	] as const;

const CATEGORY_OPTIONS = [
	{ value: 'enrichment', label: 'Enrichment' },
	{ value: 'family', label: 'Family' },
	{ value: 'children', label: 'Children' },
	{ value: 'teens', label: 'Teens' }
] as const;

	/** Etichete în română pentru secțiunile afișate pe pagina publică (fără ordine). */
	const SECTION_LABELS: Record<string, string> = {
		hero_highlights: 'Elemente hero',
		hero_cta: 'Butoane CTA hero',
		curriculum_areas: 'Arii curriculum',
		packages: 'Pachete',
		extracurricular: 'Extracurricular',
		benefits_family: 'Beneficii familie',
		benefits_main: 'Beneficii principale',
		benefits_secondary: 'Beneficii secundare',
		transport: 'Transport',
		menu: 'Meniu',
		location: 'Locație',
		testimonials: 'Testimoniale',
		enrollment: 'Înscriere'
	};

	let { data }: { data: import('./$types').PageData } = $props();

	let result = $state<{ success?: boolean; error?: string } | null>(null);
	let slug = $state('');
	let programLocation = $state('');
	let imageUrl = $state('');
	let videoUrl = $state('');
	let categoryId = $state('');
	let badge = $state('');
	let status = $state('published');
	let ro = $state({
		title: '',
		subtitle: '',
		description: '',
		ageRange: '',
		datesText: '',
		durationText: '',
		locationText: ''
	});
	type SectionRow = { section: string; locale: string; sortOrder: number; payload: Record<string, unknown> };
	let sections = $state<SectionRow[]>([]);
	/** Structured payloads per section index; used by typed editors (no raw JSON). */
	let sectionPayloads = $state<Record<string, unknown>[]>([]);
	let mentorIds = $state<number[]>([]);
	let mentorSearch = $state('');
	let loadedId = $state<number | null>(null);
	let sectionJsonError = $state<string | null>(null);
	/** Friendly editors: synced from section JSON on load, merged back on submit. */
	let galleryPayload = $state<{ title?: string; images: { url: string; alt?: string }[] }>({ title: '', images: [] });
	let introPayload = $state<{
		blocks: { title?: string; body: string }[];
		imageBetweenBlocks?: string;
		videoBetweenBlocks?: { provider?: 'youtube' | 'vimeo'; videoId?: string; title?: string };
	}>({
		blocks: [],
		imageBetweenBlocks: '',
		videoBetweenBlocks: { provider: 'youtube', videoId: '', title: '' }
	});
	let gallerySectionIndex = $state(-1);
	let introSectionIndex = $state(-1);
	let mediaPickerForImageIndex = $state<number | null>(null);
	let mediaPickerValue = $state('');
	let gallerySelectedIndexes = $state<number[]>([]);
	let bulkInsertPickerOpen = $state(false);
	let bulkInsertValues = $state<string[]>([]);

	/** Indexul secțiunii enrollment; pagina publică afișează doar secțiunile până la (inclusiv) enrollment. */
	const enrollmentSectionIndex = $derived(sections.findIndex((s) => s.section === 'enrollment'));
	/** Indici ai secțiunilor care apar pe pagina publică (până la enrollment inclusiv). */
	const visibleSectionIndices = $derived.by(() => {
		const idx = enrollmentSectionIndex;
		const set = new Set<number>();
		for (let i = 0; i < sections.length; i++) {
			if (idx < 0 || i <= idx) set.add(i);
		}
		return set;
	});

	const allMentors = $derived(data?.allMentors ?? []);
	const mentorFiltered = $derived(
		mentorSearch.trim()
			? allMentors.filter(
					(m) =>
						m.nameRo?.toLowerCase().includes(mentorSearch.toLowerCase()) ||
						m.nameEn?.toLowerCase().includes(mentorSearch.toLowerCase()) ||
						m.titleRo?.toLowerCase().includes(mentorSearch.toLowerCase())
				)
			: allMentors
	);

	$effect(() => {
		const d = data;
		if (!d?.program || d.program.id === loadedId) return;
		loadedId = d.program.id;
		slug = d.program.slug;
		programLocation = d.program.location ?? '';
		imageUrl = d.program.image ?? '';
		videoUrl = (d.program as { videoUrl?: string | null }).videoUrl ?? '';
		categoryId = d.program.categoryId;
		badge = d.program.badge ?? '';
		status = d.program.status;
		ro = {
			title: d.ro?.title ?? d.program.slug,
			subtitle: d.ro?.subtitle ?? '',
			description: d.ro?.description ?? '',
			ageRange: d.ro?.ageRange ?? '',
			datesText: d.ro?.datesText ?? '',
			durationText: d.ro?.durationText ?? '',
			locationText: d.ro?.locationText ?? ''
		};
		sections = Array.isArray(d.sections) ? d.sections : [];
		sectionPayloads = sections.map((s) => JSON.parse(JSON.stringify(s.payload)) as Record<string, unknown>);
		mentorIds = Array.isArray(d.mentorIds) ? [...d.mentorIds] : [];
		gallerySectionIndex = sections.findIndex((s) => s.section === 'gallery');
		introSectionIndex = sections.findIndex((s) => s.section === 'intro');
		if (gallerySectionIndex >= 0) {
			const p = sections[gallerySectionIndex].payload as { title?: string; images?: { url: string; alt?: string }[] };
			galleryPayload = { title: p.title ?? '', images: Array.isArray(p.images) ? p.images.map((i) => ({ url: i.url ?? '', alt: i.alt })) : [] };
		}
		if (introSectionIndex >= 0) {
			const p = sections[introSectionIndex].payload as {
				blocks?: { title?: string; body: string }[];
				imageBetweenBlocks?: string;
				videoBetweenBlocks?: { provider?: 'youtube' | 'vimeo'; videoId?: string; title?: string };
			};
			introPayload = {
				blocks: Array.isArray(p.blocks) ? p.blocks.map((b) => ({ title: b.title, body: b.body ?? '' })) : [],
				imageBetweenBlocks: p.imageBetweenBlocks ?? '',
				videoBetweenBlocks: {
					provider: p.videoBetweenBlocks?.provider ?? 'youtube',
					videoId: p.videoBetweenBlocks?.videoId ?? '',
					title: p.videoBetweenBlocks?.title ?? ''
				}
			};
		}
		mediaPickerForImageIndex = null;
		mediaPickerValue = '';
		gallerySelectedIndexes = [];
		bulkInsertPickerOpen = false;
		bulkInsertValues = [];
	});

	function updateSectionPayload(index: number, payload: Record<string, unknown>) {
		sectionPayloads = sectionPayloads.map((p, j) => (j === index ? payload : p));
	}

	function buildSectionsForSubmit(): SectionRow[] | null {
		sectionJsonError = null;
		const next: SectionRow[] = [];
		for (let i = 0; i < sections.length; i++) {
			try {
				if (i === gallerySectionIndex) {
					next.push({
						section: sections[i].section,
						locale: sections[i].locale,
						sortOrder: sections[i].sortOrder,
						payload: { title: galleryPayload.title || undefined, images: galleryPayload.images }
					});
				} else if (i === introSectionIndex) {
					next.push({
						section: sections[i].section,
						locale: sections[i].locale,
						sortOrder: sections[i].sortOrder,
						payload: {
							blocks: introPayload.blocks,
							imageBetweenBlocks: introPayload.imageBetweenBlocks || undefined,
							videoBetweenBlocks: introPayload.videoBetweenBlocks?.videoId
								? {
										provider: introPayload.videoBetweenBlocks.provider ?? 'youtube',
										videoId: introPayload.videoBetweenBlocks.videoId,
										title: introPayload.videoBetweenBlocks.title || undefined
									}
								: undefined
						}
					});
				} else {
					const p = sectionPayloads[i];
					if (typeof p !== 'object' || p === null) throw new Error('Payload must be an object');
					next.push({
						section: sections[i].section,
						locale: sections[i].locale,
						sortOrder: sections[i].sortOrder,
						payload: { ...p }
					});
				}
			} catch (err) {
				sectionJsonError = `Secțiune ${sections[i].section} (${sections[i].locale}): ${err instanceof Error ? err.message : 'Payload invalid'}`;
				return null;
			}
		}
		return next;
	}

	function getMediaName(url: string): string {
		if (!url) return 'Nicio imagine selectată';
		const name = url.split('/').pop() ?? url;
		try {
			return decodeURIComponent(name);
		} catch {
			return name;
		}
	}

	function toggleGallerySelection(index: number, checked: boolean) {
		if (checked) {
			if (!gallerySelectedIndexes.includes(index)) {
				gallerySelectedIndexes = [...gallerySelectedIndexes, index];
			}
			return;
		}
		gallerySelectedIndexes = gallerySelectedIndexes.filter((i) => i !== index);
	}

	function deleteSingleImage(index: number) {
		if (!confirm('Sigur vrei să ștergi această imagine?')) return;
		galleryPayload = {
			...galleryPayload,
			images: galleryPayload.images.filter((_, i) => i !== index)
		};
		gallerySelectedIndexes = gallerySelectedIndexes
			.filter((i) => i !== index)
			.map((i) => (i > index ? i - 1 : i));
		if (mediaPickerForImageIndex === index) {
			mediaPickerForImageIndex = null;
			mediaPickerValue = '';
		}
	}

	function deleteSelectedImages() {
		if (gallerySelectedIndexes.length === 0) return;
		if (!confirm(`Sigur vrei să ștergi ${gallerySelectedIndexes.length} imagini selectate?`)) return;
		const selectedSet = new Set(gallerySelectedIndexes);
		galleryPayload = {
			...galleryPayload,
			images: galleryPayload.images.filter((_, i) => !selectedSet.has(i))
		};
		gallerySelectedIndexes = [];
		mediaPickerForImageIndex = null;
		mediaPickerValue = '';
	}

	function openGalleryImagePicker(index: number) {
		mediaPickerForImageIndex = index;
		mediaPickerValue = galleryPayload.images[index]?.url ?? '';
	}

	function applyGalleryPickedImage() {
		if (mediaPickerForImageIndex === null) return;
		galleryPayload = {
			...galleryPayload,
			images: galleryPayload.images.map((im, k) =>
				k === mediaPickerForImageIndex ? { ...im, url: mediaPickerValue } : im
			)
		};
		mediaPickerForImageIndex = null;
		mediaPickerValue = '';
	}

	$effect(() => {
		if (bulkInsertValues.length === 0) return;
		galleryPayload = {
			...galleryPayload,
			images: [
				...galleryPayload.images,
				...bulkInsertValues
					.filter((url) => Boolean(url))
					.map((url) => ({ url, alt: undefined }))
			]
		};
		bulkInsertValues = [];
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const parsedSections = buildSectionsForSubmit();
		if (parsedSections === null) return;
		const payload = {
			slug,
			location: programLocation || null,
			image: imageUrl || null,
			videoUrl: videoUrl || null,
			categoryId,
			badge: badge || null,
			status,
			locales: {
				ro: {
					title: ro.title,
					subtitle: ro.subtitle || null,
					description: ro.description || null,
					ageRange: ro.ageRange || null,
					datesText: ro.datesText || null,
					durationText: ro.durationText || null,
					locationText: ro.locationText || null
				}
			},
			sections: parsedSections.length > 0 ? parsedSections : undefined,
			mentorIds: mentorIds.length > 0 ? mentorIds : undefined
		};
		const res = await fetch('/admin/api/cms', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type: 'program', id: data.program.id, payload })
		});
		const j = await res.json().catch(() => ({}));
		if (res.ok) {
			result = { success: true };
			toastFromAction({ success: true });
			await invalidateAll();
		} else {
			const err = (j as { error?: string }).error ?? 'Eroare la salvare';
			result = { error: err };
			toastFromAction({ error: err });
		}
	}
</script>

<svelte:head>
	<title>Editează: {data.program.slug} | Admin Programe</title>
</svelte:head>

<div>
	<a
		href="/admin/pages/programs"
		class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
	>
		<ArrowLeft class="size-4" />
		Înapoi la Programe
	</a>
	<h2 class="mt-4 text-2xl font-semibold text-foreground">
		Editează program: {data.program.slug}
	</h2>
	{#if result?.error}
		<p class="mt-2 text-sm text-destructive">{result.error}</p>
	{/if}
	{#if result?.success}
		<p class="mt-2 text-sm text-primary">Salvat cu succes.</p>
	{/if}

	<form onsubmit={handleSubmit} class="mt-6 space-y-8">
		<div class="rounded-none border border-border bg-card p-6">
			<h3 class="font-medium text-foreground">Informații generale</h3>
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<Label for="slug">Slug (URL)</Label>
					<Input id="slug" bind:value={slug} class="rounded-none" required />
				</div>
				<div class="space-y-2">
					<Label for="categoryId">Categorie</Label>
					<Select.Root type="single" bind:value={categoryId}>
						<Select.Trigger id="categoryId" class="w-full rounded-none">
							{CATEGORY_OPTIONS.find((o) => o.value === categoryId)?.label ?? 'Selectează categoria'}
						</Select.Trigger>
						<Select.Content>
							{#each CATEGORY_OPTIONS as opt (opt.value)}
								<Select.Item value={opt.value} label={opt.label}>
									{opt.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="space-y-2">
					<Label for="program-location">Locație (afișare în header)</Label>
					<Input
						id="program-location"
						bind:value={programLocation}
						class="rounded-none"
						placeholder="Ex: Moieciu de Sus / București"
					/>
				</div>
				<div class="space-y-2">
					<Label for="badge">Badge</Label>
					<Select.Root type="single" bind:value={badge}>
						<Select.Trigger id="badge" class="w-full rounded-none">
							{BADGE_OPTIONS.find((o) => o.value === (badge || ''))?.label ?? 'Fără badge'}
						</Select.Trigger>
						<Select.Content>
							{#each BADGE_OPTIONS as opt (opt.value)}
								<Select.Item value={opt.value} label={opt.label}>
									{opt.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="space-y-2">
					<Label for="status">Status</Label>
					<Select.Root type="single" bind:value={status}>
						<Select.Trigger id="status" class="w-full rounded-none">
							{STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status}
						</Select.Trigger>
						<Select.Content>
							{#each STATUS_OPTIONS as opt (opt.value)}
								<Select.Item value={opt.value} label={opt.label}>
									{opt.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="space-y-2">
					<Label>Imagine (poster / fallback)</Label>
					<MediaPicker bind:value={imageUrl} label="Selectează din Media" />
				</div>
				<div class="space-y-2">
					<Label>Video hero (opțional)</Label>
					<MediaPicker bind:value={videoUrl} label="Selectează video din Media" />
				</div>
			</div>
		</div>

		<div class="rounded-none border border-border bg-card p-6">
			<h3 class="font-medium text-foreground">Conținut</h3>
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				<div class="space-y-2 sm:col-span-2">
					<Label for="ro-title">Titlu</Label>
					<Input id="ro-title" bind:value={ro.title} class="rounded-none" required />
				</div>
				<div class="space-y-2 sm:col-span-2">
					<Label for="ro-subtitle">Subtitlu</Label>
					<Input id="ro-subtitle" bind:value={ro.subtitle} class="rounded-none" />
				</div>
				<div class="space-y-2 sm:col-span-2">
					<Label for="ro-description">Descriere</Label>
					<Textarea id="ro-description" bind:value={ro.description} class="rounded-none" rows={4} />
				</div>
				<div class="space-y-2">
					<Label for="ro-ageRange">Vârstă</Label>
					<Input id="ro-ageRange" bind:value={ro.ageRange} class="rounded-none" />
				</div>
				<div class="space-y-2">
					<Label for="ro-datesText">Text perioadă</Label>
					<Input id="ro-datesText" bind:value={ro.datesText} class="rounded-none" />
				</div>
				<div class="space-y-2">
					<Label for="ro-durationText">Text durată</Label>
					<Input id="ro-durationText" bind:value={ro.durationText} class="rounded-none" />
				</div>
				<div class="space-y-2">
					<Label for="ro-locationText">Locație</Label>
					<Input id="ro-locationText" bind:value={ro.locationText} class="rounded-none" />
				</div>
			</div>
		</div>

		<div class="rounded-none border border-border bg-card p-6">
			<h3 class="font-medium text-foreground">Mentori</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				Selectează mentorii afișați pe pagina acestui program. Ordinea de mai jos este cea de afișare.
			</p>
			<div class="mt-3">
				<Input
					type="search"
					placeholder="Caută după nume sau titlu..."
					class="mb-3 max-w-xs rounded-none"
					bind:value={mentorSearch}
				/>
			</div>
			<div class="mt-2 max-h-80 overflow-y-auto rounded-none border border-border bg-muted/20 p-3 space-y-2">
				{#each mentorFiltered as m (m.id)}
					<label
						class="flex cursor-pointer items-center gap-4 rounded-none border border-border bg-card p-3 transition-colors hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
					>
						<input
							type="checkbox"
							checked={mentorIds.includes(m.id)}
							onchange={(e) => {
								const checked = (e.currentTarget as HTMLInputElement).checked;
								if (checked) mentorIds = [...mentorIds, m.id];
								else mentorIds = mentorIds.filter((id) => id !== m.id);
							}}
							class="h-4 w-4 shrink-0 rounded border-input"
						/>
						<Avatar src={m.image} alt={m.nameRo ?? ''} size="lg" class="shrink-0 rounded-none" />
						<div class="min-w-0 flex-1">
							<span class="font-medium text-foreground block">{m.nameRo}</span>
							{#if m.titleRo}
								<span class="text-sm text-muted-foreground">{m.titleRo}</span>
							{/if}
						</div>
					</label>
				{/each}
			</div>
			<p class="mt-2 text-sm text-muted-foreground">{mentorIds.length} selectați</p>
		</div>

		<div class="rounded-none border border-border bg-card p-6">
			<h3 class="font-medium text-foreground">Secțiuni pagină detaliu</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				{visibleSectionIndices.size} secțiuni (cele afișate pe pagină). Toate se editează prin câmpuri.
			</p>
			{#if sectionJsonError}
				<p class="mt-2 text-sm text-destructive">{sectionJsonError}</p>
			{/if}
			<div class="mt-4 space-y-4">
				{#if gallerySectionIndex >= 0 && (enrollmentSectionIndex < 0 || gallerySectionIndex <= enrollmentSectionIndex)}
					<details id="sec-gallery" class="rounded-none border border-border bg-muted/10" open>
						<summary class="cursor-pointer list-none px-3 py-2 font-medium text-foreground hover:bg-muted/20">
							Galerie foto
						</summary>
						<div class="border-t border-border p-4 space-y-4">
							<div class="space-y-2">
								<Label>Titlu galerie</Label>
								<Input class="rounded-none" bind:value={galleryPayload.title} />
							</div>
							<div class="space-y-2">
								<Label>Imagini</Label>
								<div class="flex flex-wrap gap-2">
									<Button
										type="button"
										variant="outline"
										class="rounded-none"
										onclick={() => (bulkInsertPickerOpen = !bulkInsertPickerOpen)}
									>
										Inserează mai multe din Media
									</Button>
									<Button
										type="button"
										variant="outline"
										class="rounded-none"
										disabled={gallerySelectedIndexes.length === 0}
										onclick={deleteSelectedImages}
									>
										Șterge selectate ({gallerySelectedIndexes.length})
									</Button>
								</div>
								{#if bulkInsertPickerOpen}
									<MediaPicker
										bind:open={bulkInsertPickerOpen}
										bind:values={bulkInsertValues}
										inline
										multiple
										label="Inserează imagini"
									/>
								{/if}
								{#each galleryPayload.images as img, imgIdx (imgIdx)}
									<div class="rounded-none border border-border bg-card p-3">
										<div class="flex gap-3 flex-wrap items-center">
											<div
												class="h-20 w-28 shrink-0 overflow-hidden rounded-none border border-border bg-muted/20 flex items-center justify-center"
											>
												{#if img.url}
													<img src={img.url} alt={img.alt || `Galerie ${imgIdx + 1}`} class="h-full w-full object-cover" />
												{:else}
													<span class="px-2 text-center text-xs text-muted-foreground">Neselectată</span>
												{/if}
											</div>
											<div class="min-w-[220px] flex-1">
												<p class="text-sm font-medium text-foreground">Imagine {imgIdx + 1}</p>
												<p class="text-xs text-muted-foreground truncate">{getMediaName(img.url)}</p>
											</div>
											<div class="flex gap-2">
												<label class="inline-flex items-center gap-2 text-xs text-muted-foreground">
													<input
														type="checkbox"
														checked={gallerySelectedIndexes.includes(imgIdx)}
														onchange={(e) =>
															toggleGallerySelection(imgIdx, (e.currentTarget as HTMLInputElement).checked)}
													/>
													Selectează
												</label>
												<Button
													type="button"
													variant="outline"
													class="rounded-none shrink-0"
													onclick={() => openGalleryImagePicker(imgIdx)}
												>
													Schimbă
												</Button>
												<Button
													type="button"
													variant="outline"
													class="rounded-none shrink-0"
													onclick={() => deleteSingleImage(imgIdx)}
												>
													Șterge
												</Button>
											</div>
										</div>
										<div class="mt-3">
											<Input class="rounded-none" placeholder="Alt (opțional)" bind:value={img.alt} />
										</div>
									</div>
								{/each}
								<Button
									type="button"
									variant="outline"
									class="rounded-none"
									onclick={() => {
										galleryPayload = {
											...galleryPayload,
											images: [...galleryPayload.images, { url: '', alt: undefined }]
										};
									}}
								>
									Adaugă imagine
								</Button>
							</div>
						</div>
					</details>
				{/if}
				{#if introSectionIndex >= 0 && (enrollmentSectionIndex < 0 || introSectionIndex <= enrollmentSectionIndex)}
					<details id="sec-intro" class="rounded-none border border-border bg-muted/10" open>
						<summary class="cursor-pointer list-none px-3 py-2 font-medium text-foreground hover:bg-muted/20">
							Intro (blocuri text)
						</summary>
						<div class="border-t border-border p-4 space-y-4">
							<div class="space-y-2">
								<Label>Imagine între blocuri (după primul bloc)</Label>
								<MediaPicker bind:value={introPayload.imageBetweenBlocks} label="Selectează imagine" />
							</div>
							<div class="rounded-none border border-border p-3 bg-card space-y-2">
								<Label>Video între blocuri (după primul bloc)</Label>
								<p class="text-xs text-muted-foreground">
									Se folosește dacă există Video ID. Exemplu YouTube: `fFiueIdMwPM`
								</p>
								<Select.Root
									type="single"
									value={introPayload.videoBetweenBlocks?.provider ?? 'youtube'}
									onValueChange={(v) => {
										introPayload = {
											...introPayload,
											videoBetweenBlocks: {
												provider: (v === 'vimeo' ? 'vimeo' : 'youtube') as 'youtube' | 'vimeo',
												videoId: introPayload.videoBetweenBlocks?.videoId ?? '',
												title: introPayload.videoBetweenBlocks?.title ?? ''
											}
										};
									}}
								>
									<Select.Trigger class="w-full rounded-none">
										{(introPayload.videoBetweenBlocks?.provider ?? 'youtube') === 'vimeo'
											? 'Vimeo'
											: 'YouTube'}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="youtube" label="YouTube">YouTube</Select.Item>
										<Select.Item value="vimeo" label="Vimeo">Vimeo</Select.Item>
									</Select.Content>
								</Select.Root>
								<Input
									class="rounded-none"
									placeholder="Video ID"
									value={introPayload.videoBetweenBlocks?.videoId ?? ''}
									oninput={(e) => {
										const videoId = (e.currentTarget as HTMLInputElement).value;
										introPayload = {
											...introPayload,
											videoBetweenBlocks: {
												provider: introPayload.videoBetweenBlocks?.provider ?? 'youtube',
												videoId,
												title: introPayload.videoBetweenBlocks?.title ?? ''
											}
										};
									}}
								/>
								<Input
									class="rounded-none"
									placeholder="Titlu video (opțional)"
									value={introPayload.videoBetweenBlocks?.title ?? ''}
									oninput={(e) => {
										const title = (e.currentTarget as HTMLInputElement).value;
										introPayload = {
											...introPayload,
											videoBetweenBlocks: {
												provider: introPayload.videoBetweenBlocks?.provider ?? 'youtube',
												videoId: introPayload.videoBetweenBlocks?.videoId ?? '',
												title
											}
										};
									}}
								/>
							</div>
							{#each introPayload.blocks as block, bi (bi)}
								<div class="space-y-2 rounded-none border border-border p-3 bg-card">
									<Label>Bloc {bi + 1} — Text</Label>
									<Textarea class="rounded-none min-h-[80px]" bind:value={block.body} rows={3} />
								</div>
							{/each}
						</div>
					</details>
				{/if}
				{#each sections as section, i (`${section.section}-${section.locale}-${i}`)}
					{#if section.section !== 'gallery' && section.section !== 'intro' && visibleSectionIndices.has(i)}
						{@const p = sectionPayloads[i] ?? {}}
						<details id="sec-{section.section}" class="rounded-none border border-border bg-muted/10">
							<summary class="cursor-pointer list-none px-3 py-2 font-medium text-foreground hover:bg-muted/20">
								{SECTION_LABELS[section.section] ?? section.section}
							</summary>
							<div class="border-t border-border p-4 space-y-4">
								{#if section.section === 'hero_highlights'}
									{@const payload = p as { items?: string[] }}
									<Label>Elemente hero</Label>
									{#each (payload.items ?? []) as _, j}
										<Input
											class="rounded-none"
											value={payload.items?.[j] ?? ''}
											oninput={(e) => {
												const v = (e.currentTarget as HTMLInputElement).value;
												const items = [...(payload.items ?? [])];
												items[j] = v;
												updateSectionPayload(i, { ...payload, items });
											}}
										/>
									{/each}
									<Button
										type="button"
										variant="outline"
										class="rounded-none"
										onclick={() => updateSectionPayload(i, { ...payload, items: [...(payload.items ?? []), ''] })}
									>
										Adaugă element
									</Button>
								{:else if section.section === 'hero_cta'}
									{@const payload = p as { buttons?: { label: string; type: string; value?: string; href?: string }[] }}
									<Label>Butoane CTA</Label>
									{#each (payload.buttons ?? []) as btn, bi}
										<div class="rounded-none border border-border p-3 space-y-2">
											<Input class="rounded-none" placeholder="Label" value={btn.label} oninput={(e) => {
												const v = (e.currentTarget as HTMLInputElement).value;
												const buttons = [...(payload.buttons ?? [])];
												buttons[bi] = { ...buttons[bi], label: v };
												updateSectionPayload(i, { ...payload, buttons });
											}} />
											<Select.Root
												type="single"
												value={btn.type}
												onValueChange={(v) => {
													const buttons = [...(payload.buttons ?? [])];
													buttons[bi] = { ...buttons[bi], type: v };
													updateSectionPayload(i, { ...payload, buttons });
												}}
											>
												<Select.Trigger class="w-full rounded-none">
													{btn.type === 'tel' ? 'Telefon' : 'Link'}
												</Select.Trigger>
												<Select.Content>
													<Select.Item value="tel" label="Telefon">Telefon</Select.Item>
													<Select.Item value="link" label="Link">Link</Select.Item>
												</Select.Content>
											</Select.Root>
											{#if btn.type === 'tel'}
												<Input class="rounded-none" placeholder="Număr (value)" value={btn.value ?? ''} oninput={(e) => {
													const v = (e.currentTarget as HTMLInputElement).value;
													const buttons = [...(payload.buttons ?? [])];
													buttons[bi] = { ...buttons[bi], value: v };
													updateSectionPayload(i, { ...payload, buttons });
												}} />
											{:else}
												<Input class="rounded-none" placeholder="Href" value={btn.href ?? ''} oninput={(e) => {
													const v = (e.currentTarget as HTMLInputElement).value;
													const buttons = [...(payload.buttons ?? [])];
													buttons[bi] = { ...buttons[bi], href: v };
													updateSectionPayload(i, { ...payload, buttons });
												}} />
											{/if}
										</div>
									{/each}
									<Button type="button" variant="outline" class="rounded-none" onclick={() => updateSectionPayload(i, { ...payload, buttons: [...(payload.buttons ?? []), { label: '', type: 'link', href: '/contact' }] }) }>Adaugă buton</Button>
								{:else if section.section === 'curriculum_areas'}
									{@const payload = p as { title?: string; areas?: { title: string }[] }}
									<Label>Titlu</Label>
									<Input class="rounded-none" value={payload.title ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, title: (e.currentTarget as HTMLInputElement).value })} />
									<Label>Arii</Label>
									{#each (payload.areas ?? []) as area, ai}
										<Input class="rounded-none" value={area.title} oninput={(e) => {
											const v = (e.currentTarget as HTMLInputElement).value;
											const areas = [...(payload.areas ?? [])];
											areas[ai] = { title: v };
											updateSectionPayload(i, { ...payload, areas });
										}} placeholder="Titlu arie" />
									{/each}
									<Button type="button" variant="outline" class="rounded-none" onclick={() => updateSectionPayload(i, { ...payload, areas: [...(payload.areas ?? []), { title: '' }] }) }>Adaugă arie</Button>
								{:else if section.section === 'packages'}
									{@const payload = p as { title?: string; packages?: { title: string; items: string[] }[]; note?: string }}
									<Label>Titlu</Label>
									<Input class="rounded-none" value={payload.title ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, title: (e.currentTarget as HTMLInputElement).value })} />
									<Label>Notă</Label>
									<Input class="rounded-none" value={payload.note ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, note: (e.currentTarget as HTMLInputElement).value })} />
									{#each (payload.packages ?? []) as pkg, pi}
										<div class="rounded-none border border-border p-3 space-y-2">
											<Label>Pachet {pi + 1} — titlu</Label>
											<Input class="rounded-none" value={pkg.title} oninput={(e) => {
												const v = (e.currentTarget as HTMLInputElement).value;
												const packages = [...(payload.packages ?? [])];
												packages[pi] = { ...packages[pi], title: v };
												updateSectionPayload(i, { ...payload, packages });
											}} />
											<Label>Elemente (câte unul per linie)</Label>
											<Textarea class="rounded-none min-h-[80px]" value={(pkg.items ?? []).join('\n')} oninput={(e) => {
												const v = (e.currentTarget as HTMLTextAreaElement).value;
												const items = v.split('\n').map((s) => s.trim()).filter(Boolean);
												const packages = [...(payload.packages ?? [])];
												packages[pi] = { ...packages[pi], items };
												updateSectionPayload(i, { ...payload, packages });
											}} />
										</div>
									{/each}
									<Button type="button" variant="outline" class="rounded-none" onclick={() => updateSectionPayload(i, { ...payload, packages: [...(payload.packages ?? []), { title: '', items: [] }] }) }>Adaugă pachet</Button>
								{:else if section.section === 'extracurricular'}
									{@const payload = p as { title?: string; groups?: { title: string; subtitle?: string; items: string[] }[]; methods?: string }}
									<Label>Titlu</Label>
									<Input class="rounded-none" value={payload.title ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, title: (e.currentTarget as HTMLInputElement).value })} />
									<Label>Metode</Label>
									<Textarea class="rounded-none" value={payload.methods ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, methods: (e.currentTarget as HTMLTextAreaElement).value })} />
									{#each (payload.groups ?? []) as grp, gi}
										<div class="rounded-none border border-border p-3 space-y-2">
											<Label>Grup {gi + 1}</Label>
											<Input class="rounded-none" placeholder="Titlu" value={grp.title} oninput={(e) => {
												const v = (e.currentTarget as HTMLInputElement).value;
												const groups = [...(payload.groups ?? [])];
												groups[gi] = { ...groups[gi], title: v };
												updateSectionPayload(i, { ...payload, groups });
											}} />
											<Input class="rounded-none" placeholder="Subtitlu" value={grp.subtitle ?? ''} oninput={(e) => {
												const v = (e.currentTarget as HTMLInputElement).value;
												const groups = [...(payload.groups ?? [])];
												groups[gi] = { ...groups[gi], subtitle: v };
												updateSectionPayload(i, { ...payload, groups });
											}} />
											<Textarea class="rounded-none min-h-[60px]" placeholder="Elemente, câte unul per linie" value={(grp.items ?? []).join('\n')} oninput={(e) => {
												const v = (e.currentTarget as HTMLTextAreaElement).value;
												const items = v.split('\n').map((s) => s.trim()).filter(Boolean);
												const groups = [...(payload.groups ?? [])];
												groups[gi] = { ...groups[gi], items };
												updateSectionPayload(i, { ...payload, groups });
											}} />
										</div>
									{/each}
									<Button type="button" variant="outline" class="rounded-none" onclick={() => updateSectionPayload(i, { ...payload, groups: [...(payload.groups ?? []), { title: '', items: [] }] }) }>Adaugă grup</Button>
								{:else if section.section === 'benefits_family' || section.section === 'benefits_main' || section.section === 'benefits_secondary'}
									{@const payload = p as { title?: string; items?: string[]; note?: string; other?: string; otherItems?: string[]; image?: string } }
									<Label>Titlu</Label>
									<Input class="rounded-none" value={payload.title ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, title: (e.currentTarget as HTMLInputElement).value })} />
									<Label>Elemente</Label>
									{#each (payload.items ?? []) as _, j}
										<Input class="rounded-none" value={payload.items?.[j] ?? ''} oninput={(e) => {
											const v = (e.currentTarget as HTMLInputElement).value;
											const items = [...(payload.items ?? [])];
											items[j] = v;
											updateSectionPayload(i, { ...payload, items });
										}} />
									{/each}
									<Button type="button" variant="outline" class="rounded-none" onclick={() => updateSectionPayload(i, { ...payload, items: [...(payload.items ?? []), ''] }) }>Adaugă</Button>
									{#if section.section === 'benefits_main'}
										<Label>Imagine (opțional)</Label>
										<MediaPicker
											value={(payload as { image?: string }).image ?? ''}
											label="Selectează imagine din Media"
											onSelect={(value) =>
												updateSectionPayload(i, {
													...payload,
													image: value || undefined
												})}
										/>
									{/if}
									{#if section.section === 'benefits_family'}
										<Label>Notă</Label>
										<Input class="rounded-none" value={payload.note ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, note: (e.currentTarget as HTMLInputElement).value })} />
										<Label>Alte (titlu)</Label>
										<Input class="rounded-none" value={payload.other ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, other: (e.currentTarget as HTMLInputElement).value })} />
										<Label>Alte elemente</Label>
										{#each (payload.otherItems ?? []) as _, oj}
											<Input class="rounded-none" value={payload.otherItems?.[oj] ?? ''} oninput={(e) => {
												const v = (e.currentTarget as HTMLInputElement).value;
												const otherItems = [...(payload.otherItems ?? [])];
												otherItems[oj] = v;
												updateSectionPayload(i, { ...payload, otherItems });
											}} />
										{/each}
										<Button type="button" variant="outline" class="rounded-none" onclick={() => updateSectionPayload(i, { ...payload, otherItems: [...(payload.otherItems ?? []), ''] }) }>Adaugă</Button>
									{/if}
								{:else if section.section === 'transport'}
									{@const payload = p as { title?: string; body?: string; contact?: string }}
									<Label>Titlu</Label>
									<Input class="rounded-none" value={payload.title ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, title: (e.currentTarget as HTMLInputElement).value })} />
									<Label>Text</Label>
									<Textarea class="rounded-none min-h-[100px]" value={payload.body ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, body: (e.currentTarget as HTMLTextAreaElement).value })} />
									<Label>Contact</Label>
									<Input class="rounded-none" value={payload.contact ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, contact: (e.currentTarget as HTMLInputElement).value })} />
								{:else if section.section === 'menu'}
									{@const payload = p as { title?: string; body?: string; note?: string }}
									<Label>Titlu</Label>
									<Input class="rounded-none" value={payload.title ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, title: (e.currentTarget as HTMLInputElement).value })} />
									<Label>Text</Label>
									<Textarea class="rounded-none min-h-[100px]" value={payload.body ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, body: (e.currentTarget as HTMLTextAreaElement).value })} />
									<Label>Notă</Label>
									<Input class="rounded-none" value={payload.note ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, note: (e.currentTarget as HTMLInputElement).value })} />
								{:else if section.section === 'location'}
									{@const payload = p as { title?: string; subtitle?: string; body?: string; amenities?: string[]; closing?: string; image?: string; images?: string[]; mapEmbedUrl?: string } }
									<Label>Titlu</Label>
									<Input class="rounded-none" value={payload.title ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, title: (e.currentTarget as HTMLInputElement).value })} />
									<Label>Imagine principală</Label>
									<MediaPicker
										value={payload.image ?? ''}
										label="Selectează imagine principală"
										onSelect={(value) => updateSectionPayload(i, { ...payload, image: value || undefined })}
									/>
									<Label>Imagini grilă (3 pe rând, opțional)</Label>
									{#each (payload.images ?? []) as imgUrl, imgIdx}
										<div class="flex gap-2 items-center">
											<MediaPicker
												value={imgUrl}
												label={`Imagine grilă ${imgIdx + 1}`}
												onSelect={(value) => {
													const images = [...(payload.images ?? [])];
													images[imgIdx] = value;
													updateSectionPayload(i, { ...payload, images });
												}}
											/>
											<Button
												type="button"
												variant="outline"
												class="rounded-none shrink-0"
												onclick={() => {
													const images = (payload.images ?? []).filter((_, k) => k !== imgIdx);
													updateSectionPayload(i, { ...payload, images });
												}}
											>
												Șterge
											</Button>
										</div>
									{/each}
									<Button
										type="button"
										variant="outline"
										class="rounded-none"
										onclick={() =>
											updateSectionPayload(i, {
												...payload,
												images: [...(payload.images ?? []), '']
											})
										}
									>
										Adaugă imagine grilă
									</Button>
									<Label>Google Maps embed URL</Label>
									<Input
										class="rounded-none"
										placeholder="https://www.google.com/maps/embed?pb=..."
										value={payload.mapEmbedUrl ?? ''}
										oninput={(e) =>
											updateSectionPayload(i, {
												...payload,
												mapEmbedUrl: (e.currentTarget as HTMLInputElement).value.trim() || undefined
											})
										}
									/>
									<Label>Subtitlu</Label>
									<Input class="rounded-none" value={payload.subtitle ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, subtitle: (e.currentTarget as HTMLInputElement).value })} />
									<Label>Text</Label>
									<Textarea class="rounded-none min-h-[80px]" value={payload.body ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, body: (e.currentTarget as HTMLTextAreaElement).value })} />
									<Label>Facilități</Label>
									{#each (payload.amenities ?? []) as _, aj}
										<Input class="rounded-none" value={payload.amenities?.[aj] ?? ''} oninput={(e) => {
											const v = (e.currentTarget as HTMLInputElement).value;
											const amenities = [...(payload.amenities ?? [])];
											amenities[aj] = v;
											updateSectionPayload(i, { ...payload, amenities });
										}} />
									{/each}
									<Button type="button" variant="outline" class="rounded-none" onclick={() => updateSectionPayload(i, { ...payload, amenities: [...(payload.amenities ?? []), ''] }) }>Adaugă</Button>
									<Label>Încheiere</Label>
									<Textarea class="rounded-none" value={payload.closing ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, closing: (e.currentTarget as HTMLTextAreaElement).value })} />
								{:else if section.section === 'testimonials'}
									{@const payload = p as { title?: string; items?: { videoId?: string; provider?: string; title?: string; quote?: string; author?: string }[] }}
									<Label>Titlu</Label>
									<Input class="rounded-none" value={payload.title ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, title: (e.currentTarget as HTMLInputElement).value })} />
									{#each (payload.items ?? []) as item, ti}
										<div class="rounded-none border border-border p-3 space-y-2">
											<Label>Testimonial {ti + 1}</Label>
											<Input class="rounded-none" placeholder="Video ID" value={item.videoId ?? ''} oninput={(e) => {
												const v = (e.currentTarget as HTMLInputElement).value;
												const items = [...(payload.items ?? [])];
												items[ti] = { ...items[ti], videoId: v };
												updateSectionPayload(i, { ...payload, items });
											}} />
											<Select.Root
												type="single"
												value={item.provider ?? 'youtube'}
												onValueChange={(v) => {
													const items = [...(payload.items ?? [])];
													items[ti] = { ...items[ti], provider: v };
													updateSectionPayload(i, { ...payload, items });
												}}
											>
												<Select.Trigger class="w-full rounded-none">
													{(item.provider ?? 'youtube') === 'vimeo' ? 'Vimeo' : 'YouTube'}
												</Select.Trigger>
												<Select.Content>
													<Select.Item value="youtube" label="YouTube">YouTube</Select.Item>
													<Select.Item value="vimeo" label="Vimeo">Vimeo</Select.Item>
												</Select.Content>
											</Select.Root>
											<Input class="rounded-none" placeholder="Titlu" value={item.title ?? ''} oninput={(e) => {
												const v = (e.currentTarget as HTMLInputElement).value;
												const items = [...(payload.items ?? [])];
												items[ti] = { ...items[ti], title: v };
												updateSectionPayload(i, { ...payload, items });
											}} />
										</div>
									{/each}
									<Button type="button" variant="outline" class="rounded-none" onclick={() => updateSectionPayload(i, { ...payload, items: [...(payload.items ?? []), { provider: 'youtube' }] }) }>Adaugă</Button>
								{:else if section.section === 'enrollment'}
									{@const payload = p as { title?: string; intro?: string; steps?: { order: number; label: string }[]; contactNote?: string; buttons?: { label: string; type: string; value?: string; href?: string }[] }}
									<Label>Titlu</Label>
									<Input class="rounded-none" value={payload.title ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, title: (e.currentTarget as HTMLInputElement).value })} />
									<Label>Intro</Label>
									<Textarea class="rounded-none" value={payload.intro ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, intro: (e.currentTarget as HTMLTextAreaElement).value })} />
									<Label>Pași</Label>
									{#each (payload.steps ?? []) as step, si}
										<div class="flex gap-2">
											<Input type="number" class="rounded-none w-16" value={step.order} oninput={(e) => {
												const v = parseInt((e.currentTarget as HTMLInputElement).value, 10) || 0;
												const steps = [...(payload.steps ?? [])];
												steps[si] = { ...steps[si], order: v };
												updateSectionPayload(i, { ...payload, steps });
											}} />
											<Input class="rounded-none flex-1" value={step.label} oninput={(e) => {
												const v = (e.currentTarget as HTMLInputElement).value;
												const steps = [...(payload.steps ?? [])];
												steps[si] = { ...steps[si], label: v };
												updateSectionPayload(i, { ...payload, steps });
											}} placeholder="Label" />
										</div>
									{/each}
									<Button type="button" variant="outline" class="rounded-none" onclick={() => updateSectionPayload(i, { ...payload, steps: [...(payload.steps ?? []), { order: (payload.steps?.length ?? 0) + 1, label: '' }] }) }>Adaugă pas</Button>
									<Label>Notă contact</Label>
									<Input class="rounded-none" value={payload.contactNote ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, contactNote: (e.currentTarget as HTMLInputElement).value })} />
									<Label>Butoane</Label>
									{#each (payload.buttons ?? []) as btn, bi}
										<div class="rounded-none border border-border p-2 space-y-1">
											<Input class="rounded-none" placeholder="Label" value={btn.label} oninput={(e) => {
												const v = (e.currentTarget as HTMLInputElement).value;
												const buttons = [...(payload.buttons ?? [])];
												buttons[bi] = { ...buttons[bi], label: v };
												updateSectionPayload(i, { ...payload, buttons });
											}} />
											<Select.Root
												type="single"
												value={btn.type}
												onValueChange={(v) => {
													const buttons = [...(payload.buttons ?? [])];
													buttons[bi] = { ...buttons[bi], type: v };
													updateSectionPayload(i, { ...payload, buttons });
												}}
											>
												<Select.Trigger class="w-full rounded-none">
													{btn.type === 'tel' ? 'Telefon' : 'Link'}
												</Select.Trigger>
												<Select.Content>
													<Select.Item value="tel" label="Telefon">Telefon</Select.Item>
													<Select.Item value="link" label="Link">Link</Select.Item>
												</Select.Content>
											</Select.Root>
											{#if btn.type === 'tel'}
												<Input class="rounded-none" placeholder="Număr" value={btn.value ?? ''} oninput={(e) => {
													const v = (e.currentTarget as HTMLInputElement).value;
													const buttons = [...(payload.buttons ?? [])];
													buttons[bi] = { ...buttons[bi], value: v };
													updateSectionPayload(i, { ...payload, buttons });
												}} />
											{:else}
												<Input class="rounded-none" placeholder="Href" value={btn.href ?? ''} oninput={(e) => {
													const v = (e.currentTarget as HTMLInputElement).value;
													const buttons = [...(payload.buttons ?? [])];
													buttons[bi] = { ...buttons[bi], href: v };
													updateSectionPayload(i, { ...payload, buttons });
												}} />
											{/if}
										</div>
									{/each}
									<Button type="button" variant="outline" class="rounded-none" onclick={() => updateSectionPayload(i, { ...payload, buttons: [...(payload.buttons ?? []), { label: '', type: 'link', href: '/contact' }] }) }>Adaugă buton</Button>
								{:else if section.section === 'video_links'}
									{@const payload = p as { title?: string; links?: { label: string; url: string }[] }}
									<Label>Titlu</Label>
									<Input class="rounded-none" value={payload.title ?? ''} oninput={(e) => updateSectionPayload(i, { ...payload, title: (e.currentTarget as HTMLInputElement).value })} />
									{#each (payload.links ?? []) as link, li}
										<div class="flex gap-2">
											<Input class="rounded-none" placeholder="Label" value={link.label} oninput={(e) => {
												const v = (e.currentTarget as HTMLInputElement).value;
												const links = [...(payload.links ?? [])];
												links[li] = { ...links[li], label: v };
												updateSectionPayload(i, { ...payload, links });
											}} />
											<Input class="rounded-none flex-1" placeholder="URL" value={link.url} oninput={(e) => {
												const v = (e.currentTarget as HTMLInputElement).value;
												const links = [...(payload.links ?? [])];
												links[li] = { ...links[li], url: v };
												updateSectionPayload(i, { ...payload, links });
											}} />
										</div>
									{/each}
									<Button type="button" variant="outline" class="rounded-none" onclick={() => updateSectionPayload(i, { ...payload, links: [...(payload.links ?? []), { label: '', url: '' }] }) }>Adaugă link</Button>
								{:else}
									<p class="text-sm text-muted-foreground">Secțiune fără editor dedicat.</p>
								{/if}
							</div>
						</details>
					{/if}
				{/each}
			</div>
			{#if mediaPickerForImageIndex !== null}
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
					<div class="rounded-none border border-border bg-card p-4 max-w-lg w-full mx-4">
						<p class="font-medium mb-2">Selectează imagine pentru poziția {mediaPickerForImageIndex + 1}</p>
						<MediaPicker bind:value={mediaPickerValue} label="Selectează din Media" />
						<div class="mt-4 flex gap-2">
							<Button type="button" class="rounded-none" onclick={applyGalleryPickedImage}>
								OK
							</Button>
							<Button
								type="button"
								variant="outline"
								class="rounded-none"
								onclick={() => {
									mediaPickerForImageIndex = null;
									mediaPickerValue = '';
								}}
							>
								Anulare
							</Button>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="flex gap-2">
			<Button type="submit" class="rounded-none">Salvează</Button>
			<Button type="button" variant="outline" class="rounded-none" href="/admin/pages/programs">
				Anulare
			</Button>
		</div>
	</form>
</div>
