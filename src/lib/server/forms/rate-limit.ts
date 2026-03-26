type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
	const now = Date.now();
	let b = buckets.get(key);
	if (!b || now > b.resetAt) {
		b = { count: 0, resetAt: now + windowMs };
		buckets.set(key, b);
	}
	if (b.count >= limit) return false;
	b.count += 1;
	return true;
}

/** Periodic cleanup (best-effort). */
export function pruneRateLimits(maxEntries = 5000): void {
	if (buckets.size <= maxEntries) return;
	const now = Date.now();
	for (const [k, v] of buckets) {
		if (now > v.resetAt) buckets.delete(k);
	}
}
