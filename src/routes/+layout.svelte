<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import './layout.css';
	import Footer from '$lib/components/Footer.svelte';
	import AdminBar from '$lib/components/AdminBar.svelte';
	import GlobalLightview from '$lib/components/GlobalLightview.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	// Toaster loads svelte-sonner which uses .svelte files — load only in browser to avoid SSR ERR_UNKNOWN_FILE_EXTENSION
	import { navAccentColor } from '$lib/stores/nav-accent';
	import { adminBarLayoutHeightPx } from '$lib/stores/admin-bar-layout';

	let { children, data } = $props();

	let adminBarWrapperHeight = $state(0);
	const showPublicAdminBar = $derived(!!(data?.isEditor && data?.user));

	$effect(() => {
		if (!browser) return;
		if (showPublicAdminBar) {
			adminBarLayoutHeightPx.set(adminBarWrapperHeight);
			document.documentElement.style.setProperty('--admin-bar-height', `${adminBarWrapperHeight}px`);
		} else {
			adminBarLayoutHeightPx.set(0);
			document.documentElement.style.setProperty('--admin-bar-height', '0px');
		}
	});

	const editPageUrl = $derived.by(() => {
		const path = page?.url?.pathname ?? '';
		if (path.startsWith('/blog/') && path !== '/blog') {
			const post = (data as { post?: { id?: number } } | undefined)?.post;
			if (post?.id != null) return `/admin/blog/${post.id}`;
		}
		// Program detail page: /programs/slug or /programe/slug (or with locale prefix)
		const segments = path.split('/').filter(Boolean);
		const isProgramDetail =
			(segments.includes('programs') || segments.includes('programe')) &&
			segments.length > 1 &&
			segments[segments.length - 1] !== 'programs' &&
			segments[segments.length - 1] !== 'programe';
		if (isProgramDetail) {
			const program = (data as { program?: { id?: number } } | undefined)?.program;
			if (program?.id != null) return `/admin/programs/${program.id}`;
		}
		// Specific pages first (before generic locale check)
		if (path.includes('despre') || path.includes('about')) return '/admin/pages/about';
		if (path.includes('programe') || path.includes('programs')) return '/admin/pages/programs';
		if (path.includes('mentori') || path.includes('mentors')) return '/admin/mentors';
		if (path.includes('blog')) return '/admin/blog';
		if (path.includes('contact')) return '/admin/contact';
		// Politici & GDPR (o singură pagină admin pentru toate)
		if (
			path.includes('politica-cookie-uri') ||
			path.includes('politica-de-confidentialitate') ||
			path.includes('termeni-si-conditii') ||
			path.includes('preferinte-cookie')
		) {
			return '/admin/legal';
		}
		// Home: only / or single segment ro|en (no extra segments like programe)
		if (path === '/' || (segments.length === 1 && (segments[0] === 'ro' || segments[0] === 'en'))) return '/admin/pages/home';
		return null;
	});

	const currentPath = $derived(page?.url?.pathname ?? '');
	const isHomePath = $derived(currentPath === '/');
	const isBlogPath = $derived(currentPath.includes('blog'));
	const layoutNavAccent = $derived(
		isHomePath ? 'var(--brand-blue)' : isBlogPath ? 'var(--brand-green)' : '#154b6a'
	);

	$effect(() => {
		if (!browser || !currentPath) return;
		$navAccentColor = layoutNavAccent;
	});
</script>

<svelte:head>
	<link rel="icon" href="/media/uploads/brand/logo.webp" type="image/webp" />
	{#if data?.user?.image}
		<link rel="preload" href={data.user.image} as="image" />
	{/if}
</svelte:head>

{#if page?.url?.pathname?.startsWith('/admin')}
	{@render children()}
{:else}
	<Tooltip.Provider delayDuration={0}>
		{#if data?.isEditor && data?.user}
			<div
				class="sticky top-0 z-[100] border-b border-border bg-card"
				bind:clientHeight={adminBarWrapperHeight}
			>
				<AdminBar user={data.user} callbackURL="/admin" editPageUrl={editPageUrl} />
			</div>
		{/if}
		{#if browser}
			{#await import('$lib/components/Navigation.svelte') then { default: Navigation }}
				<Navigation
					adminBarVisible={showPublicAdminBar}
					adminBarHeightPx={showPublicAdminBar ? adminBarWrapperHeight : 0}
					socials={data?.contactSocials ?? []}
				/>
			{/await}
		{/if}
		{#if data?.isEditor}
			{#await import('$lib/components/cms/InlineEditOverlay.svelte') then { default: InlineEditOverlay }}
				<InlineEditOverlay isEditor={true} />
			{/await}
		{/if}
		<GlobalLightview />
		{#if browser}
			{#await import('$lib/components/ConsentBanner.svelte') then { default: ConsentBanner }}
				<ConsentBanner
					title={data?.consentBanner?.title}
					bodyHtml={data?.consentBanner?.bodyHtml ?? ''}
					cookiePolicyHref={data?.consentBanner?.cookiePolicyHref ?? '/politica-cookie-uri'}
					privacyPolicyHref={data?.consentBanner?.privacyPolicyHref ?? '/politica-de-confidentialitate'}
				/>
			{/await}
		{/if}
		{@render children()}
		<Footer
			contactEmail={data?.contactEmail}
			contactPhone={data?.contactPhone}
			contactAddress={data?.contactAddress}
			socials={data?.contactSocials ?? []}
			isEditor={data?.isEditor ?? false}
			locale={data?.locale ?? 'ro'}
			legalCookieHref="/politica-cookie-uri"
			legalPrivacyHref="/politica-de-confidentialitate"
			legalTermsHref="/termeni-si-conditii"
		/>
	</Tooltip.Provider>
{/if}
{#if browser}
		{#await import('$lib/components/ui/sonner') then { Toaster }}
			<Toaster />
		{/await}
	{/if}
