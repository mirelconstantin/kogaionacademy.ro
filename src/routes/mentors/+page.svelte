<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { browser } from '$app/environment';
	import { tick } from 'svelte';
	import MentorCard from '$lib/components/mentors/MentorCard.svelte';
	import MentorProfileModal from '$lib/components/mentors/MentorProfileModal.svelte';
	import { mentorLabels } from '$lib/components/mentors/mentor-content';
	import type { MentorForDisplay } from './+page.server';

	let {
		data
	}: { data: { mentors: MentorForDisplay[]; sections?: Record<string, Record<string, unknown>> } } =
		$props();

	const heroPayload = $derived((data?.sections?.hero ?? {}) as { title?: string; intro?: string });
	const heroTitle = $derived(heroPayload?.title ?? m.mentors_title());
	const heroIntro = $derived(heroPayload?.intro ?? m.mentors_intro());
	const heroDescription = $derived.by(() => {
		const intro = (heroIntro ?? '').trim();
		if (intro.length >= 120) return intro;
		const extra =
			' Echipa Kogaion reunește mentori din educație, știință, arte, leadership și dezvoltare personală, fiecare contribuind cu experiență practică în lucrul cu copii și familii.';
		return `${intro}${extra}`.trim();
	});

	const locale = $derived(getLocale());
	const labels = $derived(mentorLabels(locale));

	/** Single source of truth for the large popup — at most one mentor is open. */
	let activeMentor = $state<MentorForDisplay | null>(null);
	/** Page content behind the popup; becomes `inert` while the popup is open. */
	let pageContent = $state<HTMLElement | null>(null);
	/** Element that opened the popup, refocused on close. */
	let restoreFocusTo = $state<HTMLElement | null>(null);

	function setBackgroundInert(inert: boolean): void {
		if (!browser || !pageContent) return;
		pageContent.inert = inert;
		if (inert) {
			pageContent.setAttribute('aria-hidden', 'true');
		} else {
			pageContent.removeAttribute('aria-hidden');
		}
	}

	async function openMentor(mentor: MentorForDisplay, trigger: HTMLElement | null): Promise<void> {
		if (activeMentor?.id === mentor.id) return;
		restoreFocusTo = trigger;
		activeMentor = mentor;
		await tick();
		setBackgroundInert(true);
	}

	async function closeMentor(): Promise<void> {
		activeMentor = null;
		setBackgroundInert(false);
		await tick();
		const target = restoreFocusTo;
		restoreFocusTo = null;
		if (target?.isConnected) target.focus();
	}
</script>

<main class="min-h-dvh bg-white">
	<div bind:this={pageContent}>
		<header
			class="relative min-h-[44vh] overflow-hidden rounded-br-[5.6rem] border-b-2 border-white/20 md:min-h-[46vh] md:rounded-br-[7rem]"
		>
			<div class="absolute inset-0">
				<img
					src="/media/uploads/about/age-13-18.webp"
					alt=""
					class="size-full object-cover object-center"
				/>
				<div
					class="absolute inset-0 bg-gradient-to-b from-[#154b6a]/85 via-[#154b6a]/58 to-[#091328]/82"
				></div>
			</div>
			<div
				class="relative mx-auto flex min-h-[44vh] max-w-6xl flex-col items-center justify-center px-6 pt-[calc(var(--admin-bar-height,0px)+var(--nav-height,5rem)+var(--below-nav-gap,0px))] pb-10 text-center md:min-h-[46vh] md:px-12 md:pt-[calc(var(--admin-bar-height,0px)+7rem+var(--below-nav-gap,0px))] md:pb-12 lg:px-16"
			>
				<div
					data-cms-type="section"
					data-cms-page="mentors"
					data-cms-section="hero"
					data-cms-field="title"
					data-cms-locale="ro"
				>
					<h1
						class="mt-4 max-w-5xl text-4xl leading-tight font-semibold text-white md:text-5xl lg:text-6xl"
					>
						{heroTitle}
					</h1>
				</div>
				<div
					data-cms-type="section"
					data-cms-page="mentors"
					data-cms-section="hero"
					data-cms-field="intro"
					data-cms-locale="ro"
				>
					<p class="mt-5 max-w-5xl text-sm leading-relaxed text-white/90 md:text-base">
						{heroDescription}
					</p>
				</div>
			</div>
		</header>

		<div class="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24 lg:px-16">
			{#if data.mentors.length > 0}
				<ul class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					{#each data.mentors as mentor (mentor.id)}
						<li class="h-full">
							<MentorCard
								{mentor}
								{labels}
								expanded={activeMentor?.id === mentor.id}
								onopen={openMentor}
							/>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-center [font-family:var(--font-sans)] text-sm text-muted-foreground">
					{m.mentors_intro()}
				</p>
			{/if}
		</div>
	</div>
</main>

<MentorProfileModal mentor={activeMentor} {labels} onclose={closeMentor} />
