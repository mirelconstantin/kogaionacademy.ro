<script lang="ts">
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages.js';
	import X from '@lucide/svelte/icons/x';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { focusTrap } from '$lib/actions/focus-trap';
	import { dialogBehavior } from '$lib/actions/dialog-behavior';
	import type { MentorForDisplay } from '$lib/server/content';
	import { MENTOR_SECTION_LABELS, mentorView, type MentorLabels } from './mentor-content';

	let {
		mentor = null,
		labels,
		onclose = () => {}
	}: {
		/** `null` renders nothing — the page owns the open state. */
		mentor?: MentorForDisplay | null;
		labels: MentorLabels;
		onclose?: () => void;
	} = $props();

	const FALLBACK_IMAGE = '/media/uploads/about/age-3-6.webp';

	// Lock body scroll (and compensate for the scrollbar) for as long as the popup is mounted.
	$effect(() => {
		if (!browser || !mentor) return;
		const body = document.body;
		const previousOverflow = body.style.overflow;
		const previousPaddingRight = body.style.paddingRight;
		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

		body.style.overflow = 'hidden';
		if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

		return () => {
			body.style.overflow = previousOverflow;
			body.style.paddingRight = previousPaddingRight;
		};
	});
</script>

{#if mentor}
	{@const view = mentorView(mentor)}
	{@const titleId = `mentor-profile-title-${view.id}`}
	<!--
		Backdrop. `dialogBehavior` closes on Escape and on a click whose target is
		the node itself, so the padding area dismisses while the panel does not.
	-->
	<div
		class="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#091328]/82 p-4 backdrop-blur-sm md:items-center md:p-6"
		use:dialogBehavior={{ onClose: onclose, backdrop: true, initialFocus: true }}
	>
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			use:focusTrap={{ initialFocus: false }}
			class="mentor-profile-panel relative my-auto w-full max-w-4xl overflow-hidden rounded-tl-3xl rounded-br-3xl border border-border bg-white shadow-[0_30px_80px_-40px_rgba(9,19,40,0.65)]"
		>
			<button
				type="button"
				class="btn-diagonal absolute top-4 right-4 z-20 inline-flex size-10 items-center justify-center border border-border bg-white text-[#0c3044] shadow-sm transition-colors hover:bg-[var(--brand-blue)] hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--brand-blue)] md:top-5 md:right-5"
				aria-label={labels.close}
				onclick={onclose}
			>
				<X class="size-5" aria-hidden="true" />
			</button>

			<div class="grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
				<!-- Identity column -->
				<div class="border-b border-border bg-[#0b244f] p-6 md:border-r md:border-b-0 md:p-8">
					<div
						class="media-diagonal aspect-square w-full max-w-56 overflow-hidden border border-white/20 bg-[#0b244f] md:max-w-none"
					>
						<img
							src={view.image ?? FALLBACK_IMAGE}
							alt={view.name}
							class="size-full object-cover"
							decoding="async"
							data-profile-photo
						/>
					</div>

					<h2
						id={titleId}
						class="mt-6 pr-12 [font-family:var(--font-spectral)] text-2xl font-semibold text-white md:text-3xl"
					>
						{view.name}
					</h2>

					{#if view.title}
						<p class="mt-2 [font-family:var(--font-sans)] text-sm font-medium text-white/85">
							{view.title}
						</p>
					{/if}

					{#if view.role}
						<p
							class="mt-4 inline-flex items-center gap-2 [font-family:var(--font-sans)] text-xs font-medium tracking-[0.08em] text-white/70 uppercase"
						>
							<span
								class="size-1.5 shrink-0 rounded-full bg-[var(--brand-blue-hover)]"
								aria-hidden="true"
							></span>
							{view.role}
						</p>
					{/if}

					{#if view.yearJoined}
						<p class="mt-2 [font-family:var(--font-sans)] text-sm text-white/60">
							{m.mentors_since()}
							{view.yearJoined}
						</p>
					{/if}
				</div>

				<!-- Profile column -->
				<div class="p-6 md:p-8">
					{#if view.about}
						<section aria-labelledby={`${titleId}-about`}>
							<h3
								id={`${titleId}-about`}
								class="[font-family:var(--font-sans)] text-xs font-semibold tracking-[0.16em] text-[var(--brand-blue)] uppercase"
							>
								{view.aboutHeading}
							</h3>
							<p
								class="mt-3 line-clamp-3 [font-family:var(--font-sans)] text-[0.9375rem] leading-relaxed text-muted-foreground"
							>
								{view.about}
							</p>
						</section>
					{/if}

					{#if view.kogaion}
						<section aria-labelledby={`${titleId}-kogaion`} class="mt-8">
							<h3
								id={`${titleId}-kogaion`}
								class="[font-family:var(--font-sans)] text-xs font-semibold tracking-[0.16em] text-[var(--brand-blue)] uppercase"
							>
								{MENTOR_SECTION_LABELS.kogaion}
							</h3>
							<p
								class="mt-3 line-clamp-3 [font-family:var(--font-sans)] text-[0.9375rem] leading-relaxed text-muted-foreground"
							>
								{view.kogaion}
							</p>
						</section>
					{/if}

					{#if view.voiceQuote}
						<section aria-labelledby={`${titleId}-voice`} class="mt-8">
							<h3
								id={`${titleId}-voice`}
								class="[font-family:var(--font-sans)] text-xs font-semibold tracking-[0.16em] text-[var(--brand-blue)] uppercase"
							>
								{MENTOR_SECTION_LABELS.voice}
							</h3>
							<figure
								class="mt-3 border-l-4 border-[var(--brand-blue)] bg-[#0b244f]/5 py-4 pr-4 pl-5"
							>
								<blockquote
									class="line-clamp-3 [font-family:var(--font-spectral)] text-lg leading-relaxed text-[#0c3044] italic"
								>
									„{view.voiceQuote}“
								</blockquote>
							</figure>
						</section>
					{/if}

					{#if view.expertise.length > 0}
						<section aria-labelledby={`${titleId}-expertise`} class="mt-8">
							<h3
								id={`${titleId}-expertise`}
								class="[font-family:var(--font-sans)] text-xs font-semibold tracking-[0.16em] text-[var(--brand-blue)] uppercase"
							>
								{MENTOR_SECTION_LABELS.expertise}
							</h3>
							<ul class="mt-3 flex flex-wrap gap-2">
								{#each view.expertise as tag (tag)}
									<li
										class="rounded-tl-xl rounded-br-xl border border-[var(--brand-blue)]/25 bg-[#0b244f]/5 px-3 py-1.5 [font-family:var(--font-sans)] text-xs font-medium text-[#0c3044]"
									>
										{tag}
									</li>
								{/each}
							</ul>
						</section>
					{/if}

					<div class="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
						<button
							type="button"
							class="btn-diagonal inline-flex items-center gap-3 border border-[var(--brand-blue)] bg-[var(--brand-blue)] px-5 py-3 text-white transition-colors hover:bg-[var(--brand-blue-hover)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
							onclick={onclose}
						>
							{labels.readProfile}
							<ArrowRight class="size-4" aria-hidden="true" />
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.mentor-profile-panel {
		animation: mentor-profile-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes mentor-profile-in {
		from {
			opacity: 0;
			transform: translateY(14px) scale(0.985);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mentor-profile-panel {
			animation-duration: 1ms;
		}
	}
</style>
