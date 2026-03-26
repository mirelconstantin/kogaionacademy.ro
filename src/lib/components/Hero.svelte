<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { contentHref } from '$lib/content-routes';

	const DEFAULT_VIDEO = '/media/uploads/home/hero.mp4';
	const DEFAULT_POSTER = '/media/uploads/home/hero-poster.webp';

	let {
		hero = null,
		heroLabel,
		introHeading,
		introBody,
		introBodySecondary,
		cmsPage = 'home',
		cmsSection = 'intro',
		cmsHeadingField = 'heading',
		cmsBodyField = 'body',
		cmsBodySecondaryField = 'subline',
		showEyebrow = false,
		eyebrowCmsField = 'label',
		headingMultiline = false
	}: {
		hero?: {
			videoUrl?: string;
			posterUrl?: string;
			ctaPrimaryLabel?: string;
			ctaPrimaryLink?: string;
			ctaSecondaryLabel?: string;
			ctaSecondaryLink?: string;
		} | null;
		heroLabel?: string;
		introHeading?: string;
		introBody?: string;
		/** Optional second paragraph (e.g. about hero subline) */
		introBodySecondary?: string;
		/** CMS page key for inline editing */
		cmsPage?: string;
		cmsSection?: string;
		cmsHeadingField?: string;
		cmsBodyField?: string;
		cmsBodySecondaryField?: string;
		showEyebrow?: boolean;
		eyebrowCmsField?: string;
		/** When false, allow long titles to wrap on md+ (about page) */
		headingMultiline?: boolean;
	} = $props();

	let videoError = $state(false);
	const videoUrl = $derived(hero?.videoUrl ?? DEFAULT_VIDEO);
	const posterUrl = $derived(hero?.posterUrl ?? DEFAULT_POSTER);
	const ctaPrimaryLabel = $derived(hero?.ctaPrimaryLabel ?? m.home_cta_programs_label());
	const ctaPrimaryLink = $derived(hero?.ctaPrimaryLink ?? contentHref('programs'));
	const rawSecondaryLabel = $derived(hero?.ctaSecondaryLabel ?? m.nav_about());
	const secondaryLabelIsAbout = $derived(rawSecondaryLabel.trim().toLowerCase() === 'despre');
	const ctaSecondaryLabel = $derived(secondaryLabelIsAbout ? 'CONTACTEAZĂ-NE' : rawSecondaryLabel);
	const ctaSecondaryLink = $derived(
		secondaryLabelIsAbout ? contentHref('contact') : (hero?.ctaSecondaryLink ?? contentHref('about'))
	);
	const headingText = $derived(introHeading ?? m.home_intro_heading());
	const bodyText = $derived(introBody ?? m.home_intro_body());
</script>

<section class="relative min-h-[44vh] overflow-hidden border-b-2 border-white/20 rounded-br-[5.6rem] md:min-h-[46vh] md:rounded-br-[7rem]" aria-label="Hero">
	{#if videoError}
		<div
			class="absolute inset-0 size-full bg-cover bg-center"
			style="background-image: url('{posterUrl}');"
			role="img"
			aria-label="Hero background"
		></div>
	{:else}
		<video
			class="absolute inset-0 size-full object-cover"
			autoplay
			muted
			loop
			playsinline
			preload="auto"
			poster={posterUrl}
			onerror={() => (videoError = true)}
		>
			{#if videoUrl.endsWith('.webm')}
				<source src={videoUrl} type="video/webm" />
			{:else}
				<source src={videoUrl} type="video/mp4" />
			{/if}
		</video>
	{/if}
	<div
		class="absolute inset-0 bg-gradient-to-b from-[#154b6a]/85 via-[#154b6a]/58 to-[#091328]/82"
	></div>

	<!-- Spațiu sub AdminBar (variabilă CSS) + nav fixă (--nav-height / extra pe md+) -->
	<div
		class="relative mx-auto flex min-h-[44vh] max-w-6xl flex-col items-center justify-center px-6 pb-10 text-center md:min-h-[46vh] md:px-12 md:pb-12 lg:px-16 pt-[calc(var(--admin-bar-height,0px)+var(--nav-height,5rem))] md:pt-[calc(var(--admin-bar-height,0px)+7rem)]"
	>
		{#if showEyebrow && heroLabel}
			<div
				data-cms-type="section"
				data-cms-page={cmsPage}
				data-cms-section={cmsSection}
				data-cms-field={eyebrowCmsField}
				data-cms-locale="ro"
			>
				<p class="text-xs font-semibold tracking-[0.2em] text-white/85 uppercase [font-family:var(--font-sans)]">
					{heroLabel}
				</p>
			</div>
		{/if}
		<div
			data-cms-type="section"
			data-cms-page={cmsPage}
			data-cms-section={cmsSection}
			data-cms-field={cmsHeadingField}
			data-cms-locale="ro"
		>
			<h1
				class="max-w-5xl text-4xl leading-tight font-medium text-white md:text-5xl lg:text-6xl {headingMultiline
					? ''
					: 'md:whitespace-nowrap'}"
			>
				{headingText}
			</h1>
		</div>
		<div
			data-cms-type="section"
			data-cms-page={cmsPage}
			data-cms-section={cmsSection}
			data-cms-field={cmsBodyField}
			data-cms-locale="ro"
		>
			<p class="mt-5 max-w-5xl text-sm leading-relaxed text-white/90 md:text-base">
				{bodyText}
			</p>
		</div>
		{#if introBodySecondary}
			<div
				data-cms-type="section"
				data-cms-page={cmsPage}
				data-cms-section={cmsSection}
				data-cms-field={cmsBodySecondaryField}
				data-cms-locale="ro"
			>
				<p class="mt-4 max-w-5xl text-sm leading-relaxed text-white/82 md:text-base">
					{introBodySecondary}
				</p>
			</div>
		{/if}

		<div
			class="mt-8 flex w-full max-w-5xl flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4"
		>
			<a
				href={ctaPrimaryLink}
				class="btn-diagonal inline-flex min-h-12 w-fit max-w-full items-center justify-center gap-2 border border-white bg-white px-6 py-3 text-center text-[0.85rem] font-semibold text-[var(--brand-blue)] transition-colors hover:bg-[var(--brand-blue)] hover:text-white sm:px-7 sm:text-[0.9rem] md:px-7 md:py-3 md:text-[0.96rem] [font-family:var(--font-sans)]"
				data-cms-type="hero"
				data-cms-field-group="ctaPrimaryLabel,ctaPrimaryLink"
				data-cms-locale="ro"
			>
				{ctaPrimaryLabel}
			</a>
			<a
				href={ctaSecondaryLink}
				class="btn-diagonal inline-flex min-h-12 w-fit max-w-full items-center justify-center gap-2 border border-white bg-transparent px-6 py-3 text-center text-[0.85rem] font-semibold text-white transition-colors hover:bg-[var(--brand-blue)] hover:text-white sm:px-7 sm:text-[0.9rem] md:px-7 md:py-3 md:text-[0.96rem] [font-family:var(--font-sans)]"
				data-cms-type="hero"
				data-cms-field-group="ctaSecondaryLabel,ctaSecondaryLink"
				data-cms-locale="ro"
			>
				{ctaSecondaryLabel}
			</a>
		</div>

		<!-- Stats intentionally hidden in hero to keep Wolsey-like composition -->
	</div>
</section>
