<script lang="ts">
	import { browser } from '$app/environment';
	import {
		readConsentFromDocument,
		writeConsentCookie
	} from '$lib/client/consent';
	import { CONSENT_REFRESH_DAYS, isConsentChoiceStale } from '$lib/consent-renewal';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();

	type ConsentRead = ReturnType<typeof readConsentFromDocument>;
	let consent = $state<ConsentRead | null>(browser ? readConsentFromDocument() : null);

	function acceptAll() {
		writeConsentCookie({
			analytics: true,
			marketing: true,
			personalization: true,
			updatedAt: new Date().toISOString()
		});
		consent = browser ? readConsentFromDocument() : null;
	}

	function essentialOnly() {
		writeConsentCookie({
			analytics: false,
			marketing: false,
			personalization: false,
			updatedAt: new Date().toISOString()
		});
		consent = browser ? readConsentFromDocument() : null;
	}
</script>

<svelte:head>
	<title>{data.pageTitle} · Kogaion</title>
	<meta name="robots" content="index,follow" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
	<h1 class="text-3xl font-semibold tracking-tight text-foreground">{data.pageTitle}</h1>
	<p class="mt-3 text-sm text-muted-foreground">
		Mai jos îți poți seta preferințele pentru cookie-uri, apoi găsești textul complet al politicii.
	</p>

	<!-- Preferințe: aceeași pagină ca politica (fost /preferinte-cookie) -->
	<section id="preferinte-cookie" class="mt-10 scroll-mt-24" aria-labelledby="preferinte-cookie-heading">
		<h2 id="preferinte-cookie-heading" class="text-xl font-semibold tracking-tight text-foreground">
			Preferințe cookie
		</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			Poți vedea din nou mesajul de consimțământ și îți poți actualiza alegerile. Pentru conformitate, îți putem reafișa
			bannerul cel mult o dată la {data.refreshDays ?? CONSENT_REFRESH_DAYS} zile.
		</p>

		{#if browser && consent}
			<div class="mt-6 rounded-none border border-border bg-muted/30 p-4 text-sm" aria-live="polite">
				<p class="font-medium text-foreground">Stare curentă</p>
				<ul class="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
					<li>Analiză: {consent.analytics ? 'acceptată' : 'respinsă'}</li>
					<li>Marketing: {consent.marketing ? 'acceptat' : 'respins'}</li>
					<li>Personalizare: {consent.personalization ? 'acceptată' : 'respinsă'}</li>
					<li>
						Ultima actualizare preferințe:
						{#if consent.updatedAt}
							{new Date(consent.updatedAt).toLocaleString('ro-RO')}
						{:else}
							—
						{/if}
					</li>
					{#if isConsentChoiceStale(consent.updatedAt)}
						<li class="font-medium text-foreground">
							Este necesară o nouă confirmare (perioada de {data.refreshDays ?? CONSENT_REFRESH_DAYS} zile a expirat).
						</li>
					{/if}
				</ul>
			</div>
		{/if}

		<div class="mt-8 space-y-4 rounded-none border border-border bg-card p-6 shadow-sm">
			<p class="font-medium text-foreground">{data.consentBannerTitle}</p>
			{#if data.consentBodyHtml}
				<div
					class="text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_p]:my-2 [&_strong]:text-foreground"
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML sanitizat pe server -->
					{@html data.consentBodyHtml}
				</div>
			{:else}
				<p class="text-sm leading-relaxed text-muted-foreground">
					Pentru a măsura traficul și a îmbunătăți experiența, putem folosi date tehnice doar dacă accepți categoria
					„Analiză”. Poți alege doar cookie-uri esențiale.
				</p>
			{/if}
			<p class="text-xs text-muted-foreground">
				<a class="font-medium text-foreground underline" href="#politica-cookie-detaliu">Politica detaliată (mai jos)</a>
				<span class="mx-1">·</span>
				<a class="font-medium text-foreground underline" href={data.privacyPolicyHref}>Confidențialitate</a>
			</p>
			<div class="flex flex-wrap gap-2 pt-2">
				<Button type="button" variant="outline" class="rounded-none" onclick={essentialOnly}>
					Doar esențiale
				</Button>
				<Button type="button" class="rounded-none" onclick={acceptAll}>Accept toate</Button>
			</div>
		</div>
	</section>

	<!-- Text legal complet -->
	<section id="politica-cookie-detaliu" class="mt-14 scroll-mt-24 border-t border-border pt-12" aria-labelledby="politica-detaliu-heading">
		<h2 id="politica-detaliu-heading" class="text-xl font-semibold tracking-tight text-foreground">
			{data.policyHeading}
		</h2>
		{#if data.lastUpdatedNote}
			<p class="mt-2 text-sm text-muted-foreground">Ultima actualizare politică: {data.lastUpdatedNote}</p>
		{/if}
		<div
			class="legal-prose mt-8 space-y-4 text-[0.98rem] leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-medium [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-6"
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- conținut sanitizat server-side -->
			{@html data.html}
		</div>
	</section>
</div>
