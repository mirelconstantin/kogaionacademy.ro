<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import FormRenderer from '$lib/components/forms/FormRenderer.svelte';
	import SocialLinksEditor from '$lib/components/SocialLinksEditor.svelte';
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import type { FormSchemaV1 } from '$lib/forms/types';

	let {
		data
	}: {
		data: {
			contactEmail?: string;
			contactPhone?: string;
			contactAddress?: string;
			contactSocials?: { name: string; url: string }[];
			sections?: Record<string, Record<string, unknown>>;
			isEditor?: boolean;
			locale?: string;
			formRuntime?: { formKey: string; formVersion: number; schema: FormSchemaV1 };
		};
	} = $props();

	const contactEmail = $derived(data?.contactEmail ?? 'diana@kogaionacademy.ro');
	const contactEmailDisplay = $derived(contactEmail.toLowerCase());
	const contactPhone = $derived(data?.contactPhone ?? '0720.529.398');
	const contactAddress = $derived(data?.contactAddress ?? m.contact_address_line());
	const contactSocials = $derived(data?.contactSocials ?? []);
	const contactPhoneHref = $derived.by(() => {
		const digits = contactPhone.replace(/\D/g, '');
		if (digits.length === 10 && digits.startsWith('0')) return `tel:+4${digits}`;
		if (digits.length > 0) return `tel:+${digits}`;
		return 'tel:+40720529398';
	});
	const heroPayload = $derived((data?.sections?.hero ?? {}) as { title?: string; intro?: string });
	const heroTitle = $derived(heroPayload?.title ?? m.contact_title());
	const heroIntro = $derived(heroPayload?.intro ?? m.contact_hero_intro());
	const heroDescription = $derived.by(() => {
		const intro = (heroIntro ?? '').trim();
		if (intro.length >= 120) return intro;
		return `${intro} Suntem aici să îți oferim claritate, răspunsuri rapide și o direcție potrivită pentru copilul tău și familia ta.`.trim();
	});
</script>

