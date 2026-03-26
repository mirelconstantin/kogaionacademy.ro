<script lang="ts">
	import { browser } from '$app/environment';
	import { readConsentFromDocument, writeConsentCookie } from '$lib/client/consent';
	import { isConsentChoiceStale } from '$lib/consent-renewal';
	import { Button } from '$lib/components/ui/button';

	let {
		title = 'Folosim cookie-uri și date de utilizare',
		bodyHtml = '',
		cookiePolicyHref = '/politica-cookie-uri',
		privacyPolicyHref = '/politica-de-confidentialitate'
	}: {
		title?: string;
		bodyHtml?: string;
		cookiePolicyHref?: string;
		privacyPolicyHref?: string;
	} = $props();

	let dismissed = $state(false);
	let show = $state(false);

	$effect(() => {
		if (!browser) return;
		const c = readConsentFromDocument();
		const stale = isConsentChoiceStale(c.updatedAt);
		show = !c.updatedAt || c.updatedAt === '' || stale;
		if (!show) dismissed = true;
	});

	function acceptAll() {
		writeConsentCookie({
			analytics: true,
			marketing: true,
			personalization: true,
			updatedAt: new Date().toISOString()
		});
		dismissed = true;
		show = false;
		window.location.reload();
	}

	function essentialOnly() {
		writeConsentCookie({
			analytics: false,
			marketing: false,
			personalization: false,
			updatedAt: new Date().toISOString()
		});
		dismissed = true;
		show = false;
		window.location.reload();
	}
</script>

{#if browser && show && !dismissed}
	<div
		class="fixed right-0 bottom-0 left-0 z-[200] border-t border-border bg-card/95 px-4 py-4 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md sm:px-8 md:py-5 lg:px-12 xl:px-16 2xl:px-20"
		role="dialog"
		aria-label="Preferințe cookie și confidențialitate"
	>
		<div
			class="mx-auto flex w-full flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8 lg:gap-10"
		>
			<div class="min-w-0 flex-1 space-y-2 text-sm text-muted-foreground md:pr-4">
				<p class="font-medium text-foreground">{title}</p>
				{#if bodyHtml}
					<div
						class="leading-relaxed [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_p]:my-2 [&_strong]:text-foreground"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML sanitizat pe server -->
						{@html bodyHtml}
					</div>
				{:else}
					<p class="leading-relaxed">
						Folosim cookie-uri esențiale pentru funcționarea site-ului. Date tehnice pentru analiză (trafic,
						evenimente anonimizate pe formulare) sunt folosite doar dacă accepți categoria „Analiză”.
					</p>
					<p class="text-xs">
						<a
							class="font-medium text-foreground underline"
							href={`${cookiePolicyHref}#preferinte-cookie`}>Politica de cookie-uri</a>
						<span class="mx-1 text-muted-foreground">·</span>
						<a class="font-medium text-foreground underline" href={privacyPolicyHref}
							>Confidențialitate</a>
					</p>
				{/if}
			</div>
			<div class="flex shrink-0 flex-wrap gap-2 md:justify-end">
				<Button type="button" variant="outline" class="rounded-none" onclick={essentialOnly}>
					Doar esențiale
				</Button>
				<Button type="button" class="rounded-none" onclick={acceptAll}>Accept toate</Button>
			</div>
		</div>
	</div>
{/if}
