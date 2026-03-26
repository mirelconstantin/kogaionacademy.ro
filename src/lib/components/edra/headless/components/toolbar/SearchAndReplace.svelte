<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import CaseSensitive from '@lucide/svelte/icons/case-sensitive';
	import Replace from '@lucide/svelte/icons/replace';
	import ReplaceAll from '@lucide/svelte/icons/replace-all';
	import Search from '@lucide/svelte/icons/search';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import EdraTooltipContent from '../../../EdraTooltipContent.svelte';
	import { EDRA_TOOLTIP_ARROW_CLASS, EDRA_TOOLTIP_CONTENT_CLASS } from '../../../edra-tooltip-ui.js';

	interface Props {
		editor: Editor;
		show: boolean;
	}

	let { editor, show = $bindable(false) }: Props = $props();

	let searchText = $state('');
	let replaceText = $state('');
	let caseSensitive = $state(false);

	let searchIndex = $derived(editor.storage?.searchAndReplace?.resultIndex);
	let searchCount = $derived(editor.storage?.searchAndReplace?.results.length);

	function updateSearchTerm(clearIndex: boolean = false) {
		if (clearIndex) editor.commands.resetIndex();

		editor.commands.setSearchTerm(searchText);
		editor.commands.setReplaceTerm(replaceText);
		editor.commands.setCaseSensitive(caseSensitive);
	}

	function goToSelection() {
		const { results, resultIndex } = editor.storage.searchAndReplace;
		const position = results[resultIndex];
		if (!position) return;
		editor.commands.setTextSelection(position);
		const { node } = editor.view.domAtPos(editor.state.selection.anchor);
		if (node instanceof HTMLElement) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	function replace() {
		editor.commands.replace();
		goToSelection();
	}

	const next = () => {
		editor.commands.nextSearchResult();
		goToSelection();
	};

	const previous = () => {
		editor.commands.previousSearchResult();
		goToSelection();
	};

	const clear = () => {
		searchText = '';
		replaceText = '';
		caseSensitive = false;
		editor.commands.resetIndex();
	};

	const replaceAll = () => editor.commands.replaceAll();
</script>

<div class="edra-search-and-replace">
	<Tooltip.Root delayDuration={0}>
		<Tooltip.Trigger>
			<span class="inline-flex">
				<button
					type="button"
					class="edra-command-button"
					onclick={() => {
						show = !show;
						clear();
						updateSearchTerm();
					}}
				>
					{#if show}
						<ArrowLeft class="edra-toolbar-icon" />
					{:else}
						<Search class="edra-toolbar-icon" />
					{/if}
				</button>
			</span>
		</Tooltip.Trigger>
		<Tooltip.Content
			side="bottom"
			sideOffset={6}
			class={EDRA_TOOLTIP_CONTENT_CLASS}
			arrowClasses={EDRA_TOOLTIP_ARROW_CLASS}
		>
			<EdraTooltipContent
				label={show ? 'Înapoi la bara de instrumente' : 'Caută și înlocuiește în text'}
			/>
		</Tooltip.Content>
	</Tooltip.Root>
	{#if show}
		<div class="edra-search-and-replace-content">
			<input placeholder="Caută…" bind:value={searchText} oninput={() => updateSearchTerm()} />
			<span>{searchCount > 0 ? searchIndex + 1 : 0}/{searchCount}</span>
			<Tooltip.Root delayDuration={0}>
				<Tooltip.Trigger>
					<span class="inline-flex">
						<button
							type="button"
							class="edra-command-button"
							class:active={caseSensitive}
							onclick={() => {
								caseSensitive = !caseSensitive;
								updateSearchTerm();
							}}
						>
							<CaseSensitive class="edra-toolbar-icon" />
						</button>
					</span>
				</Tooltip.Trigger>
				<Tooltip.Content
					side="bottom"
					sideOffset={6}
					class={EDRA_TOOLTIP_CONTENT_CLASS}
					arrowClasses={EDRA_TOOLTIP_ARROW_CLASS}
				>
					<EdraTooltipContent label="Potrivire sensibilă la MAJuscule/minuscule" />
				</Tooltip.Content>
			</Tooltip.Root>
			<Tooltip.Root delayDuration={0}>
				<Tooltip.Trigger>
					<span class="inline-flex">
						<button type="button" class="edra-command-button" onclick={previous}>
							<ArrowLeft class="edra-toolbar-icon" />
						</button>
					</span>
				</Tooltip.Trigger>
				<Tooltip.Content
					side="bottom"
					sideOffset={6}
					class={EDRA_TOOLTIP_CONTENT_CLASS}
					arrowClasses={EDRA_TOOLTIP_ARROW_CLASS}
				>
					<EdraTooltipContent label="Rezultatul anterior" />
				</Tooltip.Content>
			</Tooltip.Root>
			<Tooltip.Root delayDuration={0}>
				<Tooltip.Trigger>
					<span class="inline-flex">
						<button type="button" class="edra-command-button" onclick={next}>
							<ArrowRight class="edra-toolbar-icon" />
						</button>
					</span>
				</Tooltip.Trigger>
				<Tooltip.Content
					side="bottom"
					sideOffset={6}
					class={EDRA_TOOLTIP_CONTENT_CLASS}
					arrowClasses={EDRA_TOOLTIP_ARROW_CLASS}
				>
					<EdraTooltipContent label="Rezultatul următor" />
				</Tooltip.Content>
			</Tooltip.Root>
			<span class="separator" aria-hidden="true"></span>

			<input placeholder="Înlocuiește cu…" bind:value={replaceText} oninput={() => updateSearchTerm()} />
			<Tooltip.Root delayDuration={0}>
				<Tooltip.Trigger>
					<span class="inline-flex">
						<button type="button" class="edra-command-button" onclick={replace}>
							<Replace class="edra-toolbar-icon" />
						</button>
					</span>
				</Tooltip.Trigger>
				<Tooltip.Content side="bottom" sideOffset={6} class="max-w-none px-2.5 py-2">
					<EdraTooltipContent label="Înlocuiește apariția curentă" />
				</Tooltip.Content>
			</Tooltip.Root>
			<Tooltip.Root delayDuration={0}>
				<Tooltip.Trigger>
					<span class="inline-flex">
						<button type="button" class="edra-command-button" onclick={replaceAll}>
							<ReplaceAll class="edra-toolbar-icon" />
						</button>
					</span>
				</Tooltip.Trigger>
				<Tooltip.Content
					side="bottom"
					sideOffset={6}
					class={EDRA_TOOLTIP_CONTENT_CLASS}
					arrowClasses={EDRA_TOOLTIP_ARROW_CLASS}
				>
					<EdraTooltipContent label="Înlocuiește toate aparițiile" />
				</Tooltip.Content>
			</Tooltip.Root>
		</div>
	{/if}
</div>

<style>
	.separator {
		width: 1rem;
	}
</style>
