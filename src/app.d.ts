import type { User, Session } from 'better-auth/minimal';
import type { PermissionKey } from '$lib/server/permissions-model';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;
			/** Resolved admin permissions (set in hooks for /admin). */
			permissions?: Set<PermissionKey>;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
