import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

/**
 * Placeholder used only while `vite build` runs.
 *
 * SvelteKit imports the server hooks during the postbuild prerender step even when no
 * route is prerendered (`core/postbuild/prerender.js` calls `get_hooks()` unconditionally,
 * after `set_building()`). Constructing Better Auth at module scope therefore used to run
 * at build time, and it rejects an empty `secret` — so `bun run build` failed unless the
 * production secret was injected into the Docker build stage.
 *
 * The value is never served: `$env/dynamic/private` is read from `process.env` at runtime,
 * so the real secret always comes from the container environment. At runtime (building ===
 * false) an unset secret is still passed through as-is, so Better Auth keeps failing loudly
 * rather than silently signing tokens with a known default.
 */
const BUILD_TIME_SECRET = 'kogaion-build-time-placeholder-not-used-at-runtime';

/** Derived from `betterAuth` itself: `better-auth` and `better-auth/minimal` export different `Auth` types. */
export type AuthInstance = ReturnType<typeof betterAuth>;

let instance: AuthInstance | null = null;

/**
 * Better Auth instance, created on first use and reused afterwards.
 * Creating it lazily keeps `vite build` free of runtime secrets; use `init` (see
 * `src/hooks.server.ts`) to fail fast at server start instead of on the first request.
 */
export function getAuth(): AuthInstance {
	if (instance) return instance;

	instance = betterAuth({
		baseURL: env.ORIGIN,
		secret: env.BETTER_AUTH_SECRET || (building ? BUILD_TIME_SECRET : undefined),
		database: drizzleAdapter(db, { provider: 'pg' }),
		user: {
			additionalFields: {
				role: { type: 'string', default: 'user' }
			}
		},
		emailAndPassword: { enabled: false },
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID ?? '',
				clientSecret: env.GOOGLE_CLIENT_SECRET ?? ''
			}
		},
		plugins: [sveltekitCookies(getRequestEvent)] // make sure this is the last plugin in the array
	});

	return instance;
}

/**
 * Warm the instance so a misconfigured production environment fails at server start rather
 * than on the first request. SvelteKit also calls `init` during the build's prerender step
 * (`postbuild/prerender.js` -> `Server.init()`), so it is skipped while `building` is true.
 *
 * The `await` matters: `betterAuth()` validates the secret inside a promise it never awaits
 * (`better-auth/dist/auth/base.mjs:9`), so without awaiting `$context` a bad secret would
 * surface as an unhandled rejection instead of a boot error.
 */
export async function initAuth(): Promise<void> {
	if (building) return;

	// `src/lib/server/db/index.ts` silently falls back to a local DSN when DATABASE_URL is
	// unset, which looks like "the site has no content" rather than a configuration error.
	// Also check ORIGIN: Better Auth warns and breaks OAuth callbacks without a base URL.
	const missing = (['DATABASE_URL', 'ORIGIN', 'BETTER_AUTH_SECRET'] as const).filter(
		(key) => !env[key]?.trim()
	);
	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variable(s): ${missing.join(', ')}. ` +
				'They must be set on the container, not passed as Docker build args — ' +
				'see docs/DB_AND_ADMIN.md.'
		);
	}

	await getAuth().$context;
}
