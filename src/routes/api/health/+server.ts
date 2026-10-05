/**
 * GET /api/health -- the one endpoint a deploy pipeline is allowed to trust.
 *
 * Three rules, all deliberate, all load-bearing:
 *
 * 1. IT NEVER TOUCHES THE DATABASE. A readiness probe that queries Postgres reports the
 *    application dead during a database failover, and every replica is restarted on top
 *    of a recoverable dependency incident -- the probe becomes the cause. If the data
 *    layer is down this still answers `ok`. That is the design, and the fix is not to
 *    add a query here.
 *
 * 2. IT ALWAYS ANSWERS 200, even when a check is unhealthy. A weak BETTER_AUTH_SECRET is
 *    a reason to rotate the secret, not a reason to restart the container into the very
 *    same misconfiguration: a restart re-reads the same value and changes nothing.
 *    Liveness and configuration health are different questions and they get different
 *    answers -- the status code answers the first, the body answers the second.
 *
 * 3. IT NAMES THE BUILD. `commit` is baked into the image from the GIT_SHA build arg, so
 *    this endpoint says which commit is running. With the digest published by CI
 *    (docs/ghcr-coolify/05-verificare.md) that closes the chain pipeline -> image ->
 *    process. A 2xx on its own proves only that the process is alive.
 *
 * GET needs no auth. The platform probes without credentials, and a 401 here reads as
 * "the container is broken" rather than "the secret is weak".
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

/**
 * Captured once per process. adapter-node runs one process per container, so this is the
 * container's uptime, not the load balancer's.
 */
const startedAt = Date.now();

/**
 * better-auth's own floor. It throws only for its *default* secret; one that is merely
 * short or low-entropy produces a warning, and a warning lost among the boot log is
 * indistinguishable from no warning at all.
 */
const MIN_AUTH_SECRET_LENGTH = 32;

type Check = { healthy: boolean; problems?: string[] };

/**
 * Read through `$env/dynamic/private`, never `$env/static/private`.
 *
 * `$env/static/*` inlines values at BUILD time. The secret does not exist during the
 * build, so a static read would compile an empty string into the bundle and this probe
 * would report the placeholder healthy forever, never seeing the real value.
 */
function checkAuthSecret(): Check {
	const secret = env.BETTER_AUTH_SECRET?.trim();
	const problems: string[] = [];

	if (!secret) {
		problems.push('BETTER_AUTH_SECRET is not set');
	} else if (secret.length < MIN_AUTH_SECRET_LENGTH) {
		problems.push(
			`BETTER_AUTH_SECRET is only ${secret.length} characters (minimum ${MIN_AUTH_SECRET_LENGTH})`
		);
	}

	return problems.length === 0 ? { healthy: true } : { healthy: false, problems };
}

/**
 * Never let a CDN or the browser answer this from cache: a stale 200 here is a lie about
 * what is running right now.
 */
const NO_CACHE_HEADERS = {
	'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
	pragma: 'no-cache',
	expires: '0'
} as const;

export const GET: RequestHandler = async () => {
	const commit = env.GIT_SHA?.trim() || 'unknown';

	const checks = {
		authSecret: checkAuthSecret(),
		runtime: {
			healthy: true,
			versions: {
				// bun at runtime, because the image is oven/bun and ships no node.
				bun: process.versions.bun ?? null,
				node: process.versions.node ?? null
			}
		}
	};

	// 200 even when a check is unhealthy, as explained at the top of the file.
	//
	// `$app/environment`'s `building` is deliberately not imported: no route in this
	// project sets `prerender = true`, and `init` in src/hooks.server.ts returns early
	// while building, so nothing during `vite build` ever calls this handler. Importing
	// it would add a build-time dependency in exchange for no behaviour.
	return json(
		{
			status: 'ok',
			// APP_VERSION if the operator set it on the container, otherwise the short
			// commit. Nothing in the build sets it, so a deployment that only ran CI
			// reports the short sha here.
			version: env.APP_VERSION?.trim() || (commit === 'unknown' ? 'unknown' : commit.slice(0, 7)),
			commit,
			startedAt: new Date(startedAt).toISOString(),
			uptime: Math.floor((Date.now() - startedAt) / 1000),
			checks
		},
		{ headers: NO_CACHE_HEADERS }
	);
};
