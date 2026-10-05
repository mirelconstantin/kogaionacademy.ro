import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const KEY = 'kogaion-hide-edit-icons';

function getInitial(): boolean {
	if (!browser) return false;
	try {
		return localStorage.getItem(KEY) === 'true';
	} catch {
		return false;
	}
}

export const hideEditIcons = writable<boolean>(getInitial());

if (browser) {
	hideEditIcons.subscribe((v) => {
		try {
			localStorage.setItem(KEY, String(v));
		} catch {
			// Private browsing and disabled storage both throw here. The preference is
			// cosmetic, so failing to persist it must not take the page down with it.
		}
	});
}
