<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { contentHref } from '$lib/content-routes';
	import Phone from '@lucide/svelte/icons/phone';
	import Mail from '@lucide/svelte/icons/mail';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import SocialLinksEditor from '$lib/components/SocialLinksEditor.svelte';

	let {
		contactEmail = 'diana@kogaionacademy.ro',
		contactPhone = '0720.529.398',
		contactAddress = 'Șoseaua Nordului nr. 94F, Sector 1, București',
		socials = [],
		isEditor = false,
		locale = 'ro',
		legalCookieHref = '/politica-cookie-uri',
		legalPrivacyHref = '/politica-de-confidentialitate',
		legalTermsHref = '/termeni-si-conditii'
	}: {
		contactEmail?: string;
		contactPhone?: string;
		contactAddress?: string;
		socials?: { name: string; url: string }[];
		isEditor?: boolean;
		locale?: string;
		legalCookieHref?: string;
		legalPrivacyHref?: string;
		legalTermsHref?: string;
	} = $props();

	// Hover: contrast clar pe fundal închis — accent verde brand, nu albastru
	const linkHover =
		'transition-colors duration-200 text-white/80 hover:text-[var(--brand-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1228]';

	const mapsHref = $derived(
		`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactAddress)}`
	);
</script>

<footer class="relative overflow-hidden rounded-tr-[5.6rem] bg-[#0a1228] text-white md:rounded-tr-[7rem]">
	<!-- Subtle top edge -->
	<div
		class="absolute inset-x-0 top-0 h-px opacity-60"
		style="background: linear-gradient(90deg, transparent, var(--brand-green), transparent);"
	></div>

	<div class="relative mx-auto max-w-[1300px] px-6 py-16 sm:px-8 md:py-20 lg:px-10">
		<div class="grid gap-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-16">
			<!-- Brand + tagline + socials -->
			<div class="lg:col-span-5">
				<a href={contentHref('home')} class="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1228]">
					<img
						src="/media/uploads/brand/logo.webp"
						alt="Kogaion logo"
						class="h-14 w-auto object-contain"
					/>
				</a>
				<h2
					class="mt-4 text-xl font-semibold tracking-tight text-white sm:text-2xl"
					style="font-family: var(--font-spectral);"
				>
					Kogaion Gifted Academy
				</h2>
				<p class="mt-2 max-w-sm text-sm leading-relaxed text-white/70" style="font-family: 'Libre Baskerville', Georgia, serif;">
					{m.menu_tagline()}
				</p>
				<div class="mt-6 flex flex-wrap items-center gap-2">
					<SocialLinksEditor socials={socials} {locale} {isEditor} variant="footer" />
				</div>
			</div>

			<!-- Explore -->
			<div class="lg:col-span-4">
				<h3
					class="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50"
					style="font-family: var(--font-spectral);"
				>
					{m.footer_explore()}
				</h3>
				<nav class="mt-5 flex flex-col gap-2.5" aria-label="Footer navigation">
					<a href={contentHref('home')} class={linkHover}>{m.nav_home()}</a>
					<a href={contentHref('about')} class={linkHover}>{m.nav_about()}</a>
					<a href={contentHref('programs')} class={linkHover}>{m.nav_programs()}</a>
					<a href={contentHref('mentors')} class={linkHover}>{m.nav_mentors()}</a>
					<a href={contentHref('blog')} class={linkHover}>{m.menu_link_blog()}</a>
					<a href={contentHref('contact')} class={linkHover}>{m.contact_title()}</a>
				</nav>
			</div>

			<!-- Contact -->
			<div class="lg:col-span-3">
				<h3
					class="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50"
					style="font-family: var(--font-spectral);"
				>
					{m.menu_link_contact()}
				</h3>
				<div class="mt-5 space-y-4">
					<a
						href="tel:+40720529398"
						class={"flex items-start gap-3 text-sm " + linkHover}
					>
						<Phone class="mt-0.5 size-4 shrink-0 text-white/50" aria-hidden="true" />
						<span>{contactPhone}</span>
					</a>
					<a
						href={'mailto:' + contactEmail}
						class={"flex items-start gap-3 text-sm " + linkHover}
					>
						<Mail class="mt-0.5 size-4 shrink-0 text-white/50" aria-hidden="true" />
						<span class="break-all">{contactEmail}</span>
					</a>
					<a
						href={mapsHref}
						target="_blank"
						rel="noopener noreferrer"
						class={"flex items-start gap-3 text-sm " + linkHover}
					>
						<MapPin class="mt-0.5 size-4 shrink-0 text-white/50" aria-hidden="true" />
						<span>{contactAddress}</span>
					</a>
					<div class="pt-1">
						<h3
							class="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50"
							style="font-family: var(--font-spectral);"
						>
							Politici
						</h3>
						<nav class="mt-2 flex flex-col gap-1.5" aria-label="Footer legal">
							<a href={legalCookieHref} class={linkHover}>Politică de Cookie</a>
							<a href={legalTermsHref} class={linkHover}>Termeni și Condiții</a>
							<a href={legalPrivacyHref} class={linkHover}>Confidențialitate (GDPR)</a>
						</nav>
					</div>
				</div>
			</div>
		</div>

		<!-- Bottom bar: copyright + Pazal Group (păstrat) -->
		<div
			class="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-center sm:flex-row sm:text-left md:mt-14 md:pt-10"
		>
			<p class="text-xs text-white/45">© Kogaion Gifted Academy 2013–2026</p>
			<p class="text-xs text-white/45">
				Site realizat de
				<a
					href="https://pazalgroup.com"
					target="_blank"
					rel="noopener noreferrer"
					class="font-medium text-white/70 underline decoration-white/30 underline-offset-2 transition-colors duration-200 hover:text-[var(--brand-green)] hover:decoration-[var(--brand-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1228]"
				>
					Pazal Group
				</a>
			</p>
		</div>
	</div>
</footer>
