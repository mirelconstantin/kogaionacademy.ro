<script lang="ts">
	import { browser } from '$app/environment';
	import { allowsClientAnalytics } from '$lib/client/consent';
	import type { FormSchemaV1 } from '$lib/forms/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import type { FullAutoFill } from 'svelte/elements';
	import { previewValuesFromSchema } from '$lib/forms/sample-values';

	let {
		formKey,
		formVersion,
		schema,
		locale = 'ro',
		successMessage,
		successExtra = '',
		class: className = '',
		mode = 'live'
	}: {
		formKey: string;
		formVersion: number;
		schema: FormSchemaV1;
		locale?: string;
		successMessage: string;
		successExtra?: string;
		class?: string;
		/** live: submit + tracking; preview: sample values, no network */
		mode?: 'live' | 'preview';
	} = $props();

	const isPreview = $derived(mode === 'preview');

	let values = $state<Record<string, string>>({});
	let errors = $state<Record<string, string>>({});
	let submitting = $state(false);
	let success = $state(false);
	let containerEl: HTMLDivElement | null = $state(null);
	let viewed = $state(false);
	let visible50 = $state(false);
	let focusedOnce = $state(false);
	let fieldChangeTimer: ReturnType<typeof setTimeout> | null = null;

	function labelFor(field: (typeof schema.fields)[0]): string {
		return field.label[locale] ?? field.label['ro'] ?? field.key;
	}

	function placeholderFor(field: (typeof schema.fields)[0]): string | undefined {
		const p = field.placeholder;
		if (!p) return undefined;
		return p[locale] ?? p['ro'];
	}

	function submitLabel(): string {
		const s = schema.submitLabel;
		if (!s) return 'Trimite';
		return s[locale] ?? s['ro'] ?? 'Trimite';
	}

	function consentHint(): string | undefined {
		const h = schema.consentHint;
		if (!h) return undefined;
		return h[locale] ?? h['ro'];
	}

	function fieldWidthSpan(field: (typeof schema.fields)[0]): string {
		const fallback = field.type === 'checkbox' || field.type === 'textarea' ? 12 : 6;
		const pct = Number(field.widthPercent ?? (field.type === 'checkbox' || field.type === 'textarea' ? 100 : 50));
		switch (pct) {
			case 25:
				return 'md:col-span-3';
			case 33:
				return 'md:col-span-4';
			case 50:
				return 'md:col-span-6';
			case 66:
				return 'md:col-span-8';
			case 75:
				return 'md:col-span-9';
			case 100:
				return 'md:col-span-12';
			default:
				return fallback === 12 ? 'md:col-span-12' : 'md:col-span-6';
		}
	}

	async function track(
		eventType: string,
		fieldKey?: string,
		metadata?: Record<string, unknown>
	): Promise<void> {
		if (!browser || !allowsClientAnalytics()) return;
		const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
		try {
			await fetch('/api/forms/events', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					formKey,
					eventType,
					fieldKey: fieldKey ?? null,
					pageUrl,
					locale,
					metadata: metadata ?? null
				})
			});
		} catch {
			/* ignore */
		}
	}

	$effect(() => {
		if (isPreview || !browser || !containerEl || !allowsClientAnalytics()) return;
		const el = containerEl;
		const obs = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting && !viewed) {
						viewed = true;
						void track('form_view');
					}
					if (e.isIntersecting && e.intersectionRatio >= 0.5 && !visible50) {
						visible50 = true;
						void track('form_visible_50');
					}
				}
			},
			{ threshold: [0, 0.5, 1] }
		);
		obs.observe(el);
		return () => obs.disconnect();
	});

	function onFocusIn() {
		if (isPreview || !allowsClientAnalytics() || focusedOnce) return;
		focusedOnce = true;
		void track('first_focus');
	}

	function scheduleFieldChange(key: string) {
		if (isPreview || !allowsClientAnalytics()) return;
		if (fieldChangeTimer) clearTimeout(fieldChangeTimer);
		fieldChangeTimer = setTimeout(() => {
			void track('field_change', key, { len: values[key]?.length ?? 0 });
		}, 900);
	}

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (isPreview) return;
		if (submitting) return;
		submitting = true;
		errors = {};
		if (allowsClientAnalytics()) {
			void track('submit_attempt');
		}
		const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
		const idempotencyKey = typeof crypto !== 'undefined' ? crypto.randomUUID() : undefined;
		try {
			const res = await fetch('/api/forms/submit', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					formKey,
					formVersion,
					pageUrl,
					locale,
					values,
					idempotencyKey,
					utm: null
				})
			});
			const data = (await res.json()) as {
				ok?: boolean;
				errors?: Record<string, string>;
				values?: Record<string, string>;
			};
			if (!res.ok && data?.errors) {
				errors = data.errors;
				values = { ...values, ...(data.values ?? {}) };
			} else if (data && 'submissionId' in data) {
				success = true;
				values = {};
				const { toastFromActionWithMessage } = await import('$lib/client');
				toastFromActionWithMessage({ success: true }, successMessage);
			}
		} catch {
			errors = { _form: 'network' };
		} finally {
			submitting = false;
		}
	}
