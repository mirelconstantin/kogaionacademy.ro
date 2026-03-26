<script lang="ts">
	import { page } from '$app/state';
	import AdminBar from '$lib/components/AdminBar.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import FileStack from '@lucide/svelte/icons/file-stack';
	import Users from '@lucide/svelte/icons/users';
	import UsersRound from '@lucide/svelte/icons/users-round';
	import History from '@lucide/svelte/icons/history';
	import Newspaper from '@lucide/svelte/icons/newspaper';
	import Image from '@lucide/svelte/icons/image';
	import Mail from '@lucide/svelte/icons/mail';
	import Settings from '@lucide/svelte/icons/settings';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Scale from '@lucide/svelte/icons/scale';

	let { children, data } = $props();

	const permissions = $derived((data as { permissions?: string[] }).permissions ?? []);

	const allNav = [
		{ href: '/admin', label: 'Panou', icon: LayoutDashboard, permission: 'dashboard.view' as const },
		{ href: '/admin/pages', label: 'Pagini', icon: FileStack, permission: 'pages.view' as const },
		{ href: '/admin/media', label: 'Media', icon: Image, permission: 'media.view' as const },
		{ href: '/admin/history', label: 'Istoric acțiuni', icon: History, permission: 'history.view' as const },
		{ href: '/admin/mentors', label: 'Mentori', icon: Users, permission: 'mentors.view' as const },
		{ href: '/admin/forms', label: 'Formulare', icon: ClipboardList, permission: 'forms.view' as const },
		{ href: '/admin/legal', label: 'Politici & GDPR', icon: Scale, permission: 'pages.view' as const },
		{ href: '/admin/blog', label: 'Blog', icon: Newspaper, permission: 'blog.view' as const },
		{ href: '/admin/team', label: 'Echipa', icon: UsersRound, permission: 'team.view' as const },
		{ href: '/admin/settings', label: 'Setări', icon: Settings, permission: 'settings.view' as const }
	];
	const nav = $derived(allNav.filter((item) => permissions.includes(item.permission)));
</script>

<div class="min-h-dvh bg-muted/30">
	{#if data?.user}
		<Tooltip.Provider delayDuration={0}>
			<div class="sticky top-0 z-[100] shrink-0">
				<AdminBar
					user={data.user}
					callbackURL="/admin"
					editPageUrl={null}
					isAdminContext={true}
					pathname={page.url.pathname}
					viewOnSite={data.viewOnSite ?? null}
				/>
			</div>
		</Tooltip.Provider>
	{/if}
	<div class="mx-auto flex max-w-6xl gap-8 px-6 py-6">
		<aside class="w-56 shrink-0">
			<nav class="flex flex-col gap-1" aria-label="Admin navigation">
				{#each nav as item (item.href + item.permission)}
					{@const Icon = item.icon}
					{@const isActive =
						item.href === '/admin'
							? page.url.pathname === '/admin'
							: page.url.pathname.startsWith(item.href)}
					<a
						href={item.href}
						class="flex items-center gap-2 rounded-none border border-transparent px-3 py-2 text-sm font-medium transition-colors {isActive
							? 'border-primary bg-primary/10 text-primary'
							: 'text-foreground hover:bg-muted'}"
					>
						<Icon class="size-4" />
						{item.label}
						<ChevronRight class="ml-auto size-4 opacity-50" />
					</a>
				{/each}
			</nav>
		</aside>
		<main class="min-w-0 flex-1">
			{@render children()}
		</main>
	</div>
</div>
