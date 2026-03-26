<script lang="ts">
	import { page } from '$app/state';
	import { getLocale, locales } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import { navAccentColor } from '$lib/stores/nav-accent';
	import { contentHref, localizedPathForSwitch } from '$lib/content-routes';
	import { PUBLIC_SITE_LOCALE_LOCKED_RO } from '$lib/site-i18n';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import { fly } from 'svelte/transition';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Instagram from '@lucide/svelte/icons/instagram';
	import Facebook from '@lucide/svelte/icons/facebook';
	import Linkedin from '@lucide/svelte/icons/linkedin';
	import Youtube from '@lucide/svelte/icons/youtube';
	import Twitter from '@lucide/svelte/icons/twitter';
	import Globe from '@lucide/svelte/icons/globe';

	type SocialEntry = { name: string; url: string };
	let {
		adminBarVisible = false,
		adminBarHeightPx = 0,
		socials = [] as SocialEntry[]
	} = $props();

	const accentColor = $derived($navAccentColor);
	/** Offset = înălțimea măsurată a barei admin; până la primul bind folosim 48px ca să nu se suprapună nav-ul */
	const navTopPx = $derived(
		adminBarVisible ? (adminBarHeightPx > 0 ? adminBarHeightPx : 48) : 0
	);
	let menuVisible = $state(false);
	let menuClosing = $state(false);
	let scrollY = $state(0);
	let menuHoverTimeout: ReturnType<typeof setTimeout> | null = null;

	const menuHoverDelayMs = 800;
	const menuTransitionMs = 380;

	function startMenuHoverTimer() {
		menuHoverTimeout = setTimeout(() => {
			openMenu();
			menuHoverTimeout = null;
		}, menuHoverDelayMs);
	}

	function cancelMenuHoverTimer() {
		if (menuHoverTimeout) {
			clearTimeout(menuHoverTimeout);
			menuHoverTimeout = null;
		}
	}

	function openMenu() {
		menuClosing = false;
		menuVisible = true;
	}

	function closeMenu() {
		menuClosing = true;
		menuVisible = false;
		setTimeout(() => {
			menuClosing = false;
		}, menuTransitionMs);
	}

	const isAboutPage = $derived(
		page.url.pathname.includes('about') || page.url.pathname.includes('despre')
	);
	const isProgramsPage = $derived(
		page.url.pathname.includes('programs') || page.url.pathname.includes('programe')
	);
	const isBlogPage = $derived(page.url.pathname.includes('blog'));
	const isPolicyLikePage = $derived.by(() => {
		const path = page.url.pathname.toLowerCase();
		return (
			path.includes('politica-de-confidentialitate') ||
			path.includes('politica-cookie-uri') ||
			path.includes('preferinte-cookie') ||
			path.includes('termeni-si-conditii') ||
			path.includes('privacy') ||
			path.includes('policy') ||
			path.includes('cookie') ||
			path.includes('terms')
		);
	});
	/** Doar index blog (/blog, /ro/blog) — hero închis; articolul are fundal deschis */
	const isBlogListingPage = $derived.by(() => {
		const segments = page.url.pathname.split('/').filter(Boolean);
		const last = segments.at(-1);
		return last === 'blog';
	});
	const isBlogArticlePage = $derived(isBlogPage && !isBlogListingPage);
	/** Pagini cu fundal deschis sus: politici + articol blog */
	const isLightTopPage = $derived(isPolicyLikePage || isBlogArticlePage);
	const currentAccent = $derived(isAboutPage || isProgramsPage ? '#154b6a' : accentColor);
	const currentLocale = $derived(getLocale());
	const scrolled = $derived(scrollY > 0);
	const menuActive = $derived(menuVisible || menuClosing);
	/** La scroll: politici rămân bară albastră; blog (inclusiv listă) păstrează accentul din store (verde pe blog) */
	const scrolledNavAccent = $derived(isPolicyLikePage ? 'var(--brand-blue)' : currentAccent);
	const navTitleClass = $derived(
		isLightTopPage ? (scrolled ? 'text-white' : 'text-[#0c3044]') : 'text-white'
	);
	/** La scroll: slogan verde peste tot site-ul; fără scroll: albastru pe pagini deschise sus, altfel alb pe hero */
	const navSloganClass = $derived(
		scrolled
			? 'text-[var(--brand-green)]'
			: isLightTopPage
				? 'text-[var(--brand-blue)]'
				: 'text-white/78'
	);
	const overlaySloganClass = $derived('text-white/78');

	const localeFlags: Record<string, string> = { en: '🇬🇧', ro: '🇷🇴' };

	type MenuItemWithPreview = { href: string; label: string; image: string; caption: string };
	const menuItems: MenuItemWithPreview[] = [
		{ href: contentHref('home'), label: 'Acasă', image: '/media/uploads/home/hero-poster.webp', caption: m.menu_tagline() },
		{ href: contentHref('about'), label: 'Despre', image: '/media/uploads/about/age-13-18.webp', caption: 'Despre' },
		{ href: contentHref('mentors'), label: 'Mentori', image: '/media/uploads/about/age-3-6.webp', caption: 'Mentori' },
		{ href: contentHref('programs'), label: 'Programe', image: '/media/uploads/about/age-7-12.webp', caption: 'Programe' },
		{ href: contentHref('blog'), label: 'Blog', image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80', caption: 'Blog' },
		{ href: contentHref('contact'), label: 'Contact', image: '/media/uploads/home/hero-poster.webp', caption: 'Contact' }
	];
	let hoveredItem = $state<MenuItemWithPreview | null>(null);
	const displayItem = $derived(hoveredItem ?? menuItems[0]);
	const isSloganPreview = $derived(displayItem.caption === m.menu_tagline());
	const socialOrder = ['instagram', 'facebook', 'linkedin', 'youtube', 'twitter', 'x', 'tiktok'];
	const normalizedSocials = $derived.by(() => {
		return socials
			.filter((s) => s?.name && s?.url)
			.filter((s) => s.url.trim().length > 0)
			.sort((a, b) => {
				const aKey = a.name.toLowerCase().replace(/\s+/g, '');
				const bKey = b.name.toLowerCase().replace(/\s+/g, '');
				const aIndex = socialOrder.indexOf(aKey);
				const bIndex = socialOrder.indexOf(bKey);
				return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
			});
	});

	function handleLocaleChange(newLocale: string | undefined) {
		if (newLocale && newLocale !== getLocale()) {
			window.location.href = localizedPathForSwitch(page.url.pathname, newLocale);
		}
	}
</script>

<svelte:window
	bind:scrollY
	onkeydown={(e) => {
		if (menuVisible && e.key === 'Escape') closeMenu();
	}}
/>
<svelte:body style:overflow={menuActive ? 'hidden' : ''} />

<nav
	class="fixed inset-x-0 z-50 flex min-h-[4.5rem] items-stretch justify-between transition-colors duration-500 ease-out sm:min-h-20"
	class:shadow-nav-corners={scrolled}
	style="top: {navTopPx}px; {scrolled ? `background-color: ${scrolledNavAccent};` : ''}"
	aria-label="Main navigation"
>
	<!-- Left: Logo and name - always one line, scales to fit -->
	<a
		href={contentHref('home')}
		class="flex min-h-[4.5rem] min-w-0 shrink items-center gap-2 px-3 py-2.5 transition-colors duration-300 hover:opacity-90 sm:min-h-20 sm:gap-4 sm:px-8 sm:py-4 {navTitleClass}"
	>
		<img src="/media/uploads/brand/logo.webp" alt="" class="size-10 shrink-0 object-contain sm:size-14" />
		<div class="flex min-w-0 flex-col items-start leading-none">
			<span
				class="font-medium whitespace-nowrap transition-colors duration-500 ease-out"
				style="font-family: var(--font-spectral); font-size: clamp(0.88rem, 1.85vw + 0.32rem, 1.75rem);"
			>
				Kogaion Academy
			</span>
			<span
				class="mt-1 whitespace-nowrap text-[0.42rem] leading-tight tracking-[0.07em] uppercase transition-colors duration-500 ease-out sm:mt-2 sm:text-[0.66rem] sm:tracking-[0.13em] {navSloganClass}"
				style="font-family: 'Libre Baskerville', Georgia, serif;"
			>
				{m.menu_tagline()}
			</span>
		</div>
	</a>

	<!-- Right: Panel — mereu accent albastru (temă), nu alb -->
	<div
		class="flex min-h-[4.5rem] shrink-0 items-stretch overflow-hidden border-l border-white/20 shadow-[0_10px_28px_-16px_rgba(0,0,0,0.55)] transition-[background-color,border-radius] duration-500 ease-out sm:min-h-20"
		class:rounded-bl-[2.2rem]={!scrolled}
		class:rounded-bl-none={scrolled}
		style={`background-color: ${scrolled ? scrolledNavAccent : currentAccent};`}
	>
		{#if !PUBLIC_SITE_LOCALE_LOCKED_RO}
			<!-- Language picker: opens on click, closes on click outside -->
			<div role="group" aria-label="Language" class="relative h-full min-h-[4.5rem] sm:min-h-20" data-language-select>
				<Select.Root type="single" value={currentLocale} onValueChange={handleLocaleChange}>
					<Select.Trigger
						hideChevron
						class="h-full min-h-[4.5rem] w-full min-w-[3rem] items-center justify-center gap-1.5 rounded-none border-0 bg-transparent px-3 py-0 text-[0.72rem] font-semibold tracking-[0.06em] uppercase shadow-none data-[size=sm]:h-full [font-family:var(--font-sans)] text-white hover:bg-white/10 sm:min-h-20 sm:min-w-[6.5rem] sm:gap-2 sm:px-10 sm:text-[0.9rem] sm:tracking-[0.08em] [&_svg]:text-white/90"
						size="sm"
					>
						<span class="flex items-center gap-2">
							<span>{localeFlags[currentLocale] ?? ''}</span>
							<span>
								{currentLocale === 'en' ? m.lang_en() : m.lang_ro()}
							</span>
						</span>
					</Select.Trigger>
					<Select.Content
						data-language-dropdown
						sideOffset={0}
						align="end"
						class="w-[var(--bits-select-anchor-width)] min-w-[3rem] rounded-none border-0 border-t border-white/20 py-0 shadow-none data-[side=bottom]:translate-y-0 sm:min-w-[6.5rem] [&_[data-slot=select-scroll-down-button]]:hidden [&_[data-slot=select-scroll-up-button]]:hidden [&_[data-slot=select-viewport]]:w-full [&_[data-slot=select-viewport]]:min-w-0 [&_[data-slot=select-viewport]]:p-0"
						style={`background-color: ${scrolled ? scrolledNavAccent : currentAccent}; color: white;`}
					>
						{#each locales as loc (loc)}
							<Select.Item
								value={loc}
								label={`${localeFlags[loc] ?? ''} ${loc === 'en' ? m.lang_en() : m.lang_ro()}`}
								class="cursor-pointer gap-2 rounded-none px-4 py-3 text-base [&]:text-inherit text-white data-[highlighted]:bg-white/10 data-[highlighted]:!text-white"
							>
								<span class="flex items-center gap-2">
									<span>{localeFlags[loc] ?? ''}</span>
									<span>{loc === 'en' ? m.lang_en() : m.lang_ro()}</span>
								</span>
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="mx-0.5 w-px shrink-0 self-stretch bg-white/30 sm:mx-0" aria-hidden="true"></div>
		{/if}
		<Button
			href={contentHref('contact')}
			variant="ghost"
			size="default"
			class="flex h-full min-h-[4.5rem] min-w-[5.25rem] items-center justify-center rounded-none border-0 bg-transparent px-4 py-0 text-[0.72rem] font-semibold tracking-[0.06em] uppercase [font-family:var(--font-sans)] text-white hover:bg-white/10 hover:text-white sm:min-h-20 sm:min-w-0 sm:px-10 sm:text-[0.9rem] sm:tracking-[0.08em]"
		>
			{m.menu_link_contact()}
		</Button>

		<div class="mx-0.5 w-px shrink-0 self-stretch bg-white/30 sm:mx-0" aria-hidden="true"></div>
		<button
			type="button"
			class="flex h-full min-h-[4.5rem] min-w-[3.75rem] items-center justify-center gap-2 rounded-none border-0 bg-transparent px-4 py-0 text-base text-white transition-colors [font-family:var(--font-sans)] hover:bg-white/10 hover:text-white sm:min-h-20 sm:min-w-0 sm:gap-3 sm:px-10"
			onclick={openMenu}
			onmouseenter={startMenuHoverTimer}
			onmouseleave={cancelMenuHoverTimer}
			aria-expanded={menuVisible}
			aria-haspopup="dialog"
			aria-label="Open menu"
		>
			<MenuIcon class="size-6 sm:size-7" />
		</button>
	</div>
</nav>

{#if menuVisible}
	<!-- Fullscreen menu overlay - fly in/out from top; sub AdminBar când e vizibilă -->
	<div
		class="fixed inset-x-0 z-[60] flex flex-col"
		class:top-0={!adminBarVisible}
		style="background-color: {currentAccent}; top: {adminBarVisible
			? `${navTopPx}px`
			: '0'}; min-height: {adminBarVisible ? `calc(100dvh - ${navTopPx}px)` : '100dvh'};"
		role="dialog"
		aria-modal="true"
		aria-label="Menu"
		in:fly={{ y: -1200, duration: menuTransitionMs, easing: (t) => 1 - Math.pow(1 - t, 4) }}
		out:fly={{ y: -1200, duration: menuTransitionMs, easing: (t) => Math.pow(t, 4) }}
	>
		<!-- Header: matches nav bar height + logo position -->
		<header class="flex min-h-[4.5rem] items-stretch justify-between sm:min-h-20">
			<a
				href="/"
				class="flex min-h-[4.5rem] min-w-0 items-center gap-2 px-3 py-2.5 sm:min-h-20 sm:gap-4 sm:px-8 sm:py-0"
				onclick={closeMenu}
			>
				<img src="/media/uploads/brand/logo.webp" alt="" class="size-10 shrink-0 object-contain sm:size-14" />
				<div class="flex min-w-0 flex-col items-start leading-none">
					<span
						class="block text-[1.2rem] font-medium whitespace-nowrap text-white sm:text-2xl md:text-3xl"
						style="font-family: var(--font-spectral);"
					>
						Kogaion Academy
					</span>
					<span
						class="mt-1 whitespace-nowrap text-[0.46rem] leading-tight tracking-[0.08em] uppercase transition-colors duration-500 ease-out sm:mt-2 sm:text-[0.7rem] sm:tracking-[0.14em] {overlaySloganClass}"
						style="font-family: 'Libre Baskerville', Georgia, serif;"
					>
						{m.menu_tagline()}
					</span>
				</div>
			</a>
			<div class="flex min-h-[4.5rem] shrink-0 items-stretch sm:min-h-20">
				<button
					type="button"
					class="flex h-full min-h-[4.5rem] items-center justify-center gap-2 rounded-none border-0 bg-transparent px-3 py-0 text-base text-white transition-colors [font-family:var(--font-sans)] hover:bg-white/10 hover:text-white sm:min-h-20 sm:gap-3 sm:px-10"
					onclick={closeMenu}
					aria-label="Close menu"
				>
					<X class="size-6 sm:size-7" />
				</button>
			</div>
		</header>

		<!-- Main: two columns -->
		<div
			class="flex flex-1 flex-col gap-8 px-6 pb-8 md:flex-row md:items-center md:gap-12 md:px-12 md:pb-12 lg:px-16"
		>
			<!-- Left: nav links with chevrons -->
			<nav class="flex flex-1 flex-col gap-1" aria-label="Menu navigation">
				{#each menuItems as item (item.label)}
					<a
						href={item.href}
						class="group flex items-center justify-between gap-4 py-3 text-lg text-white transition-colors hover:text-white/90 md:text-xl"
						onclick={closeMenu}
						onmouseenter={() => (hoveredItem = item)}
						onmouseleave={() => (hoveredItem = null)}
					>
						<span style={item.label === 'Contact' ? "font-family: 'Libre Baskerville', Georgia, serif;" : undefined}>{item.label}</span>
						<ChevronRight
							class="size-5 shrink-0 opacity-70 transition-transform group-hover:translate-x-1"
						/>
					</a>
				{/each}
			</nav>

			<!-- Right: featured image + caption (updates on link hover) -->
			<div class="flex flex-1 flex-col items-center justify-center gap-6 px-4 md:max-w-md lg:max-w-lg">
				<div class="w-full overflow-hidden rounded-lg border-2 border-white/20 bg-white/5 shadow-xl ring-1 ring-white/10">
					<img
						src={displayItem.image}
						alt=""
						class="aspect-[4/3] w-full object-cover transition-opacity duration-300"
					/>
				</div>
				<div class="text-center">
					<p
						class="text-lg font-medium text-white md:text-xl"
						style={isSloganPreview ? "font-family: 'Libre Baskerville', Georgia, serif;" : undefined}
					>
						{displayItem.caption}
					</p>
				</div>
			</div>
		</div>

		<!-- Footer: Connect with us + social -->
		<footer
			class="flex items-center justify-between border-t border-white/10 px-6 py-4 md:px-12 lg:px-16"
		>
			<span class="text-sm text-white/70">{m.menu_connect()}</span>
			<div class="flex gap-4">
				{#each normalizedSocials as social (`menu-social-${social.name}`)}
					{@const key = social.name.toLowerCase().replace(/\s+/g, '')}
					<a
						href={social.url}
						target="_blank"
						rel="noopener noreferrer"
						class="text-white/70 transition-colors hover:text-white"
						aria-label={social.name}
					>
						{#if key === 'instagram'}
							<Instagram class="size-5" />
						{:else if key === 'facebook'}
							<Facebook class="size-5" />
						{:else if key === 'linkedin'}
							<Linkedin class="size-5" />
						{:else if key === 'youtube'}
							<Youtube class="size-5" />
						{:else if key === 'twitter' || key === 'x'}
							<Twitter class="size-5" />
						{:else if key === 'tiktok'}
							<svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
								<path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
							</svg>
						{:else}
							<Globe class="size-5" />
						{/if}
					</a>
				{/each}
			</div>
		</footer>
	</div>
{/if}
