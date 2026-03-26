/**
 * Calls the seed-admin API to create the default admin user.
 * Requires the dev server to be running (e.g. bun run dev in another terminal).
 * Usage: bun run scripts/seed-admin-request.ts
 * Optional: SEED_ADMIN_SECRET=yourSecret (for production)
 */
const origin = process.env.ORIGIN ?? 'http://localhost:5173';
const secret = process.env.SEED_ADMIN_SECRET;

async function main() {
	const url = new URL('/api/seed-admin', origin);
	const body: { secret?: string } = {};
	if (secret) body.secret = secret;

	const res = await fetch(url.toString(), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string };
	if (!res.ok) {
		console.error('Seed failed:', data.error ?? res.statusText);
		process.exit(1);
	}
	if (data.ok === false) {
		console.error(data.message ?? 'User not found. Log in with Google (pazalgroup@gmail.com) first, then run this again.');
		process.exit(1);
	}
	console.log(data.message ?? 'Admin seed OK.');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
