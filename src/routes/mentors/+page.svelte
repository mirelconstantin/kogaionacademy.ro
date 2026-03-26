<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { MentorForDisplay } from './+page.server';

	let { data }: { data: { mentors: MentorForDisplay[]; sections?: Record<string, Record<string, unknown>>; isEditor?: boolean } } = $props();

	const FALLBACK_IMAGE = '/media/uploads/about/age-3-6.webp';
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
	const readProfileLabel = $derived(locale === 'en' ? 'Read profile' : 'Citește profilul');
	const readLessLabel = $derived(locale === 'en' ? 'Less' : 'Mai puțin');
	let expandedMentors = $state<Record<number, boolean>>({});
	type BioPart = { type: 'text' | 'link' | 'break'; value: string; href?: string };

	function toggleMentorBio(mentorId: number): void {
		expandedMentors = { ...expandedMentors, [mentorId]: !expandedMentors[mentorId] };
	}

	function cleanMentorBio(bio: string, yearJoined: number | null): string {
		if (!bio) return '';
		const normalized = bio.replace(/\r\n/g, '\n');
		const withoutMentorSince = normalized
			.replace(/\bDin\s+\d{4},\s*/gi, '')
			.replace(/\b(?:începând|incepand)\s+cu\s+anul\s+\d{4},?\s*/gi, '')
			.replace(/\bdin\s+anul\s+\d{4}\b/gi, '')
			.replace(/\b(?:este|e)\s+mentor[^.\n!?]*[.\n!?]?/gi, '')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
		void yearJoined;
		return withoutMentorSince || normalized.trim();
	}

	function buildMentorBioParts(text: string): BioPart[] {
		const parts: BioPart[] = [];
		const lines = text.replace(/\r\n/g, '\n').split('\n');
		const linkPattern = /\b((?:https?:\/\/|www\.)[^\s<]+|(?:instagram\.com\/[^\s<]+))/gi;

		for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
			const line = lines[lineIndex] ?? '';
			let cursor = 0;
			let match: RegExpExecArray | null;
			linkPattern.lastIndex = 0;

			while ((match = linkPattern.exec(line)) !== null) {
				const raw = match[0];
				const start = match.index;
				if (start > cursor) {
					parts.push({ type: 'text', value: line.slice(cursor, start) });
				}
				parts.push({
					type: 'link',
					value: raw,
					href: /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
				});
				cursor = start + raw.length;
			}

			if (cursor < line.length) {
				parts.push({ type: 'text', value: line.slice(cursor) });
			}

			if (lineIndex < lines.length - 1) {
				parts.push({ type: 'break', value: '' });
			}
		}

		return parts;
	}
</script>

