<script lang="ts">
	import commands from '../commands/toolbar-commands.js';
	import type { EdraToolbarProps } from '../types.js';
	import SearchAndReplace from './components/toolbar/SearchAndReplace.svelte';
	import ToolBarIcon from './components/ToolBarIcon.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';

	const UNDO_REDO_KEY = 'undo-redo';

	const { editor, class: className, excludedCommands, children }: EdraToolbarProps = $props();

	const allKeys = $derived(
		Object.keys(commands).filter((key) => !excludedCommands?.includes(key))
	);
	const mainKeys = $derived(allKeys.filter((k) => k !== UNDO_REDO_KEY));
	const undoRedoKeys = $derived(allKeys.includes(UNDO_REDO_KEY) ? [UNDO_REDO_KEY] : []);

	let show = $state<boolean>(false);
</script>

<Tooltip.Provider delayDuration={0}>
	<div class={`edra-toolbar ${className ?? ''}`}>
		{#if children}
			{@render children()}
		{:else}
			<div
				class="flex min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]"
			>
				{#if !show}
					{#each mainKeys as cmd (cmd)}
						{@const commandGroup = commands[cmd]}
						{#each commandGroup as command (command)}
							<ToolBarIcon {editor} {command} />
						{/each}
					{/each}
				{/if}
			</div>
			<div class="flex shrink-0 items-center gap-0.5 border-l border-border/55 pl-2">
				<SearchAndReplace {editor} bind:show />
				{#each undoRedoKeys as uk (uk)}
					{@const group = commands[uk]}
					{#each group as command (command)}
						<ToolBarIcon {editor} {command} />
					{/each}
				{/each}
			</div>
		{/if}
	</div>
</Tooltip.Provider>
