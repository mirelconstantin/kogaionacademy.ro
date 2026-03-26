<script lang="ts">
	import type { EdraToolBarCommands } from '../../commands/types.js';
	import { type Editor } from '@tiptap/core';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import EdraTooltipContent from '../../EdraTooltipContent.svelte';
	import { EDRA_TOOLTIP_ARROW_CLASS, EDRA_TOOLTIP_CONTENT_CLASS } from '../../edra-tooltip-ui.js';

	interface Props {
		editor: Editor;
		command: EdraToolBarCommands;
	}

	const { editor, command }: Props = $props();

	const Icon = $derived(command.icon);
	const isDisabled = $derived(command.clickable ? !command.clickable(editor) : false);
	const tipLabel = $derived(command.tooltip ?? command.name);
</script>

<Tooltip.Root delayDuration={0}>
	<Tooltip.Trigger>
		<span class="inline-flex">
			<button
				type="button"
				class="edra-command-button"
				class:active={command.isActive?.(editor)}
				onclick={() => command.onClick?.(editor)}
				disabled={isDisabled}
			>
				<Icon class="edra-toolbar-icon" />
			</button>
		</span>
	</Tooltip.Trigger>
	<Tooltip.Content
		side="bottom"
		sideOffset={6}
		class={EDRA_TOOLTIP_CONTENT_CLASS}
		arrowClasses={EDRA_TOOLTIP_ARROW_CLASS}
	>
		<EdraTooltipContent label={tipLabel} shortcut={command.shortCut} />
	</Tooltip.Content>
</Tooltip.Root>