</script>

<div bind:this={containerEl} class={className}>
	{#if success}
		<div
			class="media-diagonal-soft mt-6 rounded-none border border-[#dfeaf8] bg-white p-5 shadow-[0_8px_20px_-16px_rgba(21,75,106,0.15)]"
		>
			<p class="font-medium text-[#0c3044] [font-family:var(--font-spectral)]">{successMessage}</p>
			{#if successExtra}
				<p class="mt-2 text-sm text-muted-foreground [font-family:var(--font-sans)]">
					{successExtra}
				</p>
			{/if}
		</div>
	{:else}
		<form
			method="post"
			class="mt-6 space-y-6"
			onsubmit={onSubmit}
			onfocusin={onFocusIn}
			novalidate
			aria-label={isPreview ? 'Previzualizare formular' : undefined}
		>
			<div class="grid gap-5 md:grid-cols-12">
				{#each schema.fields as field (field.key)}
					<div class={`space-y-2 ${fieldWidthSpan(field)}`}>
						{#if field.type === 'checkbox'}
							<label
								class="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-[#0c3044] [font-family:var(--font-sans)]"
							>
								<input
									type="checkbox"
									name={field.key}
									class="size-4 rounded-sm border-[#dfeaf8] text-[var(--brand-blue)] focus:ring-[var(--brand-blue)]/30"
									checked={values[field.key] === 'on' || values[field.key] === 'true'}
									onchange={(e) => {
										const t = e.currentTarget as HTMLInputElement;
										values = { ...values, [field.key]: t.checked ? 'true' : '' };
										scheduleFieldChange(field.key);
									}}
								/>
								{labelFor(field)}
							</label>
						{:else if field.type === 'select' && field.options}
							<Label
								for={field.key}
								class="text-sm font-medium text-[#0c3044] [font-family:var(--font-sans)]"
							>
								{labelFor(field)}
							</Label>
							<select
								id={field.key}
								name={field.key}
								class="h-12 w-full rounded-none border border-[#dfeaf8] bg-white px-4 text-sm text-[#0c3044] transition-colors focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[#154b6a]/15 [font-family:var(--font-sans)]"
								disabled={isPreview}
								value={values[field.key] ?? ''}
								onchange={(e) => {
									if (isPreview) return;
									values = { ...values, [field.key]: (e.currentTarget as HTMLSelectElement).value };
									scheduleFieldChange(field.key);
								}}
							>
								<option value="">—</option>
								{#each field.options as opt (opt.value)}
									<option value={opt.value}>{opt.label[locale] ?? opt.label['ro'] ?? opt.value}</option>
								{/each}
							</select>
							{#if errors[field.key]}
								<p class="text-sm text-destructive">{errors[field.key]}</p>
							{/if}
						{:else if field.type === 'textarea'}
							<Label
								for={field.key}
								class="text-sm font-medium text-[#0c3044] [font-family:var(--font-sans)]"
							>
								{labelFor(field)}
							</Label>
							<Textarea
								id={field.key}
								name={field.key}
								rows={field.rows ?? 6}
								readonly={isPreview}
								value={values[field.key] ?? ''}
								class="min-h-[150px] resize-y rounded-none border-[#dfeaf8] bg-white px-4 py-3 text-[#0c3044] shadow-none transition-colors focus-visible:border-[var(--brand-blue)] focus-visible:ring-[3px] focus-visible:ring-[#154b6a]/18 [font-family:var(--font-sans)] {isPreview
									? 'cursor-default bg-muted/40'
									: ''}"
								aria-invalid={errors[field.key] ? true : undefined}
								placeholder={placeholderFor(field)}
								autocomplete={field.autocomplete as FullAutoFill | undefined}
								oninput={(e) => {
									if (isPreview) return;
									values = { ...values, [field.key]: (e.currentTarget as HTMLTextAreaElement).value };
									scheduleFieldChange(field.key);
								}}
							/>
							{#if errors[field.key]}
								<p class="text-sm text-destructive">{labelFor(field)} (required)</p>
							{/if}
						{:else}
							<Label
								for={field.key}
								class="text-sm font-medium text-[#0c3044] [font-family:var(--font-sans)]"
							>
								{labelFor(field)}
							</Label>
							<Input
								id={field.key}
								name={field.key}
								type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
								readonly={isPreview}
								value={values[field.key] ?? ''}
								class="h-12 rounded-none border-[#dfeaf8] bg-white px-4 text-[#0c3044] shadow-none transition-colors focus-visible:border-[var(--brand-blue)] focus-visible:ring-[3px] focus-visible:ring-[#154b6a]/18 [font-family:var(--font-sans)] {isPreview
									? 'cursor-default bg-muted/40'
									: ''}"
								autocomplete={field.autocomplete as FullAutoFill | undefined}
								placeholder={placeholderFor(field)}
								aria-invalid={errors[field.key] ? true : undefined}
								oninput={(e) => {
									if (isPreview) return;
									values = { ...values, [field.key]: (e.currentTarget as HTMLInputElement).value };
									scheduleFieldChange(field.key);
								}}
							/>
							{#if errors[field.key]}
								<p class="text-sm text-destructive">
									{errors[field.key] === 'required'
										? labelFor(field)
										: errors[field.key] === 'invalid'
											? 'Invalid'
											: errors[field.key]}
								</p>
							{/if}
						{/if}
					</div>
				{/each}
			</div>
			{#if errors._form}
				<p class="text-sm text-destructive">
					{errors._form === 'rate_limited'
						? 'Prea multe încercări. Încearcă mai târziu.'
						: errors._form === 'network'
							? 'Eroare de rețea.'
							: 'Nu am putut trimite formularul.'}
				</p>
			{/if}
			<div class="flex flex-wrap items-center justify-between gap-3">
				{#if consentHint()}
					<p class="text-xs text-muted-foreground [font-family:var(--font-sans)]">
						{consentHint()}
					</p>
				{:else}
					<span></span>
				{/if}
				{#if isPreview}
					<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
						Previzualizare — nu se trimite
					</p>
					<Button
						type="button"
						disabled={true}
						class="btn-diagonal h-12 min-w-[13rem] cursor-not-allowed border-2 border-[#dfeaf8] bg-[#f0f5fa] px-6 text-base font-medium normal-case tracking-normal text-[#0c3044]/60"
					>
						<span class="inline-flex items-center gap-2">
							{submitLabel()}
							<ArrowRight class="size-4" />
						</span>
					</Button>
				{:else}
					<Button
						type="submit"
						disabled={submitting}
						class="btn-diagonal h-12 min-w-[13rem] border-2 border-[var(--brand-blue)] bg-[var(--brand-blue)] px-6 text-base font-semibold normal-case tracking-normal text-white transition-colors hover:border-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue-hover)]"
					>
						<span class="inline-flex items-center gap-2">
							{submitting ? 'Se trimite…' : submitLabel()}
							<ArrowRight class="size-4" />
						</span>
					</Button>
				{/if}
			</div>
		</form>
	{/if}
</div>
