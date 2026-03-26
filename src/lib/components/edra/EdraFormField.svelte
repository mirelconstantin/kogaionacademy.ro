<script lang="ts">
	/**
	 * Câmp formular cu editorul **Edra** implicit (toolbar + EdraEditor din `headless/`).
	 * Conținut Markdown existent → HTML la încărcare; submit trimite HTML.
	 */
	import { browser } from '$app/environment';
	import { marked } from 'marked';
	import type { Editor } from '@tiptap/core';
	import { EdraEditor, EdraToolBar } from '$lib/components/edra/headless';

	let {
		value = '',
		name = 'body',
		placeholder: _placeholder = '',
		/** Oglindește tipografia din paginile publice (legal vs blog). */
		proseVariant = 'legal'
	}: {
		value?: string;
		name?: string;
		placeholder?: string;
		proseVariant?: 'legal' | 'blog';
	} = $props();

	let editor = $state<Editor | undefined>(undefined);
	let toolbarTick = $state(0);

	function looksLikeHtml(input: string): boolean {
		return /<\/?[a-z][\s\S]*>/i.test(input);
	}

	function toEditorHtml(input: string): string {
		const src = (input ?? '').trim();
		if (!src) return '<p></p>';
		if (looksLikeHtml(src)) return src;
		return marked.parse(src, { async: false, gfm: true }) as string;
	}

	const initialContent = $derived(toEditorHtml(value));
	const html = $derived.by(() => {
		toolbarTick;
		return editor ? editor.getHTML() : initialContent;
	});

	function onEditorUpdate() {
		toolbarTick += 1;
	}

	const mirrorClass = $derived(
		proseVariant === 'blog' ? 'edra-prose-mirror--blog' : 'edra-prose-mirror--legal'
	);
</script>

{#if browser}
	<div class={`edra-form-field-shell ${mirrorClass}`} data-rich-editor="edra-default">
		<input type="hidden" name={name} value={html} />
		{#if editor}
			<EdraToolBar
				editor={editor}
				class="edra-toolbar edra-toolbar--shell flex w-full min-w-0 max-w-full flex-nowrap items-center gap-0 border-b border-border/70 bg-gradient-to-b from-muted/25 to-muted/40 px-2 py-2"
			/>
		{/if}
		<div class="min-h-[300px] px-4 py-4 sm:px-6 sm:py-5">
			<EdraEditor
				bind:editor
				content={initialContent}
				onUpdate={onEditorUpdate}
				class="min-h-[260px]"
			/>
		</div>
	</div>
{:else}
	<textarea
		name={name}
		class="min-h-[280px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm"
		readonly
		placeholder="Editorul se încarcă..."
	>{value || _placeholder}</textarea>
	<input type="hidden" name={name} value={value} />
{/if}
