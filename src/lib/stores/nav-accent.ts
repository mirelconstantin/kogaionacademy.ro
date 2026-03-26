import { writable } from 'svelte/store';

const defaultColor = '#154b6a';

export const navAccentColor = writable<string>(defaultColor);
export const navCurrentSlideIndex = writable<number>(0);
