<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import SocialIcons from '$lib/components/SocialIcons.svelte';
	import Pencil from '@lucide/svelte/icons/pencil';
	import X from '@lucide/svelte/icons/x';

	const SOCIAL_NETWORKS = [
		{ key: 'instagram', label: 'Instagram' },
		{ key: 'facebook', label: 'Facebook' },
		{ key: 'linkedin', label: 'LinkedIn' },
		{ key: 'youtube', label: 'YouTube' },
		{ key: 'twitter', label: 'X (Twitter)' },
		{ key: 'tiktok', label: 'TikTok' }
	] as const;

	type Props = {
		socials: { name: string; url: string }[];
		locale?: string;
		isEditor?: boolean;
		variant?: 'default' | 'hero' | 'footer';
	};

	let { socials = [], locale = 'ro', isEditor = false, variant = 'default' }: Props = $props();

	let open = $state(false);
	let formValues = $state<Record<string, string>>({});
	let loading = $state(false);
	let saving = $state(false);
	let error = $state<string | null>(null);

	async function openPopup() {
		if (!isEditor) return;
		open = true;
		error = null;
		// Pre-fill from props so modal shows something immediately
		const initial: Record<string, string> = {};
		for (const { key } of SOCIAL_NETWORKS) {
			initial[key] = socials.find((s) => s.name?.toLowerCase() === key)?.url?.trim() ?? '';
		}
		formValues = { ...initial };
		loading = true;
		try {
			const url = `/admin/api/contact/socials?locale=${encodeURIComponent(locale)}`;
			const res = await fetch(url, { credentials: 'include', redirect: 'manual' });
			if (res.type === 'opaqueredirect' || res.status === 302 || res.status === 401 || res.status === 403) {
				error = 'Trebuie să fii autentificat ca editor. Formularul este completat cu datele afișate pe pagină.';
				loading = false;
				return;
			}
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				error = (data as { error?: string }).error ?? 'Eroare încărcare';
				loading = false;
				return;
			}
			const data = await res.json().catch(() => ({}));
			const list = (data.socials ?? []) as { name: string; url: string }[];
			const next: Record<string, string> = {};
			for (const { key } of SOCIAL_NETWORKS) {
				const found = list.find((s) => (s.name ?? '').toLowerCase() === key);
				next[key] = found?.url?.trim() ?? '';
			}
			formValues = next;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Eroare încărcare. Verifică că ești autentificat.';
		} finally {
			loading = false;
		}
	}

	async function save() {
		saving = true;
		error = null;
		try {
			const socialsPayload = SOCIAL_NETWORKS.filter(({ key }) => formValues[key]?.trim()).map(
				({ key }) => ({ name: key, url: formValues[key].trim() })
			);
			const res = await fetch('/admin/api/contact/socials', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ locale, socials: socialsPayload })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? 'Eroare salvare');
			open = false;
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Eroare';
		} finally {
			saving = false;
		}
	}

	function close() {
		open = false;
		error = null;
	}
</script>

<div class="group/socials relative inline-flex flex-wrap items-center gap-2">
	{#if socials.length > 0}
		<SocialIcons {socials} {variant} />
	{/if}
	{#if isEditor}
		<button
			type="button"
			class="flex size-8 shrink-0 items-center justify-center rounded-none border border-border bg-background/80 text-muted-foreground opacity-0 transition-opacity group-hover/socials:opacity-100 hover:border-primary hover:bg-primary/10 hover:text-primary"
			onclick={openPopup}
			aria-label="Editează rețele sociale"
		>
			<Pencil class="size-4" />
		</button>
	{/if}
</div>

{#if open}
	<div
		class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Editează rețele sociale"
		tabindex="-1"
		onclick={(e) => e.target === e.currentTarget && close()}
		onkeydown={(e) => e.key === 'Escape' && close()}
	>
		<div class="w-full max-w-md rounded-none border border-border bg-background shadow-xl">
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 class="text-lg font-semibold text-foreground">Rețele sociale</h2>
				<button
					type="button"
					class="rounded-none p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
					onclick={close}
					aria-label="Închide"
				>
					<X class="size-5" />
				</button>
			</div>
			<div class="p-4">
				{#if loading}
					<p class="text-muted-foreground">Se încarcă...</p>
				{:else}
					<p class="mb-4 text-xs text-muted-foreground">
						Rețelele fără URL nu sunt afișate pe site. Modificările se aplică pentru limba selectată ({locale}).
					</p>
					<div class="space-y-3">
						{#each SOCIAL_NETWORKS as { key, label }}
							<div class="space-y-1">
								<Label for="social-{key}" class="text-xs">{label}</Label>
								<Input
									id="social-{key}"
									type="url"
									class="rounded-none"
									placeholder={'https://' + key + '.com/...'}
									bind:value={formValues[key]}
								/>
							</div>
						{/each}
					</div>
					{#if error}
						<p class="mt-3 text-sm text-destructive">{error}</p>
					{/if}
					<div class="mt-4 flex gap-2">
						<Button class="rounded-none" onclick={save} disabled={saving}>
							{saving ? 'Se salvează...' : 'Salvează'}
						</Button>
						<Button variant="outline" class="rounded-none" onclick={close} disabled={saving}>
							Anulare
						</Button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
