<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FileText from '@lucide/svelte/icons/file-text';
	import Users from '@lucide/svelte/icons/users';
	import Newspaper from '@lucide/svelte/icons/newspaper';
	import History from '@lucide/svelte/icons/history';
	import Image from '@lucide/svelte/icons/image';
	import Settings from '@lucide/svelte/icons/settings';
	import Mail from '@lucide/svelte/icons/mail';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const displayName = $derived(
		data?.user?.name || (data?.user as { email?: string })?.email?.split('@')[0] || 'Editor'
	);
	const permissions = $derived((data as { permissions?: string[] }).permissions ?? []);

	const cards = $derived([
		...(permissions.includes('pages.view')
			? [{ href: '/admin/pages', label: 'Pagini', icon: FileText, desc: 'Principală, Despre, Programe, Contact' }]
			: []),
		...(permissions.includes('history.view')
			? [{ href: '/admin/history', label: 'Istoric modificări', icon: History, desc: 'Istoricul modificărilor din CMS' }]
			: []),
		...(permissions.includes('mentors.view')
			? [{ href: '/admin/mentors', label: 'Mentori', icon: Users, desc: 'Mentori, biografii și imagini' }]
			: []),
		...(permissions.includes('forms.view')
			? [
					{
						href: '/admin/forms',
						label: 'Formulare',
						icon: ClipboardList,
						desc: 'Definiții, răspunsuri, analiză și export'
					}
				]
			: []),
		...(permissions.includes('blog.view')
			? [{ href: '/admin/blog', label: 'Blog', icon: Newspaper, desc: 'Articole (draft, programat, publicat)' }]
			: []),
		...(permissions.includes('media.view')
			? [{ href: '/admin/media', label: 'Media', icon: Image, desc: 'Imagini și video' }]
			: []),
		...(permissions.includes('pages.view')
			? [{ href: '/admin/contact', label: 'Contact', icon: Mail, desc: 'Date contact și social' }]
			: []),
		...(permissions.includes('team.view')
			? [{ href: '/admin/team', label: 'Echipa', icon: Users, desc: 'Utilizatori și invitații' }]
			: []),
		...(permissions.includes('settings.view')
			? [{ href: '/admin/settings', label: 'Setări', icon: Settings, desc: 'Nume site, meta, SEO' }]
			: [])
	]);

	const kpi = $derived(data?.kpi ?? null);
	const needsAttention = $derived(data?.needsAttention ?? { draftsWithoutImage: [], expiredInvites: [] });
	const hasAlerts = $derived(
		(needsAttention.draftsWithoutImage?.length ?? 0) + (needsAttention.expiredInvites?.length ?? 0) > 0
	);
</script>

<div class="space-y-8">
	<header class="border-b border-border pb-6">
		<h2 class="text-2xl font-semibold text-foreground">Panou de administrare</h2>
		<p class="mt-1 text-muted-foreground">
			Bine ai venit, <strong class="text-foreground">{displayName}</strong>. Rezumat detaliat al stării site-ului.
		</p>
	</header>

	{#if kpi}
		<section aria-labelledby="kpi-heading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<h3 id="kpi-heading" class="sr-only">Indicatori</h3>
			{#if permissions.includes('blog.view')}
				<div class="rounded-none border border-border bg-card p-5 shadow-sm">
					<p class="text-sm font-medium text-muted-foreground">Articole publicate</p>
					<p class="mt-1 text-2xl font-semibold text-foreground">{kpi.publishedPosts}</p>
					<p class="mt-1 text-xs text-muted-foreground">
						Draft: {kpi.draftPosts}, Programate: {kpi.scheduledPosts}
					</p>
					<p class="text-xs text-muted-foreground">
						Publicate în 24h: {kpi.publishedLast24h}
					</p>
				</div>
			{/if}
			{#if permissions.includes('programs.view')}
				<div class="rounded-none border border-border bg-card p-5 shadow-sm">
					<p class="text-sm font-medium text-muted-foreground">Programe active</p>
					<p class="mt-1 text-2xl font-semibold text-foreground">{kpi.programsCount}</p>
					<p class="mt-1 text-xs text-muted-foreground">Draft: {kpi.programDrafts}</p>
				</div>
			{/if}
			<div class="rounded-none border border-border bg-card p-5 shadow-sm">
				<p class="text-sm font-medium text-muted-foreground">Useri activi pe site</p>
				<p class="mt-1 text-2xl font-semibold text-foreground">{kpi.activeSiteUsers}</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Conturi logate active: {kpi.activeLoggedUsers}
				</p>
				<p class="text-xs text-muted-foreground">
					Admini logați: {kpi.activeAdminUsers}
				</p>
			</div>
			{#if permissions.includes('history.view') || permissions.includes('team.view')}
				<div class="rounded-none border border-border bg-card p-4 shadow-sm">
					<p class="text-sm font-medium text-muted-foreground">Activitate 24h</p>
					<p class="mt-1 text-xl font-semibold text-foreground">{kpi.changes24h}</p>
					<p class="mt-1 text-xs text-muted-foreground">
						CMS 24h
					</p>
					{#if permissions.includes('team.view')}
						<p class="text-xs text-muted-foreground">
							Invitații: {kpi.pendingInvites}
						</p>
					{/if}
				</div>
			{/if}
		</section>
	{/if}

	{#if hasAlerts}
		<section class="rounded-none border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30" aria-labelledby="alerts-heading">
			<h3 id="alerts-heading" class="flex items-center gap-2 text-lg font-medium text-amber-800 dark:text-amber-200">
				<AlertCircle class="size-5" />
				Atenție
			</h3>
			<ul class="mt-2 list-inside space-y-1 text-sm text-amber-700 dark:text-amber-300">
				{#if (needsAttention.draftsWithoutImage?.length ?? 0) > 0}
					<li>
						{needsAttention.draftsWithoutImage.length} articol(e) draft fără imagine de prezentare.
						<a href="/admin/blog" class="underline hover:no-underline">Vezi blog</a>
					</li>
				{/if}
				{#if (needsAttention.expiredInvites?.length ?? 0) > 0}
					<li>
						{needsAttention.expiredInvites.length} invitație(ii) expirat(e).
						<a href="/admin/team" class="underline hover:no-underline">Vezi echipa</a>
					</li>
				{/if}
			</ul>
		</section>
	{/if}

	<section aria-labelledby="sectiuni-heading">
		<h3 id="sectiuni-heading" class="mb-4 text-lg font-medium text-foreground">Secțiuni de conținut</h3>
		<div class="grid gap-4 sm:grid-cols-2">
			{#each cards as card (card.href)}
				{@const Icon = card.icon}
				<a
					href={card.href}
					class="flex items-start gap-4 rounded-none border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow"
				>
					<div
						class="flex size-11 shrink-0 items-center justify-center rounded-none border border-border bg-muted/50"
					>
						<Icon class="size-5 text-muted-foreground" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="font-medium text-foreground">{card.label}</p>
						<p class="mt-1 text-sm leading-snug text-muted-foreground">{card.desc}</p>
					</div>
					<ChevronRight class="mt-1 size-5 shrink-0 text-muted-foreground" />
				</a>
			{/each}
		</div>
	</section>
</div>
