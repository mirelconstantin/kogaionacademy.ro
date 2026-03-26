import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// In-memory: sessionId -> lastSeen (ms)
const activeSessions = new Map<string, number>();
const FIVE_MIN_MS = 5 * 60 * 1000;

function prune() {
	const now = Date.now();
	for (const [id, ts] of activeSessions.entries()) {
		if (now - ts > FIVE_MIN_MS) activeSessions.delete(id);
	}
}

export const GET: RequestHandler = async (event) => {
	prune();

	// ?ping=1: record this request as active
	const ping = event.url.searchParams.get('ping') === '1';
	if (ping) {
		let id = event.cookies.get('activity_id');
		if (!id) {
			id = `anon-${crypto.randomUUID()}`;
			event.cookies.set('activity_id', id, { path: '/', maxAge: 60 * 60 * 24 });
		}
		activeSessions.set(id, Date.now());
	}

	const now = Date.now();
	let count = 0;
	for (const ts of activeSessions.values()) {
		if (now - ts <= FIVE_MIN_MS) count++;
	}

	return json({ count });
};
