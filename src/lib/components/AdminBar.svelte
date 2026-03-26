<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { contentHref } from '$lib/content-routes';
	import Avatar from '$lib/components/ui/avatar/avatar.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { hideEditIcons } from '$lib/stores/hide-edit-icons';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Pencil from '@lucide/svelte/icons/pencil';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Eye from '@lucide/svelte/icons/eye';
	import Home from '@lucide/svelte/icons/home';
	import FilePlus from '@lucide/svelte/icons/file-plus';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';

	/** Etichetă unică pentru linkul de editare pe site-ul public */
	const EDIT_LINK_TEXT = 'Editează';

	let {
		user,
		callbackURL = '/admin',
		editPageUrl = null,
		isAdminContext = false,
		pathname = '',
		viewOnSite = null
	}: {
		user: { name: string; email: string; image?: string | null };
		callbackURL?: string;
		editPageUrl?: string | null;
		isAdminContext?: boolean;
		pathname?: string;
		viewOnSite?: { url: string; label: string } | null;
	} = $props();

	const ADMIN_SECTION_LABELS: Record<string, string> = {
		'/admin': 'Panou',
		'/admin/history': 'Istoric',
		'/admin/media': 'Media',
		'/admin/pages': 'Pagini',
		'/admin/pages/home': 'Pagina principală',
		'/admin/pages/about': 'Despre',
		'/admin/pages/programs': 'Programe',
		'/admin/mentors': 'Mentori',
		'/admin/blog': 'Blog',
		'/admin/contact': 'Contact',
		'/admin/legal': 'Politici & GDPR',
		'/admin/team': 'Echipa',
		'/admin/settings': 'Setări'
	};

	const currentSectionLabel = $derived.by(() => {
		if (!pathname) return null;
		if (pathname === '/admin') return 'Panou';
		if (pathname.startsWith('/admin/programs/')) return 'Editează program';
		if (pathname.startsWith('/admin/blog/new')) return 'Articol nou';
		if (pathname.startsWith('/admin/blog/')) return 'Editează articol';
		const sorted = Object.entries(ADMIN_SECTION_LABELS)
			.filter(([p]) => p !== '/admin')
			.sort(([a], [b]) => b.length - a.length);
		for (const [p, label] of sorted) {
			if (pathname.startsWith(p)) return label;
		}
		return null;
	});

	type BreadcrumbItem = { href?: string; label: string };
	const breadcrumbs = $derived.by((): BreadcrumbItem[] => {
		if (!pathname || !isAdminContext) return [];
		const out: BreadcrumbItem[] = [{ href: '/admin', label: 'Panou' }];
		if (pathname === '/admin') return out;
		if (pathname.startsWith('/admin/programs/')) {
			out.push({ href: '/admin/pages/programs', label: 'Programe' });
			out.push({ label: 'Editează program' });
			return out;
		}
		if (pathname.startsWith('/admin/blog/new')) {
			out.push({ href: '/admin/blog', label: 'Blog' });
			out.push({ label: 'Articol nou' });
			return out;
		}
		if (pathname.startsWith('/admin/blog/')) {
			out.push({ href: '/admin/blog', label: 'Blog' });
			out.push({ label: 'Editează articol' });
			return out;
		}
		if (pathname === '/admin/pages' || pathname.startsWith('/admin/pages/')) {
			out.push({ href: '/admin/pages', label: 'Pagini' });
			if (pathname !== '/admin/pages') {
				const label = ADMIN_SECTION_LABELS[pathname];
				out.push(label ? { href: pathname, label } : { label: currentSectionLabel ?? pathname });
			}
			return out;
		}
		const label = ADMIN_SECTION_LABELS[pathname];
		if (label) out.push({ href: pathname, label });
		else out.push({ label: currentSectionLabel ?? pathname });
		return out;
	});

	type BackLink = { href: string; label: string };
	const backLink = $derived.by((): BackLink | null => {
		if (!isAdminContext || !pathname) return null;
		if (pathname.startsWith('/admin/blog/')) return { href: '/admin/blog', label: 'Înapoi la Blog' };
		if (pathname.startsWith('/admin/programs/'))
			return { href: '/admin/pages/programs', label: 'Înapoi la Programe' };
		return null;
	});

	let activeCount = $state<number>(0);
	const displayName = $derived(user.name || user.email?.split('@')[0] || 'Utilizator');
	const avatarInitial = $derived(
		(displayName.split(/\s+/)[0] ?? displayName)[0]?.toUpperCase() ?? '?'
	);

	$effect(() => {
		if (!browser) return;
		function fetchActive() {
			fetch('/api/active-users?ping=1')
				.then((r) => r.json())
				.then((d) => {
					if (typeof d?.count === 'number') activeCount = d.count;
				})
				.catch(() => {});
		}
		fetchActive();
		const id = setInterval(fetchActive, 30_000);
		return () => clearInterval(id);
	});

	$effect(() => {
		if (!browser || !user?.image) return;
		const img = new Image();
		img.src = user.image;
	});

	function toggleHideIcons() {
		hideEditIcons.update((v) => !v);
	}

	const breadcrumbText = $derived(
		breadcrumbs.map((b) => b.label).join(' › ')
	);
