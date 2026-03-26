import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Romanian-aware slug from title: lowercase, hyphens, [a-z0-9ăâîșț-]. */
export function slugify(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9ăâîșț-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

/** Slug format: one or more segments of lowercase letters, digits, optional hyphens. */
const SLUG_REGEX = /^[a-z0-9ăâîșț]+(?:-[a-z0-9ăâîșț]+)*$/;

export function isSlugFormat(slug: string): boolean {
	return slug.length > 0 && SLUG_REGEX.test(slug);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
