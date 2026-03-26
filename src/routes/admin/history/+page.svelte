<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let { data }: { data: import('./$types').PageData } = $props();

	const INITIAL_USER_VALUE = '__initial__';
	const ALL_USERS_VALUE = '__all__';
	let expandedId = $state<number | null>(null);
	let selectedUser = $state<string>(INITIAL_USER_VALUE);
	const effectiveUser = $derived(selectedUser === INITIAL_USER_VALUE ? (data.filters.userName ?? '') : selectedUser);
	const selectValue = $derived(effectiveUser || ALL_USERS_VALUE);

	const PAGE_LABELS: Record<string, string> = {
		home: 'Home',
		about: 'Despre',
		programs: 'Programe',
		mentors: 'Mentori',
		contact: 'Contact',
		blog: 'Blog'
	};

	const FIELD_LABELS: Record<string, string> = {
		body: 'Text principal',
		heading: 'Titlu',
		title: 'Titlu',
		text: 'Text',
		label: 'Etichetă',
		lead: 'Introducere',
		intro: 'Intro',
		greeting: 'Salut',
		p1: 'Paragraf 1',
		p2: 'Paragraf 2',
		p3: 'Paragraf 3',
		visionTitle: 'Titlu viziune',
		visionBody: 'Text viziune',
		tagline: 'Slogan',
		subline: 'Text sub titlu',
		ctaLabel: 'Text buton',
		videoUrl: 'URL video',
		posterUrl: 'URL poster',
		image: 'Imagine',
		nameRo: 'Nume (RO)',
		bioRo: 'Bio (RO)',
		email: 'Email',
		phone: 'Telefon',
		address: 'Adresă'
	};

	function formatDate(d: Date | string) {
		const dt = typeof d === 'string' ? new Date(d) : d;
		return dt.toLocaleString('ro-RO', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	type Entry = (typeof data.entries)[number];
	type DiffRow = { field: string; before: string; after: string };
	type ActionPayload = {
		summary?: string;
		actionKey?: string | null;
		method?: string;
		pathname?: string;
		status?: number;
		outcome?: 'success' | 'error';
		searchParams?: Record<string, string>;
		at?: string;
	};

	const ACTION_LABELS: Record<string, string> = {
		create: 'Creare',
		update: 'Actualizare',
		delete: 'Ștergere',
		upload: 'Upload',
		replace: 'Înlocuire',
		execute: 'Acțiune',
		error: 'Eroare'
	};

	function humanTitle(entry: Entry): string {
		const label = data.entityLabels[entry.entityType] ?? entry.entityType;
	const specificSummary = explainAdminAction(entry);
	if (specificSummary) return specificSummary;
		if (entry.entityType === 'admin_action') return `Acțiune administrativă: ${entry.entityId}`;
		if (entry.entityType === 'cms') return `Acțiune CMS: ${entry.entityId}`;
		if (entry.entityType === 'media') return `Acțiune media: ${entry.entityId}`;
		if (entry.entityType === 'media_metadata') return `Metadate media: ${entry.entityId}`;
		if (entry.entityType === 'site_section') {
			const [page, section, locale] = entry.entityId.split(':');
			const pageName = PAGE_LABELS[page] ?? page;
			return `Secțiunea „${section ?? '—'}” a paginii ${pageName}`;
		}
		if (entry.entityType === 'mentor') return `Mentorul #${entry.entityId}`;
		if (entry.entityType === 'program') return `Programul #${entry.entityId}`;
		if (entry.entityType === 'hero_settings') return 'Setări hero';
		if (entry.entityType === 'contact_settings') return 'Setări contact';
		if (entry.entityType === 'site_settings') return `Setări site: ${entry.entityId}`;
		return `${label}: ${entry.entityId}`;
	}

	function actionLabel(action: string): string {
		return ACTION_LABELS[action] ?? action;
	}

	function fieldLabel(key: string): string {
		return FIELD_LABELS[key] ?? key;
	}

	function toDisplayStr(v: unknown): string {
	if (v == null) return '—';
	if (typeof v === 'boolean') return v ? 'Da' : 'Nu';
	if (typeof v === 'number' || typeof v === 'bigint') return String(v);
	if (typeof v === 'string') {
		const trimmed = v.trim();
		if (!trimmed) return '—';
		if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) {
			const dt = new Date(trimmed);
			if (!Number.isNaN(dt.getTime())) return formatDate(dt);
		}
		return trimmed;
	}
	if (Array.isArray(v)) {
		if (v.length === 0) return '—';
		if (v.every((item) => item == null || ['string', 'number', 'boolean'].includes(typeof item))) {
			return v.map((item) => toDisplayStr(item)).join(', ');
		}
		return `[${v.length} elemente]`;
	}
	return '[obiect]';
	}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function equalValue(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (typeof a === 'string' && typeof b === 'string') return a.trim() === b.trim();
	return false;
}

function flattenDiff(before: unknown, after: unknown, prefix = ''): DiffRow[] {
		const rows: DiffRow[] = [];

	if (isPlainObject(before) || isPlainObject(after)) {
		const beforeObj = isPlainObject(before) ? before : {};
		const afterObj = isPlainObject(after) ? after : {};
		const keys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
		for (const key of keys) {
			const nextPrefix = prefix ? `${prefix}.${key}` : key;
			rows.push(...flattenDiff(beforeObj[key], afterObj[key], nextPrefix));
		}
		return rows;
	}

	if (Array.isArray(before) || Array.isArray(after)) {
		const beforeArr = Array.isArray(before) ? before : [];
		const afterArr = Array.isArray(after) ? after : [];
		const primitiveOnly = [...beforeArr, ...afterArr].every(
			(item) => item == null || ['string', 'number', 'boolean'].includes(typeof item)
		);
		if (primitiveOnly) {
			const beforeText = toDisplayStr(beforeArr);
			const afterText = toDisplayStr(afterArr);
			if (beforeText !== afterText) {
				rows.push({ field: prefix || 'valoare', before: beforeText, after: afterText });
			}
			return rows;
		}
		if (beforeArr.length !== afterArr.length) {
			rows.push({
				field: prefix || 'valoare',
				before: `${beforeArr.length} elemente`,
				after: `${afterArr.length} elemente`
			});
		}
		const maxLen = Math.max(beforeArr.length, afterArr.length);
		for (let i = 0; i < maxLen; i += 1) {
			const nextPrefix = `${prefix}[${i + 1}]`;
			rows.push(...flattenDiff(beforeArr[i], afterArr[i], nextPrefix));
		}
		return rows;
	}

	if (equalValue(before, after)) return rows;
	rows.push({
		field: prefix || 'valoare',
		before: toDisplayStr(before),
		after: toDisplayStr(after)
	});
	return rows;
}

function fieldDiff(entry: Entry): DiffRow[] {
	const before = entry.payloadBefore as unknown;
	const after = entry.payloadAfter as unknown;
	const rows = flattenDiff(before, after);
	return rows.filter((row) => row.before !== row.after);
}

function formatDiffField(fieldPath: string): string {
	const parts = fieldPath.split('.');
	const pretty = parts.map((part) => {
		const [base, indexPart] = part.split('[');
		const label = fieldLabel(base);
		if (!indexPart) return label;
		return `${label} [${indexPart}`;
	});
	return pretty.join(' → ');
}

	function getActionPayload(entry: Entry): ActionPayload | null {
		if (!entry.payloadAfter || typeof entry.payloadAfter !== 'object') return null;
		const payload = entry.payloadAfter as Record<string, unknown>;
		if (!('summary' in payload) && !('method' in payload) && !('pathname' in payload) && !('status' in payload)) return null;
		return payload as ActionPayload;
	}

function getPathPart(pathname: string, index: number): string | null {
	const parts = pathname.split('/').filter(Boolean);
	return parts[index] ?? null;
}

function getSearchParam(actionPayload: ActionPayload | null, key: string): string | null {
	if (!actionPayload?.searchParams) return null;
	const value = actionPayload.searchParams[key];
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function localeLabel(locale: string | null): string {
	if (locale === 'ro') return 'RO';
	if (locale === 'en') return 'EN';
	return '—';
}

function shortMediaName(url: string): string {
	const clean = url.split('?')[0] ?? url;
	const file = clean.split('/').filter(Boolean).at(-1) ?? clean;
	return decodeURIComponent(file);
}

function explainCmsApiAction(actionPayload: ActionPayload): string | null {
	if (actionPayload.pathname !== '/admin/api/cms') return null;
	const type = getSearchParam(actionPayload, 'type');
	if (type === 'section') {
		const page = getSearchParam(actionPayload, 'page');
		const section = getSearchParam(actionPayload, 'section');
		const locale = localeLabel(getSearchParam(actionPayload, 'locale'));
		const pageName = page ? (PAGE_LABELS[page] ?? page) : 'pagina';
		return `A salvat secțiunea „${section ?? '—'}” din pagina ${pageName} (${locale})`;
	}
	if (type === 'program_section') {
		const programId = getSearchParam(actionPayload, 'programId');
		const section = getSearchParam(actionPayload, 'section');
		const locale = localeLabel(getSearchParam(actionPayload, 'locale'));
		return `A salvat secțiunea „${section ?? '—'}” pentru programul #${programId ?? '—'} (${locale})`;
	}
	if (type === 'program') {
		const id = getSearchParam(actionPayload, 'id');
		return `A salvat detaliile programului #${id ?? '—'}`;
	}
	if (type === 'mentor') {
		const id = getSearchParam(actionPayload, 'id');
		return `A salvat detaliile mentorului #${id ?? '—'}`;
	}
	if (type === 'hero') {
		const locale = localeLabel(getSearchParam(actionPayload, 'locale'));
		return `A salvat setările Hero (${locale})`;
	}
	if (type === 'blog') {
		const id = getSearchParam(actionPayload, 'id');
		return `A salvat articolul de blog #${id ?? '—'}`;
	}
	return 'A salvat modificări în CMS';
}

function explainAdminAction(entry: Entry): string | null {
	const actionPayload = getActionPayload(entry);
	if (!actionPayload) return null;
	const pathname = actionPayload.pathname ?? '';
	const actionKey = actionPayload.actionKey ?? null;

	if (pathname.startsWith('/admin/api/media/delete')) {
		const url = getSearchParam(actionPayload, 'url');
		if (url) return `A șters fișierul media „${shortMediaName(url)}”`;
		return 'A șters un fișier media';
	}
	if (pathname.startsWith('/admin/api/media/replace')) {
		const url = getSearchParam(actionPayload, 'url');
		if (url) return `A înlocuit fișierul media „${shortMediaName(url)}”`;
		return 'A înlocuit un fișier media';
	}
	if (pathname.startsWith('/admin/api/media/metadata')) {
		const url = getSearchParam(actionPayload, 'url');
		if (url) return `A actualizat metadatele pentru „${shortMediaName(url)}”`;
		return 'A actualizat metadate media';
	}
	if (pathname.startsWith('/admin/api/media/upload')) {
		return 'A încărcat un fișier media nou';
	}
	if (pathname.startsWith('/admin/api/contact/socials')) {
		const locale = localeLabel(getSearchParam(actionPayload, 'locale'));
		return `A actualizat linkurile sociale pentru limba ${locale}`;
	}
	if (pathname === '/admin/settings') {
		if (actionKey === 'updateProfile') return 'A actualizat profilul contului';
		if (actionKey === 'revokeSession') return 'A revocat o sesiune activă';
		if (actionKey === 'revokeOtherSessions') return 'A revocat toate celelalte sesiuni';
	}
	if (pathname === '/admin/login' || pathname === '/login') {
		if (actionKey === 'signOut') return 'S-a deconectat';
	}
	if (pathname.startsWith('/admin/blog/new') && actionKey === 'create') {
		return 'A creat un articol nou pe blog';
	}
	if (pathname.startsWith('/admin/blog/')) {
		const blogId = getPathPart(pathname, 2);
		const articleTitle = blogId ? data.blogTitles?.[blogId] : null;
		if (actionKey === 'delete') {
			if (articleTitle) return `A șters articolul „${articleTitle}”`;
			return `A șters articolul de blog #${blogId ?? '—'}`;
		}
		if (actionKey === 'save') {
			if (articleTitle) return `A actualizat articolul „${articleTitle}”`;
			return `A actualizat articolul de blog #${blogId ?? '—'}`;
		}
	}
	const cmsMessage = explainCmsApiAction(actionPayload);
	if (cmsMessage) return cmsMessage;

	if (actionPayload.summary) return actionPayload.summary;
	return null;
}

function isExplicitActionText(text: string): boolean {
	return /^(A |S-a )/.test(text.trim());
}

	function queryString(overrides: { page?: number; user?: string } = {}): string {
		const p = overrides.page ?? data.page;
		const u = overrides.user !== undefined ? overrides.user : data.filters.userName;
		const params = new URLSearchParams();
		if (p > 1) params.set('page', String(p));
		if (u) params.set('user', u);
		return params.toString() ? `?${params.toString()}` : '';
	}
</script>

<div>
	<h2 class="text-2xl font-semibold text-foreground">Istoric acțiuni și modificări</h2>
	<p class="mt-1 text-muted-foreground">Lista completă a acțiunilor administrative și a modificărilor de conținut. Poți filtra după contul care a efectuat acțiunea.</p>

	<form method="get" action="/admin/history" class="mt-6 flex flex-wrap items-end gap-4 rounded-none border border-border bg-card p-4">
		<input type="hidden" name="user" value={effectiveUser} />
		<div class="space-y-2 min-w-[220px]">
			<Label for="user-select">Cine a editat</Label>
			<Select.Root
				type="single"
				value={selectValue}
				onValueChange={(v: string | undefined) => (selectedUser = v === ALL_USERS_VALUE ? '' : (v ?? ''))}
			>
				<Select.Trigger id="user-select" class="w-full rounded-none">
					{effectiveUser
						? (data.userOptions.find((o) => o.value === effectiveUser)?.label ?? effectiveUser)
						: 'Toate conturile'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value={ALL_USERS_VALUE} label="Toate conturile" />
					{#each data.userOptions as opt (opt.value)}
						<Select.Item value={opt.value} label={opt.label} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		<Button type="submit" class="rounded-none">Filtrează</Button>
	</form>

	<p class="mt-4 text-sm font-medium text-foreground">Toate acțiunile (cele mai recente mai întâi)</p>
	<div class="mt-2 space-y-2">
		{#if data.entries.length === 0}
			<p class="rounded-none border border-dashed border-border bg-muted/10 py-12 text-center text-muted-foreground">Nicio modificare găsită.</p>
		{:else}
			<ul class="space-y-2">
				{#each data.entries as entry (entry.id)}
					{@const actionPayload = getActionPayload(entry)}
					<li class="rounded-none border border-border bg-card overflow-hidden">
						<button
							type="button"
							class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
							onclick={() => (expandedId = expandedId === entry.id ? null : entry.id)}
						>
							{#if expandedId === entry.id}
								<ChevronDown class="size-4 shrink-0 text-muted-foreground" />
							{:else}
								<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
							{/if}
							<span
								class="rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground"
							>
								{data.entityLabels[entry.entityType] ?? entry.entityType}
							</span>
							<span class="min-w-0 flex-1 truncate font-medium text-foreground">{humanTitle(entry)}</span>
							<span class="shrink-0 text-sm text-muted-foreground">
								{entry.userName ?? '—'} · {formatDate(entry.changedAt)}
							</span>
							<span class="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{actionLabel(entry.action)}</span>
						</button>
						{#if expandedId === entry.id}
							{@const diff = fieldDiff(entry)}
							<div class="border-t border-border bg-muted/10 px-4 py-4">
								{#if actionPayload}
									{@const title = humanTitle(entry)}
									<p class="mb-3 text-sm font-semibold text-foreground">Ce s-a întâmplat</p>
									<div class="space-y-3 rounded-none border border-border bg-background p-3 text-sm">
										<p>{title}</p>
										{#if !isExplicitActionText(title)}
											<p>
												<strong>Rezultat:</strong>
												{actionPayload.outcome === 'success'
													? ' reușit'
													: actionPayload.outcome === 'error'
														? ' cu eroare'
														: ' —'}
											</p>
										{/if}
										<details class="rounded-none border border-border bg-muted/20">
											<summary class="cursor-pointer px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
												Detalii tehnice
											</summary>
											<div class="space-y-2 border-t border-border px-3 py-3">
												<p><strong>Metodă:</strong> {actionPayload.method ?? '—'}</p>
												<p><strong>Rută:</strong> {actionPayload.pathname ?? '—'}</p>
												<p><strong>Status:</strong> {actionPayload.status ?? '—'}</p>
												{#if actionPayload.searchParams && Object.keys(actionPayload.searchParams).length > 0}
													<div>
														<p><strong>Parametri:</strong></p>
														<div class="mt-1 max-h-40 overflow-auto rounded-none border border-border bg-muted/30 p-2 text-xs">
															{#each Object.entries(actionPayload.searchParams) as [key, value] (key)}
																<p><strong>{key}:</strong> {value}</p>
															{/each}
														</div>
													</div>
												{/if}
											</div>
										</details>
									</div>
								{:else if diff.length > 0}
									<p class="mb-3 text-sm font-semibold text-foreground">Ce s-a modificat</p>
									<div class="space-y-5">
										{#each diff as row (row.field)}
											<div class="rounded-none border border-border bg-background">
												<p class="border-b border-border px-3 py-2 text-sm font-medium text-foreground">
													{formatDiffField(row.field)}
												</p>
												<div class="grid gap-4 p-3 md:grid-cols-2">
													<div>
														<p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Înainte</p>
														<pre
															class="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-none border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground"
														>{row.before}</pre
														>
													</div>
													<div>
														<p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">După</p>
														<pre
															class="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-none border border-border bg-muted/30 p-3 text-xs leading-relaxed text-foreground"
														>{row.after}</pre>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-muted-foreground">Creare sau actualizare fără diff pe câmpuri.</p>
								{/if}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if data.totalPages > 1}
		<nav class="mt-6 flex items-center justify-between border-t border-border pt-4">
			<p class="text-sm text-muted-foreground">
				Pagina {data.page} din {data.totalPages} ({data.total} în total)
			</p>
			<div class="flex gap-2">
				{#if data.page > 1}
					<a
						href="/admin/history{queryString({ page: data.page - 1 })}"
						class="rounded-none border border-border px-3 py-1.5 text-sm hover:bg-muted"
					>
						← Anterior
					</a>
				{/if}
				{#if data.page < data.totalPages}
					<a
						href="/admin/history{queryString({ page: data.page + 1 })}"
						class="rounded-none border border-border px-3 py-1.5 text-sm hover:bg-muted"
					>
						Următor →
					</a>
				{/if}
			</div>
		</nav>
	{/if}
</div>