</script>

<!-- Mobile: single row — Panou/Site cu text; nume lângă avatar; edit = icon lângă meniu -->
<div
	class="admin-bar-mobile flex items-center justify-between gap-1.5 border-b border-border bg-card px-2 py-1 text-sm sm:hidden"
>
	<div class="flex min-w-0 flex-1 items-center gap-2">
		{#if isAdminContext}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<a
						href={viewOnSite?.url ?? contentHref('home')}
						class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-none border border-border bg-background px-2 py-0 text-xs font-medium text-foreground transition-colors hover:bg-muted"
						aria-label="Deschide site-ul public"
					>
						<Home class="size-4 shrink-0" />
						<span>Site</span>
					</a>
				</Tooltip.Trigger>
				<Tooltip.Content>Deschide site-ul public</Tooltip.Content>
			</Tooltip.Root>
		{:else}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<a
						href={callbackURL}
						class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-none border border-border bg-background px-2 py-0 text-xs font-medium text-foreground transition-colors hover:bg-muted"
						aria-label="Panou administrativ"
					>
						<LayoutDashboard class="size-4 shrink-0" />
						<span>Panou</span>
					</a>
				</Tooltip.Trigger>
				<Tooltip.Content>Mergi la dashboard-ul administrativ</Tooltip.Content>
			</Tooltip.Root>
		{/if}
		<div class="flex min-w-0 items-center gap-2">
			<Avatar src={user.image} alt={displayName} fallback={avatarInitial} size="sm" />
			<strong class="min-w-0 truncate text-xs font-semibold text-foreground" title={displayName}>
				{displayName}
			</strong>
		</div>
	</div>

	<div class="flex shrink-0 items-center gap-1">
		{#if !isAdminContext && editPageUrl}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<a
						href={editPageUrl}
						class="inline-flex h-9 max-w-[38vw] shrink-0 items-center gap-1 rounded-none border border-primary bg-primary/10 px-2 py-0 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
						aria-label={EDIT_LINK_TEXT}
					>
						<Pencil class="size-3.5 shrink-0" />
						<span class="truncate">{EDIT_LINK_TEXT}</span>
					</a>
				</Tooltip.Trigger>
				<Tooltip.Content>Deschide panoul de editare pentru această pagină</Tooltip.Content>
			</Tooltip.Root>
		{/if}

	<details class="admin-bar-more relative z-[110] shrink-0">
		<summary
			class="flex size-9 cursor-pointer list-none items-center justify-center rounded-none border border-border bg-background text-foreground hover:bg-muted [&::-webkit-details-marker]:hidden"
			aria-label="Mai multe opțiuni admin"
		>
			<EllipsisVertical class="size-4" />
		</summary>
		<div
			class="absolute right-0 z-[120] mt-1 flex min-w-[16rem] max-w-[min(18rem,calc(100vw-1rem))] flex-col gap-2 border border-border bg-card p-3 text-sm shadow-lg"
		>
			<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<span class="inline-block size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true"></span>
				{activeCount} activi (ultimele 5 min)
			</p>

			{#if isAdminContext}
				{#if backLink}
					<a
						href={backLink.href}
						class="inline-flex items-center gap-2 rounded-none border border-border bg-background px-3 py-2 text-foreground hover:bg-muted"
					>
						<ArrowLeft class="size-4 shrink-0" />
						{backLink.label}
					</a>
				{/if}
				<a
					href="/admin/blog/new"
					class="inline-flex items-center gap-2 rounded-none border border-border bg-background px-3 py-2 text-foreground hover:bg-muted"
				>
					<FilePlus class="size-4 shrink-0" />
					Articol nou
				</a>
				<a
					href="/admin/media"
					class="inline-flex items-center gap-2 rounded-none border border-border bg-background px-3 py-2 text-foreground hover:bg-muted"
				>
					<ImagePlus class="size-4 shrink-0" />
					Media
				</a>
				{#if breadcrumbs.length > 0}
					<p class="text-xs text-muted-foreground">{breadcrumbText}</p>
				{/if}
			{:else}
				<button
					type="button"
					class="inline-flex w-full items-center justify-center gap-2 rounded-none border px-3 py-2 text-left text-xs font-medium transition-colors {$hideEditIcons
						? 'border-primary bg-primary/10 text-primary'
						: 'border-border bg-background text-foreground hover:bg-muted'}"
					aria-pressed={$hideEditIcons}
					onclick={() => toggleHideIcons()}
				>
					{#if $hideEditIcons}
						<EyeOff class="size-4 shrink-0" />
						Afișează buton editare
					{:else}
						<Eye class="size-4 shrink-0" />
						Ascunde buton editare
					{/if}
				</button>
			{/if}

			<form method="POST" action="/login?/signOut" use:enhance class="border-t border-border pt-2">
				<button
					type="submit"
					class="inline-flex w-full items-center justify-center gap-2 rounded-none border border-border bg-background px-3 py-2 font-medium text-foreground hover:bg-muted"
				>
					<LogOut class="size-4" />
					Deconectare
				</button>
			</form>
		</div>
	</details>
	</div>
</div>

<!-- Desktop / tablet -->
<div
	class="hidden flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 text-sm sm:flex"
>
	<div class="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:gap-4">
		{#if isAdminContext}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<a
						href={viewOnSite?.url ?? contentHref('home')}
						class="inline-flex items-center gap-1.5 rounded-none border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-muted"
					>
						<Home class="size-4" />
						Site
					</a>
				</Tooltip.Trigger>
				<Tooltip.Content>Deschide site-ul public</Tooltip.Content>
			</Tooltip.Root>
			<span class="hidden h-4 w-px bg-border md:block" aria-hidden="true"></span>
		{:else}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<a
						href={callbackURL}
						class="inline-flex items-center gap-1.5 rounded-none border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-muted"
					>
						<LayoutDashboard class="size-4" />
						Panou
					</a>
				</Tooltip.Trigger>
				<Tooltip.Content>Mergi la dashboard-ul administrativ</Tooltip.Content>
			</Tooltip.Root>
			<span class="hidden h-4 w-px bg-border md:block" aria-hidden="true"></span>
		{/if}
		<div class="flex items-center gap-2">
			<Avatar src={user.image} alt={displayName} fallback={avatarInitial} size="sm" />
			<span class="text-foreground">
				Autentificat ca <strong>{displayName}</strong>
			</span>
		</div>

		<span class="hidden h-4 w-px bg-border lg:block" aria-hidden="true"></span>

		<Tooltip.Root>
			<Tooltip.Trigger class="flex cursor-default items-center gap-1.5 text-muted-foreground">
				<span class="inline-block size-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
				<span>{activeCount} activi</span>
			</Tooltip.Trigger>
			<Tooltip.Content>Utilizatori activi în ultimele 5 minute</Tooltip.Content>
		</Tooltip.Root>

		<span class="hidden h-4 w-px bg-border lg:block" aria-hidden="true"></span>

		{#if isAdminContext && breadcrumbs.length > 0}
			<nav
				aria-label="Breadcrumb"
				class="flex max-w-full min-w-0 items-center gap-1.5 overflow-x-auto rounded-none border border-border bg-muted/50 px-2.5 py-1 text-muted-foreground"
			>
				{#each breadcrumbs as item, i (item.href ?? item.label + i)}
					{#if i > 0}
						<span aria-hidden="true" class="shrink-0 opacity-60">›</span>
					{/if}
					{#if item.href}
						<a href={item.href} class="shrink-0 transition-colors hover:text-foreground">{item.label}</a>
					{:else}
						<span class="shrink-0 font-medium text-foreground">{item.label}</span>
					{/if}
				{/each}
			</nav>
		{:else if !isAdminContext}
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<button
							type="button"
							class="inline-flex size-9 items-center justify-center rounded-none border transition-colors {$hideEditIcons
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border bg-background text-foreground hover:bg-muted'}"
							aria-pressed={$hideEditIcons}
							aria-label={$hideEditIcons ? 'Afișează buton editare' : 'Ascunde buton editare'}
							{...props}
							onclick={(e) => {
								toggleHideIcons();
								if (typeof props.onClick === 'function') props.onClick(e);
							}}
						>
							{#if $hideEditIcons}
								<EyeOff class="size-4" />
							{:else}
								<Eye class="size-4" />
							{/if}
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>
					{$hideEditIcons ? 'Afișează buton editare' : 'Ascunde buton editare'}
				</Tooltip.Content>
			</Tooltip.Root>
		{/if}
	</div>

	<div class="flex shrink-0 flex-wrap items-center gap-2">
		{#if isAdminContext}
			{#if backLink}
				<Tooltip.Root>
					<Tooltip.Trigger>
						<a
							href={backLink.href}
							class="inline-flex items-center gap-1.5 rounded-none border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-muted"
						>
							<ArrowLeft class="size-4" />
							<span class="hidden sm:inline">{backLink.label}</span>
						</a>
					</Tooltip.Trigger>
					<Tooltip.Content>{backLink.label}</Tooltip.Content>
				</Tooltip.Root>
			{/if}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<a
						href="/admin/blog/new"
						class="inline-flex items-center gap-1.5 rounded-none border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-muted"
					>
						<FilePlus class="size-4" />
						<span class="hidden md:inline">Articol nou</span>
					</a>
				</Tooltip.Trigger>
				<Tooltip.Content>Creează un articol nou de blog</Tooltip.Content>
			</Tooltip.Root>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<a
						href="/admin/media"
						class="inline-flex items-center gap-1.5 rounded-none border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-muted"
					>
						<ImagePlus class="size-4" />
						<span class="hidden md:inline">Media</span>
					</a>
				</Tooltip.Trigger>
				<Tooltip.Content>Administrare și încărcare fișiere media</Tooltip.Content>
			</Tooltip.Root>
		{:else if editPageUrl}
			<Tooltip.Root>
				<Tooltip.Trigger>
					<a
						href={editPageUrl}
						class="inline-flex items-center gap-1.5 rounded-none border border-primary bg-primary/10 px-3 py-1.5 font-medium text-primary transition-colors hover:bg-primary/20"
					>
						<Pencil class="size-4" />
						{EDIT_LINK_TEXT}
					</a>
				</Tooltip.Trigger>
				<Tooltip.Content>Deschide panoul de editare pentru această pagină</Tooltip.Content>
			</Tooltip.Root>
		{/if}
		<form method="POST" action="/login?/signOut" use:enhance class="inline">
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<button
							type="submit"
							class="inline-flex items-center gap-1.5 rounded-none border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-muted"
							title="Deconectare din cont"
							{...props}
						>
							<LogOut class="size-4" />
							<span class="hidden sm:inline">Deconectare</span>
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>Deconectare din cont</Tooltip.Content>
			</Tooltip.Root>
		</form>
	</div>
</div>
