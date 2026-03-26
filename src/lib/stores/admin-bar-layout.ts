import { writable } from 'svelte/store';

/** Measured height (px) of the public-site admin bar; 0 when not shown. Used by Navigation offset and InlineEditOverlay. */
export const adminBarLayoutHeightPx = writable(0);
