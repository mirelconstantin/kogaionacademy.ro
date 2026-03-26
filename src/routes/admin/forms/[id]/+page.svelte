<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { formEventTypeLabelRo } from '$lib/forms/event-labels-ro';
	import type { FormSchemaV1 } from '$lib/forms/types';
	import { emptyFormSchema, parseFormSchemaClient } from '$lib/forms/schema-utils';
	import FormRenderer from '$lib/components/forms/FormRenderer.svelte';
	import FormBuilder from '$lib/components/forms/FormBuilder.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
	import Table2 from '@lucide/svelte/icons/table-2';
	import Pencil from '@lucide/svelte/icons/pencil';

	type SubmissionDetail = {
		pageUrl: string;
		referrer: string;
		ipMasked: string;
		userAgentSummary: string;
		userAgentRaw: string;
		utmLine: string;
		consentLine: string;
		consentJson: string;
		sessionShort: string;
		sessionFull: string;
		userId: string;
		idempotencyKey: string;
	};

	let { data, form } = $props();

	let tab = $state<'design' | 'responses' | 'analytics'>('responses');
	let filterQ = $state('');
	let titleInput = $state('');

	let workingSchema = $state<FormSchemaV1>(emptyFormSchema());

	const serverSyncKey = $derived(
		`${data.definition.id}:${String(data.definition.updatedAt ?? '')}`
	);

	let prevServerKey = $state<string | null>(null);
	$effect.pre(() => {
		const k = serverSyncKey;
		if (prevServerKey !== null && k === prevServerKey) return;
		prevServerKey = k;
		titleInput = data.definition.title ?? '';
		workingSchema = parseFormSchemaClient(data.definition.schemaJson) ?? emptyFormSchema();
	});

	const permissions = $derived((page.data as { permissions?: string[] }).permissions ?? []);
	const canEdit = $derived(permissions.includes('forms.edit'));
	const canExport = $derived(permissions.includes('forms.export'));
	const canAnalytics = $derived(permissions.includes('forms.analytics'));

	const dataCols = $derived.by(() => {
		const system = new Set(['id', 'createdAt', 'formVersion', 'locale', '_pageHint', '_uaSummary']);
		const base = ['id', 'createdAt', 'locale', '_pageHint', '_uaSummary'];
		const rest = [...new Set(data.fieldKeys.filter((k) => !system.has(k)))];
		return [...base, ...rest, 'formVersion'];
	});

	const filteredRows = $derived.by(() => {
		const q = filterQ.trim().toLowerCase();
		if (!q) return data.pivotRows;
		return data.pivotRows.filter((row) =>
			Object.entries(row).some(([key, v]) => {
				if (key === '_context') return String(v).toLowerCase().includes(q);
				return String(v).toLowerCase().includes(q);
			})
		);
	});

	const maxFunnel = $derived.by(() => {
		let m = 1;
		for (const f of data.funnel) m = Math.max(m, Number(f.n));
		return m;
	});

	function formatRevDate(d: Date | string): string {
		try {
			return new Date(d).toLocaleString('ro-RO');
		} catch {
			return String(d);
		}
	}

	function fieldLabelRo(col: string): string | undefined {
		const f = workingSchema.fields.find((x) => x.key === col);
		if (!f) return undefined;
		return f.label?.ro ?? f.label?.en ?? Object.values(f.label ?? {})[0];
	}

	function colLabel(col: string): string {
		const map: Record<string, string> = {
			id: 'ID',
			createdAt: 'Data',
			formVersion: 'Versiune',
			locale: 'Limbă',
			_pageHint: 'Link',
			_uaSummary: 'Sistem / Browser'
		};
		return map[col] ?? fieldLabelRo(col) ?? col;
	}

	function formatPivotCell(col: string, val: string | null | undefined): string {
		const v = val ?? '';
		if (v === '') return '';
		if (col === 'createdAt') {
			const d = new Date(v);
			if (!Number.isNaN(d.getTime())) return d.toLocaleString('ro-RO');
		}
		if (col === 'locale') {
			const loc: Record<string, string> = { ro: 'Română', en: 'Engleză' };
			return loc[v] ?? v;
		}
		return v;
	}

	function detailForRow(id: string): SubmissionDetail | undefined {
		return (data.submissionDetails as Record<string, SubmissionDetail>)[id];
	}
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<p class="text-xs font-medium uppercase text-muted-foreground">Formular</p>
			<h1 class="text-2xl font-semibold tracking-tight">
				{data.definition.title ?? data.definition.key}
				<span class="ml-2 font-mono text-sm font-normal text-muted-foreground">
					{data.definition.key} / {data.definition.locale} · v{data.definition.version} · {data.definition.status}
				</span>
			</h1>
		</div>
		<div class="flex flex-wrap gap-2">
			{#if canExport}
				<Button variant="outline" class="rounded-none" href="/admin/forms/{data.definition.id}/export?format=csv">
					Export CSV
				</Button>
				<Button variant="outline" class="rounded-none" href="/admin/forms/{data.definition.id}/export?format=xlsx">
					Export XLSX
				</Button>
				<Button variant="outline" class="rounded-none" href="/admin/forms/{data.definition.id}/export?format=csv&mask=1">
					CSV mascat
				</Button>
			{/if}
		</div>
	</div>

	{#if form?.message}
		<p class="text-sm text-destructive">{form.message}</p>
	{/if}

	<div class="flex flex-wrap gap-2 border-b border-border pb-2">
		<Button
			type="button"
			variant={tab === 'responses' ? 'default' : 'ghost'}
			class="rounded-none"
			onclick={() => (tab = 'responses')}
		>
			<Table2 class="mr-2 size-4" />
			Răspunsuri
		</Button>
		{#if canAnalytics}
			<Button
				type="button"
				variant={tab === 'analytics' ? 'default' : 'ghost'}
				class="rounded-none"
				onclick={() => (tab = 'analytics')}
			>
				<BarChart3 class="mr-2 size-4" />
				Analiză
			</Button>
		{/if}
		{#if canEdit}
			<Button
				type="button"
				variant={tab === 'design' ? 'default' : 'ghost'}
				class="rounded-none"
				onclick={() => (tab = 'design')}
			>
				<Pencil class="mr-2 size-4" />
				Design
			</Button>
		{/if}
	</div>

	{#if tab === 'responses'}
		<div class="space-y-4">
			<div class="flex flex-wrap items-end gap-3">
				<div class="min-w-[12rem] flex-1 space-y-2">
					<Label for="q">Căutare în tabel</Label>
					<Input id="q" class="rounded-none" bind:value={filterQ} placeholder="Filtru rapid…" />
				</div>
				<p class="text-sm text-muted-foreground">
					{filteredRows.length} rânduri (max {data.pivotRows.length} încărcate)
				</p>
			</div>

			<div class="overflow-auto border border-border bg-card">
				<table class="w-max min-w-full border-collapse text-left text-sm">
					<thead class="sticky top-0 z-10 bg-muted/90 backdrop-blur">
						<tr>
							<th class="border-b border-border px-3 py-2 font-medium whitespace-nowrap">Detalii</th>
							{#each dataCols as col (col)}
								<th class="border-b border-border px-3 py-2 font-medium whitespace-nowrap">{colLabel(col)}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each filteredRows as row, i (row.id + ':' + i)}
							{@const d = detailForRow(row.id)}
							<tr class="border-b border-border/80 align-top hover:bg-muted/30">
								<td class="max-w-[18rem] px-3 py-2 align-top">
									{#if d}
										<details class="text-xs">
											<summary class="cursor-pointer font-medium text-primary">Context trimitere</summary>
											<dl class="mt-2 space-y-2 text-muted-foreground">
												<div>
													<dt class="font-medium text-foreground">Pagină</dt>
													<dd class="break-all">{d.pageUrl}</dd>
												</div>
												<div>
													<dt class="font-medium text-foreground">Pagină anterioară (referrer)</dt>
													<dd class="break-all">{d.referrer}</dd>
												</div>
												<div>
													<dt class="font-medium text-foreground">Sistem de operare / Browser</dt>
													<dd>{d.userAgentSummary}</dd>
												</div>
												<div>
													<dt class="font-medium text-foreground">User-Agent (complet)</dt>
													<dd class="max-h-24 overflow-auto break-all font-mono text-[10px]">{d.userAgentRaw}</dd>
												</div>
												<div>
													<dt class="font-medium text-foreground">UTM</dt>
													<dd>{d.utmLine}</dd>
												</div>
												<div>
													<dt class="font-medium text-foreground">Consimțământ (rezumat)</dt>
													<dd>{d.consentLine}</dd>
												</div>
												{#if d.consentJson}
													<div>
														<dt class="font-medium text-foreground">Consimțământ (detaliu JSON)</dt>
														<dd>
															<pre class="max-h-32 overflow-auto rounded border border-border bg-muted/40 p-2 font-mono text-[10px]">{d.consentJson}</pre>
														</dd>
													</div>
												{/if}
												<div>
													<dt class="font-medium text-foreground">Sesiune (amprentă)</dt>
													<dd class="font-mono text-[10px]">{d.sessionShort}</dd>
													<dd class="mt-1 break-all font-mono text-[10px] text-muted-foreground">{d.sessionFull}</dd>
												</div>
												<div>
													<dt class="font-medium text-foreground">Utilizator autentificat</dt>
													<dd class="font-mono">{d.userId}</dd>
												</div>
												<div>
													<dt class="font-medium text-foreground">Cheie idempotență</dt>
													<dd class="break-all font-mono text-[10px]">{d.idempotencyKey}</dd>
												</div>
											</dl>
										</details>
									{:else}
										<span class="text-xs text-muted-foreground">—</span>
									{/if}
								</td>
								{#each dataCols as col (col)}
									<td
										class="max-w-[14rem] px-3 py-2 whitespace-nowrap"
										title={formatPivotCell(col, row[col] as string | undefined)}
									>
										{formatPivotCell(col, row[col] as string | undefined)}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else if tab === 'analytics'}
		<div class="grid gap-6 lg:grid-cols-3">
			<div class="border border-border bg-card p-4 lg:col-span-1">
				<p class="text-xs font-medium uppercase text-muted-foreground">30 zile</p>
				<p class="mt-2 text-3xl font-semibold">{data.kpi.views}</p>
				<p class="text-sm text-muted-foreground">Vizualizări formular (evenimente)</p>
				<p class="mt-4 text-3xl font-semibold">{data.kpi.submits}</p>
				<p class="text-sm text-muted-foreground">Trimiteri reușite</p>
				<p class="mt-4 text-3xl font-semibold">{data.kpi.conversion}%</p>
				<p class="text-sm text-muted-foreground">Conversie aproximativă (submit / view)</p>
			</div>
			<div class="space-y-4 border border-border bg-card p-4 lg:col-span-2">
				<p class="text-sm font-medium">Funnel evenimente</p>
				<ul class="space-y-3">
					{#each data.funnel as funnelRow (funnelRow.eventType)}
						<li>
							<div class="mb-1 flex justify-between text-xs">
								<span>{formEventTypeLabelRo(funnelRow.eventType)}</span>
								<span>{funnelRow.n}</span>
							</div>
							<div class="h-2 w-full bg-muted">
								<div
									class="h-2 bg-primary"
									style={`width: ${Math.round((Number(funnelRow.n) / maxFunnel) * 100)}%`}
								></div>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>
		<div class="mt-6 border border-border bg-card p-4">
			<p class="text-sm font-medium">Agregări zilnice (eșantion)</p>
			<div class="mt-3 overflow-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="border-b">
							<th class="py-2 pr-4">Zi</th>
							<th class="py-2 pr-4">Vizualizări</th>
							<th class="py-2 pr-4">Vizibil 50%</th>
							<th class="py-2 pr-4">Focus</th>
							<th class="py-2 pr-4">Trimiteri reușite</th>
							<th class="py-2 pr-4">Trimiteri cu eroare</th>
						</tr>
					</thead>
					<tbody>
						{#each data.metricsDaily as m (m.id)}
							<tr class="border-b border-border/60">
								<td class="py-2 pr-4">{m.day}</td>
								<td class="py-2 pr-4">{m.viewsCount}</td>
								<td class="py-2 pr-4">{m.visible50Count}</td>
								<td class="py-2 pr-4">{m.focusCount}</td>
								<td class="py-2 pr-4">{m.submitSuccessCount}</td>
								<td class="py-2 pr-4">{m.submitErrorCount}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else if tab === 'design'}
		<p class="text-sm text-muted-foreground">
			Stânga: builder (drag & drop). Dreapta: previzualizare ca pe site (fără trimitere, fără tracking). Modificările
			nesalvate apar imediat în preview.
			{#if data.definition.key === 'contact'}
				<a class="ml-1 font-medium text-foreground underline" href="/contact" target="_blank" rel="noreferrer"
					>Pagina publică Contact</a
				>
			{/if}
		</p>

		<form method="POST" action="?/saveDraft" use:enhance class="space-y-6">
			<div class="space-y-2">
				<Label for="title">Titlu</Label>
				<Input id="title" name="title" class="rounded-none" bind:value={titleInput} />
			</div>
			<input type="hidden" name="schemaJson" value={JSON.stringify(workingSchema)} />

			<div class="grid gap-8 lg:grid-cols-2 lg:items-start">
				<div class="min-w-0 space-y-4">
					<h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Structură câmpuri</h2>
					<FormBuilder bind:schema={workingSchema} serverSyncKey={serverSyncKey} />
				</div>
				<div class="min-w-0 space-y-4 lg:sticky lg:top-24">
					<h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Previzualizare</h2>
					<div class="border border-border bg-card p-4 shadow-sm">
						<FormRenderer
							mode="preview"
							formKey={data.definition.key}
							formVersion={data.definition.version}
							schema={workingSchema}
							locale={data.definition.locale}
							successMessage="Mesaj de succes (exemplu)"
							successExtra="Text suplimentar după trimitere (exemplu)."
						/>
					</div>
				</div>
			</div>

			<div class="flex flex-wrap gap-2">
				<Button type="submit" class="rounded-none">Salvează ciornă</Button>
			</div>
		</form>

		<div class="mt-8 space-y-3 border-t border-border pt-6">
			<p class="text-sm font-medium">Istoric salvări (ultimele {data.revisions.length})</p>
			<p class="text-xs text-muted-foreground">
				La fiecare salvare se păstrează un snapshot; poți restaura o versiune anterioară (se creează și un nou punct în
				istoric).
			</p>
			{#if data.revisions.length === 0}
				<p class="text-sm text-muted-foreground">Nu există încă revizii.</p>
			{:else}
				<ul class="space-y-2 text-sm">
					{#each data.revisions as rev (rev.id)}
						<li
							class="flex flex-wrap items-center justify-between gap-2 border border-border bg-muted/20 px-3 py-2"
						>
							<div class="min-w-0">
								<p class="font-medium">{formatRevDate(rev.createdAt)}</p>
								<p class="truncate text-xs text-muted-foreground">
									{rev.createdBy ?? '—'} · {rev.title ?? '(fără titlu)'}
								</p>
							</div>
							<form
								method="POST"
								action="?/restoreRevision"
								use:enhance
								onsubmit={(e) => {
									if (!confirm('Restaurezi schema și titlul din această salvare?')) {
										e.preventDefault();
									}
								}}
							>
								<input type="hidden" name="revisionId" value={rev.id} />
								<Button type="submit" variant="outline" size="sm" class="rounded-none">Restaurează</Button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<form method="POST" action="?/publish" use:enhance class="mt-6 border border-dashed border-border p-4">
			<p class="text-sm text-muted-foreground">
				Publică o nouă versiune: arhivează vechiul „publicat”, incrementează versiunea pentru acest rând.
			</p>
			<Button type="submit" class="mt-3 rounded-none" variant="secondary">Publică versiune nouă</Button>
		</form>
	{/if}
</div>
