<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { MentorForDisplay } from '$lib/server/content';
	import { mentorView, type MentorLabels } from './mentor-content';

	let {
		mentor,
		labels,
		expanded = false,
		onopen = () => {}
	}: {
		mentor: MentorForDisplay;
		labels: MentorLabels;
		/** True while this mentor's popup is the one open on the page. */
		expanded?: boolean;
		onopen?: (mentor: MentorForDisplay, trigger: HTMLElement | null) => void;
	} = $props();

	const FALLBACK_IMAGE = '/media/uploads/about/age-3-6.webp';

	const view = $derived(mentorView(mentor));
</script>

<!--
	Small card variant (stays on the page).

	Two real buttons, never nested: an absolutely positioned overlay `<button>`
	covering the whole card, plus the visible "Citește mai mult" `<button>`
	raised above it (`relative z-20`). Both carry aria-haspopup="dialog" and
	aria-expanded so the expanded state is announced.
-->
<article
	class="media-diagonal group relative flex h-full flex-col overflow-hidden border border-border bg-white text-left shadow-[0_14px_40px_-28px_rgba(21,75,106,0.2)] transition-shadow duration-300 focus-within:shadow-[0_22px_55px_-28px_rgba(21,75,106,0.34)] hover:shadow-[0_22px_55px_-28px_rgba(21,75,106,0.34)]"
	data-cms-type="mentor"
	data-cms-id={mentor.id}
>
	<button
		type="button"
		class="absolute inset-0 z-10 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
		aria-haspopup="dialog"
		aria-expanded={expanded}
		aria-label={labels.openProfile(view.name)}
		onclick={(event) => onopen(mentor, event.currentTarget)}
	></button>

	<div
		class="media-diagonal aspect-square w-full shrink-0 overflow-hidden border-b border-border bg-muted/30"
	>
		<img
			src={view.image ?? FALLBACK_IMAGE}
			alt={view.name}
			class="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
			loading="lazy"
			decoding="async"
			data-profile-photo
		/>
	</div>

	<div class="flex min-h-0 flex-1 flex-col p-5 md:p-6">
		<h3 class="[font-family:var(--font-spectral)] text-xl font-semibold text-[#0c3044]">
			{view.name}
		</h3>

		{#if view.title}
			<p class="mt-1.5 [font-family:var(--font-sans)] text-sm font-medium text-primary">
				{view.title}
			</p>
		{/if}

		{#if view.role}
			<p
				class="mt-3 inline-flex w-fit items-center gap-2 [font-family:var(--font-sans)] text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase"
			>
				<span class="size-1.5 shrink-0 rounded-full bg-[var(--brand-blue)]" aria-hidden="true"
				></span>
				{view.role}
			</p>
		{/if}

		{#if view.shortBio}
			<p
				class="mt-4 [font-family:var(--font-sans)] text-[0.9375rem] leading-relaxed text-muted-foreground"
			>
				{view.shortBio}
			</p>
		{/if}

		<button
			type="button"
			class="relative z-20 mt-auto inline-flex w-fit items-center gap-3 pt-6 [font-family:var(--font-sans)] text-[0.9rem] text-[var(--brand-blue)]"
			aria-haspopup="dialog"
			aria-expanded={expanded}
			aria-label={`${labels.readMore} — ${view.name}`}
			onclick={(event) => onopen(mentor, event.currentTarget)}
		>
			<span
				class="btn-diagonal inline-flex size-10 shrink-0 items-center justify-center border border-current bg-transparent text-current transition-colors group-hover:bg-[var(--brand-blue)] group-hover:text-white"
				aria-hidden="true"
			>
				<ChevronRight
					class="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
				/>
			</span>
			<span class="inline-flex min-w-[7.5rem] text-left normal-case">{labels.readMore}</span>
		</button>
	</div>
</article>