<main class="min-h-dvh bg-[#fcfeff]">
	<header
		class="relative min-h-[44vh] overflow-hidden rounded-br-[5.6rem] border-b-2 border-white/20 md:min-h-[46vh] md:rounded-br-[7rem]"
		data-cms-type="section"
		data-cms-page="contact"
		data-cms-section="hero"
		data-cms-locale="ro"
	>
		<img src="/media/uploads/home/hero-poster.webp" alt="" class="absolute inset-0 size-full object-cover" />
		<div class="absolute inset-0 bg-gradient-to-b from-[#154b6a]/85 via-[#154b6a]/58 to-[#091328]/82"></div>
		<div
			class="relative mx-auto flex min-h-[44vh] max-w-6xl flex-col items-center justify-center px-6 pb-10 text-center md:min-h-[46vh] md:px-12 md:pb-12 lg:px-16 pt-[calc(var(--admin-bar-height,0px)+var(--nav-height,5rem))] md:pt-[calc(var(--admin-bar-height,0px)+7rem)]"
		>
			<p class="text-xs font-semibold tracking-[0.2em] text-white/85 uppercase [font-family:var(--font-sans)]">
				Contact Kogaion
			</p>
			<div data-cms-type="section" data-cms-page="contact" data-cms-section="hero" data-cms-field="title" data-cms-locale="ro">
				<h1
					class="mt-4 max-w-5xl text-4xl leading-tight font-medium text-white md:text-5xl lg:text-6xl [font-family:var(--font-spectral)]"
				>
					{heroTitle}
				</h1>
			</div>
			<div data-cms-type="section" data-cms-page="contact" data-cms-section="hero" data-cms-field="intro" data-cms-locale="ro">
				<p class="mt-5 max-w-5xl text-sm leading-relaxed text-white/90 md:text-base [font-family:var(--font-sans)]">
					{heroDescription}
				</p>
			</div>
		</div>
	</header>

	<section class="relative border-b border-border bg-[#fcfeff] px-6 py-14 md:py-20">
		<div class="mx-auto max-w-6xl">
			<div class="grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10">
				<div
					class="media-diagonal h-full rounded-none border border-[#dfeaf8] bg-[#f7fbff] p-6 shadow-[0_10px_24px_-18px_rgba(21,75,106,0.18)] md:p-8"
				>
					<p
						class="text-xs font-semibold tracking-[0.2em] text-primary uppercase [font-family:var(--font-sans)]"
					>
						Formular prioritar
					</p>
					<h2
						class="mt-3 text-[1.65rem] leading-tight font-medium tracking-[-0.02em] text-[#0c3044] md:text-[2rem] [font-family:var(--font-spectral)]"
					>
						{m.contact_form_title()}
					</h2>
					<p class="mt-3 max-w-xl text-[0.98rem] leading-relaxed text-muted-foreground [font-family:var(--font-sans)]">
						{m.contact_form_help()} Îți trimitem un răspuns personalizat, de regulă, în 24 de ore lucrătoare.
					</p>

					{#if data.formRuntime}
						<FormRenderer
							formKey={data.formRuntime.formKey}
							formVersion={data.formRuntime.formVersion}
							schema={data.formRuntime.schema}
							locale={data.locale ?? 'ro'}
							successMessage={m.contact_success_message()}
							successExtra={`Dacă e urgent, ne poți suna direct la ${contactPhone}.`}
						/>
					{/if}
				</div>

				<div
					class="media-diagonal relative flex h-full flex-col overflow-hidden rounded-none border border-[#dfeaf8] bg-[#f7fbff] p-6 text-[#0c3044] shadow-[0_10px_24px_-18px_rgba(21,75,106,0.18)] md:p-8"
				>
					<div
						class="pointer-events-none absolute -right-8 -bottom-8 size-36 rounded-full bg-[#154b6a]/10 blur-2xl"
						aria-hidden="true"
					></div>
					<p
						class="text-xs font-semibold tracking-[0.2em] text-primary uppercase [font-family:var(--font-sans)]"
					>
						Contact direct
					</p>
					<h3
						class="relative mt-3 text-[1.38rem] leading-tight font-medium tracking-[-0.02em] text-[#0c3044] md:text-[1.62rem] [font-family:var(--font-spectral)]"
					>
						{m.contact_person_name()}
					</h3>
					<p class="relative mt-3 max-w-md text-[0.96rem] leading-relaxed text-muted-foreground [font-family:var(--font-sans)]">
						Dacă ai nevoie de orientare imediată, ne poți contacta direct aici.
					</p>
					<div class="relative mt-6 grid gap-3.5 sm:grid-cols-2">
						<a
							href={contactPhoneHref}
							class="btn-diagonal group flex min-h-12 items-center justify-between border border-[var(--brand-blue)] bg-transparent px-4 py-3 normal-case tracking-normal text-[var(--brand-blue)] transition-colors hover:border-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue-hover)] hover:text-white [font-family:var(--font-sans)]"
						>
							<span class="flex items-center gap-3 text-left [font-family:var(--font-sans)]">
								<Phone class="size-[1rem]" />
								<span class="flex flex-col leading-tight">
									<span class="text-[0.68rem] tracking-[0.09em] uppercase opacity-70">Telefon</span>
									<span class="text-[0.95rem] font-medium">{contactPhone}</span>
								</span>
							</span>
							<ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" />
						</a>
						<a
							href={'mailto:' + contactEmailDisplay}
							class="btn-diagonal group flex min-h-12 items-center justify-between border border-[var(--brand-blue)] bg-transparent px-4 py-3 normal-case tracking-normal text-[var(--brand-blue)] transition-colors hover:border-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue-hover)] hover:text-white [font-family:var(--font-sans)]"
						>
							<span class="flex items-center gap-3 text-left [font-family:var(--font-sans)]">
								<Mail class="size-[1rem]" />
								<span class="flex flex-col leading-tight">
									<span class="text-[0.68rem] tracking-[0.09em] uppercase opacity-70">Email</span>
									<span class="text-[0.95rem] font-medium normal-case">{contactEmailDisplay}</span>
								</span>
							</span>
							<ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" />
						</a>
					</div>
					<div class="relative mt-6 border-t border-[#dfeaf8] pt-6">
						<p
							class="text-xs font-semibold tracking-[0.2em] text-primary uppercase [font-family:var(--font-sans)]"
						>
							Rețele sociale
						</p>
						<div class="mt-4 flex flex-wrap items-center gap-3">
							<SocialLinksEditor
								socials={contactSocials}
								locale={data?.locale ?? 'ro'}
								isEditor={data?.isEditor ?? false}
								variant="default"
							/>
						</div>
					</div>
				</div>

				<div
					class="media-diagonal rounded-none border border-[#dfeaf8] bg-white p-6 shadow-[0_10px_24px_-18px_rgba(21,75,106,0.18)] md:p-8 lg:col-span-2"
				>
					<h3
						class="text-[1.25rem] font-medium tracking-[-0.02em] text-[#0c3044] md:text-[1.45rem] [font-family:var(--font-spectral)]"
					>
						{m.contact_address_title()}
					</h3>
					<div class="mt-4 flex items-center gap-2.5 text-muted-foreground [font-family:var(--font-sans)]">
						<MapPin class="size-4 shrink-0 text-[var(--brand-blue)]" />
						<p class="text-sm leading-relaxed">{contactAddress} • {m.contact_address_note()}</p>
					</div>
					<div class="media-diagonal-soft mt-5 overflow-hidden border border-[#dfeaf8] bg-white">
						<a
							href="https://www.google.com/maps?cid=12063130565511101266"
							target="_blank"
							rel="noopener noreferrer"
							class="block"
							aria-label={m.contact_address_title() + ' - ' + m.contact_address_line()}
						>
							<iframe
								src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2846.587903677995!2d26.085061215524853!3d44.48261917910155!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b20267fc6d485f%3A0xa768d9560c723b52!2sKogaion+Gifted+Academy!5e0!3m2!1sen!2sus!4v1494924214903"
								width="100%"
								height="300"
								style="border:0; display:block;"
								loading="lazy"
								referrerpolicy="no-referrer-when-downgrade"
								title="Kogaion Academy location"
							></iframe>
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>
</main>
