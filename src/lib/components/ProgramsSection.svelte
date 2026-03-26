<script lang="ts">
	import { upcomingPrograms } from '$lib/content';
	import { m } from '$lib/paraglide/messages.js';
	import { contentHref } from '$lib/content-routes';

	const staticProgram = $derived(upcomingPrograms[0] ?? null);
	const others = $derived(upcomingPrograms.slice(1, 7));
</script>

<section class="bg-white px-6 py-16">
	<!-- Mobile: stacked; desktop: 9:16 sized to match grid height, programs grid maximized -->
	<div
		class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6 lg:max-h-dvh lg:flex-row lg:items-stretch lg:gap-8"
	>
		<!-- Left: 9:16 portrait, capped so programs get more space -->
		<div class="flex shrink-0 flex-col lg:max-w-[260px]">
			<h3
				class="mb-2 shrink-0 text-lg font-semibold text-foreground lg:mb-4"
				style="font-family: var(--font-spectral);"
			>
				{m.home_featured_program()}
			</h3>
			<div class="flex min-h-0 flex-1 lg:min-h-0">
				<div class="aspect-[9/16] max-h-dvh w-full shrink-0 overflow-hidden">
					<img
						src={staticProgram?.image9x16 ??
							staticProgram?.image ??
							'/programs/16x9_Conectom%20Advanced%20Learning.png'}
						alt={staticProgram?.title ?? ''}
						class="size-full object-cover object-center"
					/>
				</div>
			</div>
		</div>

		<!-- Right: 1:1 program grid, fills remaining space -->
		<div class="flex min-w-0 flex-1 flex-col gap-4 lg:min-h-0">
			<h3
				class="shrink-0 text-lg font-semibold text-foreground"
				style="font-family: var(--font-spectral);"
			>
				{m.home_more_programs()}
			</h3>
			<div
				role="list"
				aria-label="Upcoming programs list"
				class="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2"
			>
				{#each others as program (program.title)}
					<a
						href={contentHref('programs')}
						class="relative aspect-square min-h-0 w-full overflow-hidden"
					>
						<img
							src={program.image ?? '/programs/1x1_Conectom%20Advanced%20Learning.png'}
							alt={program.title}
							class="size-full object-cover object-center"
						/>
					</a>
				{/each}
			</div>
		</div>
	</div>
</section>
