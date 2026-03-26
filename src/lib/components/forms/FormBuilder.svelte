<script lang="ts">
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import type { FormFieldDef, FormFieldType, FormSchemaV1 } from '$lib/forms/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';

	type Row = { id: string; field: FormFieldDef };

	let {
		schema = $bindable(),
		showJsonAdvanced = $bindable(false),
		serverSyncKey = ''
	}: {
		schema: FormSchemaV1;
		showJsonAdvanced?: boolean;
		/** When this changes (e.g. after save / restore), rebuild rows from schema */
		serverSyncKey?: string;
	} = $props();

	const flipDurationMs = 200;
	const widthOptions = [
		{ value: 25, label: '25% (1/4)' },
		{ value: 33, label: '33% (1/3)' },
		{ value: 50, label: '50% (1/2)' },
		{ value: 66, label: '66% (2/3)' },
		{ value: 75, label: '75% (3/4)' },
		{ value: 100, label: '100% (rând complet)' }
	] as const;

	function cloneField(f: FormFieldDef): FormFieldDef {
		return JSON.parse(JSON.stringify(f)) as FormFieldDef;
	}

	function rowFromField(f: FormFieldDef): Row {
		return { id: crypto.randomUUID(), field: cloneField(f) };
	}

	let items = $state<Row[]>(schema.fields.map((f) => rowFromField(f)));
	let expandedId = $state<string | null>(null);
	let jsonDraft = $state('');
	let undoStack = $state<string[]>([]);
	let lastServerKey = $state<string | null>(null);

	$effect(() => {
		const k = serverSyncKey;
		if (k === lastServerKey) return;
		lastServerKey = k;
		items = schema.fields.length ? schema.fields.map((f) => rowFromField(f)) : [];
		undoStack = [];
	});

	function syncSchema() {
		schema = {
			...schema,
			fields: items.map((r) => r.field)
		};
	}

	function pushUndo() {
		const snap = JSON.stringify(items.map((r) => r.field));
		undoStack = [...undoStack.slice(-9), snap];
	}

	function undoLocal() {
		const snap = undoStack.pop();
		undoStack = [...undoStack];
		if (snap == null) return;
		try {
			const parsed = JSON.parse(snap) as FormFieldDef[];
			items = parsed.map((f) => rowFromField(f));
			syncSchema();
		} catch {
			/* ignore */
		}
	}

	function handleConsider(e: CustomEvent<{ items: Row[] }>) {
		items = e.detail.items;
	}

	function handleFinalize(e: CustomEvent<{ items: Row[] }>) {
		pushUndo();
		items = e.detail.items;
		syncSchema();
	}

	function addField(type: FormFieldType) {
		pushUndo();
		const keyBase =
			type === 'textarea'
				? 'mesaj'
				: type === 'email'
					? 'email'
					: type === 'checkbox'
						? 'accept'
						: 'camp_nou';
		let key = keyBase;
		let n = 1;
		const existing = () => items.some((r) => r.field.key === key);
		while (existing()) {
			key = `${keyBase}_${n++}`;
		}
		const field: FormFieldDef = {
			key,
			type,
			label: { ro: 'Etichetă', en: 'Label' },
			widthPercent: type === 'checkbox' || type === 'textarea' ? 100 : 50,
			required: false,
			piiClass: type === 'email' ? 'contact' : 'none',
			...(type === 'textarea' ? { rows: 4 } : {}),
			...(type === 'select'
				? {
						options: [
							{ value: 'opt1', label: { ro: 'Opțiune 1', en: 'Opțiune 1' } },
							{ value: 'opt2', label: { ro: 'Opțiune 2', en: 'Opțiune 2' } }
						]
					}
				: {})
		};
		const row = rowFromField(field);
		items = [...items, row];
		expandedId = row.id;
		syncSchema();
	}

	function removeRow(id: string) {
		pushUndo();
		items = items.filter((r) => r.id !== id);
		if (expandedId === id) expandedId = null;
		syncSchema();
	}

	function duplicateRow(id: string) {
		const row = items.find((r) => r.id === id);
		if (!row) return;
		pushUndo();
		const copy = rowFromField({
			...cloneField(row.field),
			key: row.field.key + '_copy'
		});
		const idx = items.findIndex((r) => r.id === id);
		items = [...items.slice(0, idx + 1), copy, ...items.slice(idx + 1)];
		expandedId = copy.id;
		syncSchema();
	}

	function moveRow(id: string, dir: -1 | 1) {
		const i = items.findIndex((r) => r.id === id);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= items.length) return;
		pushUndo();
		const next = [...items];
		[next[i], next[j]] = [next[j], next[i]];
		items = next;
		syncSchema();
	}

	function optionsToText(field: FormFieldDef): string {
		if (!field.options?.length) return '';
		return field.options
			.map((o) => {
				const lr = o.label.ro ?? o.label.en ?? '';
				return `${o.value}|${lr}`;
			})
			.join('\n');
	}

	function textToOptions(text: string): { value: string; label: { ro: string; en: string } }[] {
		const out: { value: string; label: { ro: string; en: string } }[] = [];
		for (const line of text.split('\n')) {
			const t = line.trim();
			if (!t) continue;
			const parts = t.split('|');
			const value = (parts[0] ?? '').trim();
			if (!value) continue;
			const ro = (parts[1] ?? value).trim();
			out.push({ value, label: { ro, en: ro } });
		}
		return out.length ? out : [{ value: 'opt1', label: { ro: 'Opțiune 1', en: 'Opțiune 1' } }];
	}

	function applyJsonFromAdvanced() {
		let parsed: unknown;
		try {
			parsed = JSON.parse(jsonDraft);
		} catch {
			return;
		}
		if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as FormSchemaV1).fields)) return;
		const next = parsed as FormSchemaV1;
		pushUndo();
		schema = { ...schema, ...next, fields: next.fields };
		items = next.fields.map((f) => rowFromField(f));
	}

	$effect(() => {
		if (showJsonAdvanced) {
			jsonDraft = JSON.stringify(
				{ ...schema, fields: items.map((r) => r.field) },
				null,
				2
			);
		}
	});

	const paletteTypes: FormFieldType[] = ['text', 'email', 'textarea', 'tel', 'number', 'checkbox', 'select'];
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center gap-2">
		<span class="text-sm font-medium text-muted-foreground">Adaugă câmp:</span>
		{#each paletteTypes as t (t)}
			<Button type="button" variant="outline" size="sm" class="rounded-none text-xs" onclick={() => addField(t)}>
				{t}
			</Button>
		{/each}
		<Button
			type="button"
			variant="ghost"
			size="sm"
			class="rounded-none text-xs"
			onclick={undoLocal}
			disabled={undoStack.length === 0}
		>
			Undo
		</Button>
	</div>

	<div class="space-y-2">
		<p class="text-sm font-medium">Câmpuri (trage pentru reordonare)</p>
		<section
			class="min-h-[3rem] space-y-2 rounded-none border border-border bg-muted/20 p-2"
			use:dndzone={{ items, flipDurationMs }}
			onconsider={handleConsider}
			onfinalize={handleFinalize}
		>
			{#each items as item (item.id)}
				<div
					class="touch-none border border-border bg-card"
					animate:flip={{ duration: flipDurationMs }}
				>
					<div class="flex items-center gap-2 border-b border-border/60 px-2 py-2">
						<span class="cursor-grab text-muted-foreground active:cursor-grabbing" aria-hidden="true">
							<GripVertical class="size-4" />
						</span>
						<button
							type="button"
							class="min-w-0 flex-1 text-left text-sm font-medium"
							onclick={() => (expandedId = expandedId === item.id ? null : item.id)}
						>
							<span class="font-mono text-xs text-muted-foreground">{item.field.key}</span>
							<span class="ml-2">{item.field.label.ro ?? item.field.label.en ?? item.field.type}</span>
							<span class="ml-2 text-xs text-muted-foreground">({item.field.type})</span>
							<span class="ml-2 text-xs text-muted-foreground">
								{item.field.widthPercent ?? (item.field.type === 'checkbox' || item.field.type === 'textarea' ? 100 : 50)}%
							</span>
						</button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							class="size-8 shrink-0"
							onclick={() => moveRow(item.id, -1)}
							aria-label="Mută sus"
						>
							<ChevronUp class="size-4" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							class="size-8 shrink-0"
							onclick={() => moveRow(item.id, 1)}
							aria-label="Mută jos"
						>
							<ChevronDown class="size-4" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							class="size-8 shrink-0"
							onclick={() => duplicateRow(item.id)}
							aria-label="Duplică"
						>
							<Copy class="size-4" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							class="size-8 shrink-0 text-destructive"
							onclick={() => removeRow(item.id)}
							aria-label="Șterge"
						>
							<Trash2 class="size-4" />
						</Button>
					</div>
					{#if expandedId === item.id}
						<div class="space-y-3 p-3 text-sm">
							<div class="grid gap-3 sm:grid-cols-2">
								<div class="space-y-1">
									<Label>Cheie (slug)</Label>
									<Input
										class="rounded-none font-mono text-xs"
										value={item.field.key}
										onchange={(e) => {
											item.field.key = (e.currentTarget as HTMLInputElement).value.trim();
											syncSchema();
										}}
									/>
								</div>
								<div class="space-y-1">
									<Label>Tip</Label>
									<select
										class="h-9 w-full border border-input bg-background px-2 text-sm"
										value={item.field.type}
										onchange={(e) => {
											const v = (e.currentTarget as HTMLSelectElement).value as FormFieldType;
											item.field.type = v;
											if (v === 'select' && !item.field.options?.length) {
												item.field.options = [
													{ value: 'opt1', label: { ro: 'A', en: 'A' } },
													{ value: 'opt2', label: { ro: 'B', en: 'B' } }
												];
											}
											syncSchema();
										}}
									>
										{#each paletteTypes as t (t)}
											<option value={t}>{t}</option>
										{/each}
									</select>
								</div>
							</div>
							<div class="space-y-1">
								<Label>Etichetă (vizibilă pe site)</Label>
								<Input
									class="rounded-none"
									value={item.field.label.ro ?? ''}
									oninput={(e) => {
										const v = (e.currentTarget as HTMLInputElement).value;
										item.field.label = { ...item.field.label, ro: v, en: v };
										syncSchema();
									}}
								/>
							</div>
							<div class="space-y-1">
								<Label>Placeholder (hint în câmp gol pe site)</Label>
								<Input
									class="rounded-none"
									value={item.field.placeholder?.ro ?? ''}
									oninput={(e) => {
										const v = (e.currentTarget as HTMLInputElement).value;
										item.field.placeholder = { ...item.field.placeholder, ro: v, en: v };
										syncSchema();
									}}
								/>
								<p class="text-xs text-muted-foreground">
									Text subțire afișat în interiorul câmpului când utilizatorul nu a scris încă nimic.
								</p>
							</div>
							<div class="space-y-1">
								<Label>Valoare exemplu (doar previzualizare în admin)</Label>
								<Input
									class="rounded-none"
									value={item.field.sampleValue?.ro ?? ''}
									oninput={(e) => {
										const v = (e.currentTarget as HTMLInputElement).value;
										item.field.sampleValue = { ...item.field.sampleValue, ro: v, en: v };
										syncSchema();
									}}
								/>
								<p class="text-xs text-muted-foreground">
									Nu apare pe site; umple câmpul în tab-ul Design ca să vezi cum arată formularul completat.
								</p>
							</div>
							<div class="space-y-1">
								<Label>Lățime pe rând (desktop)</Label>
								<select
									class="h-9 w-full border border-input bg-background px-2 text-sm"
									value={String(item.field.widthPercent ?? (item.field.type === 'checkbox' || item.field.type === 'textarea' ? 100 : 50))}
									onchange={(e) => {
										item.field.widthPercent = parseInt((e.currentTarget as HTMLSelectElement).value, 10);
										syncSchema();
									}}
								>
									{#each widthOptions as w (w.value)}
										<option value={w.value}>{w.label}</option>
									{/each}
								</select>
								<p class="text-xs text-muted-foreground">
									Controlează cât ocupă câmpul pe același rând: 50/50, 75/25, 100% etc.
								</p>
							</div>
							<div class="flex flex-wrap gap-4">
								<label class="flex items-center gap-2 text-xs">
									<input
										type="checkbox"
										checked={item.field.required === true}
										onchange={(e) => {
											item.field.required = (e.currentTarget as HTMLInputElement).checked;
											syncSchema();
										}}
									/>
									Obligatoriu
								</label>
								<div class="flex items-center gap-2">
									<Label class="text-xs">PII</Label>
									<select
										class="h-8 border border-input bg-background px-2 text-xs"
										value={item.field.piiClass ?? 'none'}
										onchange={(e) => {
											item.field.piiClass = (e.currentTarget as HTMLSelectElement).value as
												| 'none'
												| 'contact'
												| 'sensitive';
											syncSchema();
										}}
									>
										<option value="none">none</option>
										<option value="contact">contact</option>
										<option value="sensitive">sensitive</option>
									</select>
								</div>
							</div>
							{#if item.field.type === 'textarea'}
								<div class="space-y-1">
									<Label>Rânduri</Label>
									<Input
										type="number"
										class="w-24 rounded-none"
										value={String(item.field.rows ?? 6)}
										onchange={(e) => {
											item.field.rows = parseInt((e.currentTarget as HTMLInputElement).value, 10) || 4;
											syncSchema();
										}}
									/>
								</div>
							{/if}
							{#if item.field.type === 'select'}
								<div class="space-y-1">
									<Label>Opțiuni (o linie: value|label_ro|label_en)</Label>
									<Textarea
										class="min-h-[100px] rounded-none font-mono text-xs"
										value={optionsToText(item.field)}
										onchange={(e) => {
											item.field.options = textToOptions((e.currentTarget as HTMLTextAreaElement).value);
											syncSchema();
										}}
									/>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</section>
	</div>

	<details class="rounded-none border border-dashed border-border bg-muted/10" bind:open={showJsonAdvanced}>
		<summary class="cursor-pointer px-3 py-2 text-sm font-medium">JSON avansat (editare brută)</summary>
		<div class="space-y-2 border-t border-border p-3">
			<Textarea class="min-h-[200px] rounded-none font-mono text-xs" bind:value={jsonDraft} />
			<Button type="button" variant="secondary" class="rounded-none" onclick={applyJsonFromAdvanced}>
				Aplică JSON în builder
			</Button>
		</div>
	</details>

	<div class="space-y-1">
		<Label>Text buton „Trimite”</Label>
		<Input
			class="rounded-none"
			value={schema.submitLabel?.ro ?? ''}
			oninput={(e) => {
				const v = (e.currentTarget as HTMLInputElement).value;
				schema = { ...schema, submitLabel: { ...schema.submitLabel, ro: v, en: v } };
			}}
		/>
	</div>
	<div class="space-y-1">
		<Label>Notă consimțământ (sub formular)</Label>
		<Input
			class="rounded-none"
			value={schema.consentHint?.ro ?? ''}
			oninput={(e) => {
				const v = (e.currentTarget as HTMLInputElement).value;
				schema = { ...schema, consentHint: { ...schema.consentHint, ro: v, en: v } };
			}}
		/>
	</div>
</div>
