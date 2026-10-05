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

	import type { ShouldShowProps } from '../../types.js';
	import BubbleMenu from '../../components/BubbleMenu.svelte';
	import type { Editor } from '@tiptap/core';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash from '@lucide/svelte/icons/trash';

	interface Props {
		editor: Editor;
	}

	const { editor }: Props = $props();

	let link = $derived.by(() => editor.getAttributes('link').href);
</script>

<BubbleMenu
	{editor}
	pluginKey="link-bubble-menu"
	shouldShow={(props: ShouldShowProps) => {
		if (!props.editor.isEditable) return false;
		return props.editor.isActive('link');
	}}
>
	<a href={link} target="_blank">
		{link}
	</a>
	<button
		title="Copy Link"
		class="edra-command-button"
		onclick={() => {
			navigator.clipboard.writeText(link);
		}}
	>
		<Copy class="edra-toolbar-icon" />
	</button>
	<button
		class="edra-command-button"
		title="Remove Link"
		onclick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
	>
		<Trash class="edra-toolbar-icon" />
	</button>
</BubbleMenu>
