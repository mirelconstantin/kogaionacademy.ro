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

	import { NodeViewWrapper, NodeViewContent } from 'svelte-tiptap';
	import type { NodeViewProps } from '@tiptap/core';
	const { node, updateAttributes, extension }: NodeViewProps = $props();

	let preRef = $state<HTMLPreElement>();

	let isCopying = $state(false);

	const languages: string[] = extension.options.lowlight.listLanguages().sort();

	let defaultLanguage = $state(node.attrs.language);

	$effect(() => {
		updateAttributes({ language: defaultLanguage });
	});

	function copyCode() {
		if (isCopying) return;
		if (!preRef) return;
		isCopying = true;
		navigator.clipboard.writeText(preRef.innerText);
		setTimeout(() => {
			isCopying = false;
		}, 1000);
	}
</script>

<NodeViewWrapper class="code-wrapper">
	<div class="code-wrapper-tile" contenteditable="false">
		<select bind:value={defaultLanguage} class="code-wrapper-select browser-default">
			{#each languages as language (language)}
				<option value={language}>{language}</option>
			{/each}
		</select>
		<button class="code-wrapper-copy" onclick={copyCode}>
			{#if isCopying}
				<span class="code-wrapper-copy-text copied">Copied!</span>
			{:else}
				<span class="code-wrapper-copy-text">Copy</span>
			{/if}
		</button>
	</div>
	<pre bind:this={preRef} spellcheck="false">
		<NodeViewContent as="code" class={`language-${defaultLanguage}`} {...node.attrs} />
	</pre>
</NodeViewWrapper>
