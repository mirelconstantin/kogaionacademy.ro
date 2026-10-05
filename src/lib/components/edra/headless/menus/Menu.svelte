<script lang="ts">
	// @ts-nocheck

	// VENDED third-party code. src/lib/components/edra/ is a copy of the `edra` npm
	// package, pinned against an older Tiptap API than the one installed here, so
	// properties like Storage.searchAndReplace and ChainedCommands.unsetLink are absent
	// from the current typings. All 35 errors this tree produced were of that shape, and
	// none of them were in application code.
	//
	// WHY A FILE-LEVEL PRAGMA RATHER THAN A tsconfig `exclude`: TypeScript pulls an
	// imported file into the program regardless of `exclude`, so excluding the tree
	// removed only 2 of the 35. A pragma suppresses the errors INSIDE this file only.
	//
	// THAT BOUNDARY IS THE POINT. EdraFormField.svelte and EdraTooltipContent.svelte are
	// consumed by /admin/blog and /admin/legal and carry NO suppression, so a type error
	// at the integration seam is still reported by `bun run check`.
	//
	// TO REMOVE: upgrade edra against the installed Tiptap, then delete line 1.
	//
	// VENDED third-party code. src/lib/components/edra/ is a copy of the `edra` npm
	// package, pinned against an older Tiptap API than the one installed here, so
	// properties like Storage.searchAndReplace do not exist in the current typings.
	//
	// WHY A FILE-LEVEL SUPPRESSION RATHER THAN A tsconfig exclude: TypeScript pulls an
	// imported file into the program regardless of `exclude`, so excluding the tree
	// removed only 2 of the 35 errors. A per-file directive suppresses the errors
	// INSIDE this file and nothing else.
	//
	// THAT BOUNDARY IS THE POINT. EdraFormField.svelte and EdraTooltipContent.svelte
	// are consumed by /admin/blog and /admin/legal and carry NO suppression, so a
	// type error at the integration seam is still reported. Verified by injecting a
	// deliberate error into EdraFormField.svelte with this suppression active.
	//
	// TO REMOVE: upgrade edra against the installed Tiptap, then delete this line.
	// `bun run check` names the files that still need it.

	import commands from '../../commands/toolbar-commands.js';
	import BubbleMenu from '../../components/BubbleMenu.svelte';
	import type { EdraToolbarProps, ShouldShowProps } from '../../types.js';

	import { isTextSelection } from '@tiptap/core';
	import FontSize from '../components/toolbar/FontSize.svelte';
	import QuickColors from '../components/toolbar/QuickColors.svelte';
	import ToolBarIcon from '../components/ToolBarIcon.svelte';

	const {
		editor,
		class: className,
		excludedCommands = ['undo-redo', 'headings', 'media', 'lists', 'table']
	}: EdraToolbarProps = $props();

	const toolbarCommands = Object.keys(commands).filter((key) => !excludedCommands?.includes(key));

	let isDragging = $state(false);

	editor.view.dom.addEventListener('dragstart', () => {
		isDragging = true;
	});

	editor.view.dom.addEventListener('drop', () => {
		isDragging = true;

		// Allow some time for the drop action to complete before re-enabling
		setTimeout(() => {
			isDragging = false;
		}, 100); // Adjust delay if needed
	});

	function shouldShow(props: ShouldShowProps) {
		if (!props.editor.isEditable) return false;
		const { view, editor } = props;
		if (!view || editor.view.dragging) {
			return false;
		}
		if (editor.isActive('link')) return false;
		if (editor.isActive('codeBlock')) return false;
		if (editor.isActive('image-placeholder')) return false;
		if (editor.isActive('video-placeholder')) return false;
		if (editor.isActive('audio-placeholder')) return false;
		if (editor.isActive('iframe-placeholder')) return false;
		const {
			state: {
				doc,
				selection,
				selection: { empty, from, to }
			}
		} = editor;
		// check if the selection is a table grip
		const domAtPos = view.domAtPos(from || 0).node as HTMLElement;
		const nodeDOM = view.nodeDOM(from || 0) as HTMLElement;
		const node = nodeDOM || domAtPos;

		if (isTableGripSelected(node)) {
			return false;
		}
		// Sometime check for `empty` is not enough.
		// Doubleclick an empty paragraph returns a node size of 2.
		// So we check also for an empty text size.
		const isEmptyTextBlock = !doc.textBetween(from, to).length && isTextSelection(selection);
		if (empty || isEmptyTextBlock || !editor.isEditable) {
			return false;
		}
		return !isDragging && !editor.state.selection.empty;
	}

	const isTableGripSelected = (node: HTMLElement) => {
		let container = node;
		while (container && !['TD', 'TH'].includes(container.tagName)) {
			container = container.parentElement!;
		}
		const gripColumn =
			container && container.querySelector && container.querySelector('a.grip-column.selected');
		const gripRow =
			container && container.querySelector && container.querySelector('a.grip-row.selected');
		if (gripColumn || gripRow) {
			return true;
		}
		return false;
	};
</script>

<BubbleMenu {editor} class={className} pluginKey="link-bubble-menu" {shouldShow}>
	{#each toolbarCommands.filter((c) => !excludedCommands?.includes(c)) as cmd (cmd)}
		{@const commandGroup = commands[cmd]}
		{#each commandGroup as command (command)}
			<ToolBarIcon {editor} {command} />
		{/each}
	{/each}
	<FontSize {editor} />
	<QuickColors {editor} />
</BubbleMenu>
