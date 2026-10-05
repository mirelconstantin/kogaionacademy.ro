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
import { Slice } from '@tiptap/pm/model';
import { EditorView } from '@tiptap/pm/view';
import * as pmView from '@tiptap/pm/view';

function getPmView() {
	try {
		return pmView;
	} catch (error) {
		console.error(error);
		return null;
	}
}

export function serializeForClipboard(view: EditorView, slice: Slice) {
	// Newer Tiptap/ProseMirror
	if (view && typeof view.serializeForClipboard === 'function') {
		return view.serializeForClipboard(slice);
	}

	// Older version fallback
	const proseMirrorView = getPmView();

	if (proseMirrorView && typeof proseMirrorView?.__serializeForClipboard === 'function') {
		return proseMirrorView.__serializeForClipboard(view, slice);
	}

	throw new Error('No supported clipboard serialization method found.');
}