<main class="min-h-dvh bg-white">
	<header class="relative min-h-[44vh] overflow-hidden border-b-2 border-white/20 rounded-br-[5.6rem] md:min-h-[46vh] md:rounded-br-[7rem]">
		<div class="absolute inset-0">
			<img
				src="/media/uploads/about/age-13-18.webp"
				alt=""
				class="size-full object-cover object-center"
			/>
			<div class="absolute inset-0 bg-gradient-to-b from-[#154b6a]/85 via-[#154b6a]/58 to-[#091328]/82"></div>
		</div>
		<div class="relative mx-auto flex min-h-[44vh] max-w-6xl flex-col items-center justify-center px-6 pt-24 pb-10 text-center md:min-h-[46vh] md:px-12 md:pt-28 md:pb-12 lg:px-16">
			<div data-cms-type="section" data-cms-page="mentors" data-cms-section="hero" data-cms-field="title" data-cms-locale="ro">
				<h1
					class="mt-4 max-w-5xl text-4xl leading-tight font-semibold text-white md:text-5xl lg:text-6xl"
				>
					{heroTitle}
				</h1>
			</div>
			<div data-cms-type="section" data-cms-page="mentors" data-cms-section="hero" data-cms-field="intro" data-cms-locale="ro">
				<p class="mt-5 max-w-5xl text-sm leading-relaxed text-white/90 md:text-base">{heroDescription}</p>
			</div>
		</div>
	</header>

	<div class="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24 lg:px-16">
		<div class="grid gap-6 md:grid-cols-2">
			{#each data.mentors as mentor (mentor.id)}
				{@const cleanedBio = cleanMentorBio(mentor.bio, mentor.yearJoined)}
				{@const bioParts = buildMentorBioParts(cleanedBio)}
				{@const isExpanded = !!expandedMentors[mentor.id]}
				<div
					class="media-diagonal group cursor-pointer overflow-hidden rounded-tl-3xl rounded-br-3xl border border-border bg-white shadow-[0_14px_40px_-28px_rgba(21,75,106,0.2)]"
					data-cms-type="mentor"
					data-cms-id={mentor.id}
					role="button"
					tabindex="0"
					aria-expanded={isExpanded}
					onclick={() => toggleMentorBio(mentor.id)}
					onkeydown={(event) => {
						if (event.key === 'Enter' || event.key === ' ') {
							event.preventDefault();
							toggleMentorBio(mentor.id);
						}
					}}
				>
					<div class="grid items-start gap-5 p-5 sm:grid-cols-[120px_1fr] sm:gap-6 sm:p-6">
						<div class="w-32 shrink-0 justify-self-start sm:w-32">
							<div
								class="media-diagonal aspect-square overflow-hidden rounded-tl-3xl rounded-br-3xl border border-border bg-muted/30"
								data-profile-photo
							>
								<img
									src={mentor.image ?? FALLBACK_IMAGE}
									alt={mentor.name}
									class="size-full object-cover"
									loading="lazy"
								/>
							</div>
						</div>
						<div class="min-w-0">
							<h3 class="text-lg font-semibold text-[#0c3044] [font-family:var(--font-spectral)]">
								{mentor.name}
							</h3>
							<p class="text-sm font-medium text-primary [font-family:var(--font-sans)]">
								{mentor.title}
							</p>
							{#if mentor.yearJoined}
								<p class="mt-1 text-sm text-muted-foreground [font-family:var(--font-sans)]">
									{m.mentors_since()}
									{mentor.yearJoined}
								</p>
							{/if}
							<div class="relative mt-3">
								<div
									class="overflow-hidden transition-[max-height] duration-300 ease-in-out"
									style={`max-height: ${isExpanded ? '220rem' : '4.8em'}`}
								>
									<p
										class="text-[0.9375rem] leading-relaxed text-muted-foreground [font-family:var(--font-sans)]"
									>
										{#each bioParts as part, partIndex (`bio-${mentor.id}-${partIndex}`)}
											{#if part.type === 'link'}
												<a
													href={part.href}
													target="_blank"
													rel="noopener noreferrer"
													class="font-medium text-primary underline decoration-primary/60 underline-offset-2"
													onclick={(event) => event.stopPropagation()}
												>
													{part.value}
												</a>
											{:else if part.type === 'break'}
												<br />
											{:else}
												{part.value}
											{/if}
										{/each}
									</p>
								</div>
								{#if !isExpanded}
									<div
										class="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent"
									></div>
								{/if}
							</div>
							<button
								type="button"
								class="mt-5 inline-flex items-center justify-center gap-3 text-[0.9rem] text-[var(--brand-blue)] [font-family:var(--font-sans)]"
								onclick={(event) => {
									event.stopPropagation();
									toggleMentorBio(mentor.id);
								}}
								aria-expanded={isExpanded}
							>
								<span
									class="btn-diagonal inline-flex size-10 items-center justify-center border border-current bg-transparent text-current transition-colors group-hover:bg-[var(--brand-blue)] group-hover:text-white"
									aria-hidden="true"
								>
									<ChevronRight
										class="size-4 transition-transform duration-300 {isExpanded ? 'rotate-90' : ''}"
									/>
								</span>
								<span class="inline-flex min-w-[8.5rem] items-center text-left normal-case">
									{isExpanded ? readLessLabel : readProfileLabel}
								</span>
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</main>
