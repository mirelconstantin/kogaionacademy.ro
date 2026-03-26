<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toastFromActionWithMessage } from '$lib/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { ActionData, PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let result = $state<ActionData | null>(null);

	function parseUserAgent(ua: string | null): string {
		if (!ua) return 'Dispozitiv necunoscut';
		const value = ua.toLowerCase();
		const browser = value.includes('edg/')
			? 'Edge'
			: value.includes('chrome/')
				? 'Chrome'
				: value.includes('firefox/')
					? 'Firefox'
					: value.includes('safari/') && !value.includes('chrome/')
						? 'Safari'
						: 'Browser necunoscut';
		const os = value.includes('windows')
			? 'Windows'
			: value.includes('mac os')
				? 'macOS'
				: value.includes('android')
					? 'Android'
					: value.includes('iphone') || value.includes('ipad')
						? 'iOS'
						: value.includes('linux')
							? 'Linux'
							: 'OS necunoscut';
		return `${browser} · ${os}`;
	}

	function formatDate(value: string | Date): string {
		return new Date(value).toLocaleString();
	}
</script>

<div class="space-y-8">
	<header class="border-b border-border pb-6">
		<h2 class="text-2xl font-semibold text-foreground">Setări cont</h2>
		<p class="mt-1 text-muted-foreground">
			Aici gestionezi doar contul tău de admin: profil, acces și sesiuni active.
		</p>
	</header>

	<form
		method="POST"
		action="?/updateProfile"
		use:enhance={() => async ({ result: r }) => {
			if (r.type === 'success' || r.type === 'failure') toastFromActionWithMessage(r.data as ActionData, 'Profil actualizat.');
			if (r.type === 'success' && r.data) {
				result = r.data as ActionData;
				if ((r.data as { success?: boolean })?.success) await invalidateAll();
			}
		}}
		class="max-w-xl space-y-6"
	>
		<div class="space-y-2">
			<Label for="name">Nume</Label>
			<Input id="name" name="name" type="text" class="rounded-none" value={data.account.name} />
		</div>
		<div class="space-y-2">
			<Label for="role">Rol curent</Label>
			<Input id="role" type="text" class="rounded-none opacity-80" value={data.account.role} disabled />
		</div>

		{#if result && result.error}
			<p class="text-sm text-destructive">{result.error}</p>
		{/if}
		{#if result && (result as { success?: boolean; action?: string }).success && (result as { action?: string }).action === 'updateProfile'}
			<p class="text-sm text-green-600 dark:text-green-400">Profilul contului a fost actualizat.</p>
		{/if}

		<Button type="submit" class="rounded-none">
			Salvează profilul
		</Button>
	</form>

	<section class="rounded-none border border-border bg-card p-5">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h3 class="text-lg font-medium text-foreground">Sesiuni active</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					Sesiuni active acum: {data.activeSessions}
				</p>
			</div>
			<form
				method="POST"
				action="?/revokeOtherSessions"
				use:enhance={() => async ({ result: r }) => {
					const payload = (r.type === 'success' || r.type === 'failure') ? (r.data as ActionData) : null;
					if (payload) toastFromActionWithMessage(payload, 'Celelalte sesiuni au fost deconectate.');
					if (r.type === 'success' && r.data) {
						result = r.data as ActionData;
						await invalidateAll();
					}
				}}
			>
				<Button type="submit" variant="outline" class="rounded-none">
					Deconectează celelalte sesiuni
				</Button>
			</form>
		</div>

		{#if data.recentSessions.length > 0}
			<ul class="mt-4 space-y-2 text-sm text-muted-foreground">
				{#each data.recentSessions as s (s.id)}
					<li class="rounded-none border border-border/60 bg-muted/30 px-3 py-3">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="space-y-1">
								<p class="font-medium text-foreground">{parseUserAgent(s.userAgent)}</p>
								<p>Creată: {formatDate(s.createdAt)}</p>
								<p>Expiră: {formatDate(s.expiresAt)}</p>
								{#if s.ipAddress}<p>IP: {s.ipAddress}</p>{/if}
								{#if s.isCurrent}
									<p class="text-primary">Sesiunea curentă</p>
								{/if}
							</div>
							{#if !s.isCurrent}
								<form
									method="POST"
									action="?/revokeSession"
									use:enhance={() => async ({ result: r }) => {
										if (r.type === 'success' || r.type === 'failure') toastFromActionWithMessage(r.data as ActionData, 'Sesiune deconectată.');
										if (r.type === 'success' && r.data) {
											result = r.data as ActionData;
											await invalidateAll();
										}
									}}
								>
									<input type="hidden" name="sessionId" value={s.id} />
									<Button type="submit" variant="outline" class="rounded-none">
										Deconectează
									</Button>
								</form>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-2 text-sm text-muted-foreground">Nu există sesiuni recente.</p>
		{/if}
	</section>
</div>
