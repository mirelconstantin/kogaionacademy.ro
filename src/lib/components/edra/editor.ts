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
import { Editor, type Extensions, type EditorOptions, type Content } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { getHandlePaste } from './utils.js';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Typography from '@tiptap/extension-typography';
import { ColorHighlighter } from './extensions/ColorHighlighter.js';
import { FontSize, TextStyle, Color } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import SearchAndReplace from './extensions/FindAndReplace.js';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Table, TableCell, TableRow, TableHeader } from './extensions/table/index.js';
import { Placeholder } from '@tiptap/extensions';
import { Markdown } from 'tiptap-markdown';
import MathExtension from '@aarkue/tiptap-math-extension';
import AutoJoiner from 'tiptap-extension-auto-joiner';
import 'katex/dist/katex.min.css';

export default (
	element?: HTMLElement,
	content?: Content,
	extensions?: Extensions,
	options?: Partial<EditorOptions>
) => {
	const editor = new Editor({
		element,
		content,
		extensions: [
			StarterKit.configure({
				orderedList: {
					HTMLAttributes: {
						class: 'list-decimal'
					}
				},
				bulletList: {
					HTMLAttributes: {
						class: 'list-disc'
					}
				},
				heading: {
					levels: [1, 2, 3, 4]
				},
				link: {
					openOnClick: false,
					autolink: true,
					linkOnPaste: true
				},
				codeBlock: false
			}),
			Highlight.configure({
				multicolor: true
			}),
			Placeholder.configure({
				emptyEditorClass: 'is-empty',
				// Use a placeholder:
				// Use different placeholders depending on the node type:
				placeholder: ({ node }) => {
					if (node.type.name === 'heading') {
						return 'What’s the title?';
					} else if (node.type.name === 'paragraph') {
						return 'Press / or write something ...';
					}
					return '';
				}
			}),
			Color,
			Subscript,
			Superscript,
			Typography,
			ColorHighlighter,
			TextStyle,
			FontSize,
			TextAlign.configure({
				types: ['heading', 'paragraph']
			}),
			TaskList,
			TaskItem.configure({
				nested: true
			}),
			SearchAndReplace,
			MathExtension.configure({ evaluation: true }),
			AutoJoiner,
			Table,
			TableHeader,
			TableRow,
			TableCell,
			Markdown.configure({
				html: true,
				tightLists: true,
				tightListClass: 'tight',
				bulletListMarker: '-',
				linkify: true,
				breaks: true,
				transformPastedText: true,
				transformCopiedText: false
			}),

			...(extensions ?? [])
		],
		...options
	});

	editor.setOptions({
		editorProps: {
			handlePaste: getHandlePaste(editor)
		}
	});
	return editor;
};
