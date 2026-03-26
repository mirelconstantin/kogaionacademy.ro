<script lang="ts">
	import { parseShortcutToSegments } from './parse-shortcut.js';

	let {
		label,
		shortcut
	}: {
		label: string;
		shortcut?: string;
	} = $props();
</script>

<div
	class="flex max-w-[min(28rem,92vw)] flex-nowrap items-center gap-2 text-left [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
>
	<span class="shrink-0 text-xs font-medium leading-none text-primary-foreground">{label}</span>
	{#if shortcut}
		<span class="shrink-0 text-primary-foreground/45 select-none" aria-hidden="true">·</span>
		<div class="flex min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto">
			{#each parseShortcutToSegments(shortcut) as part, i}
				{#if i > 0}
					<span class="shrink-0 px-0.5 text-[0.65rem] text-primary-foreground/50" aria-hidden="true">+</span>
				{/if}
				<kbd
					class="pointer-events-none inline-flex h-5 shrink-0 min-w-[1.15rem] items-center justify-center rounded border border-primary-foreground/35 bg-primary-foreground/14 px-1.5 font-sans text-[0.65rem] font-semibold leading-none tracking-tight text-primary-foreground shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.12)]"
				>
					{part}
				</kbd>
			{/each}
		</div>
	{/if}
</div>
