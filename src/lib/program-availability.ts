/**
 * Availability of a program detail page.
 *
 * A program page is public when its row is published. The slug is no longer
 * allow-listed: every program in `program` with `status = 'published'` has a detail
 * page, and `routes/programs/[slug]/+page.server.ts` still redirects unknown slugs to
 * the listing, so drafts stay hidden.
 */

/** Raw `program.status` values that make a detail page public. */
const PUBLIC_STATUSES = new Set(['published']);

export function isProgramPubliclyOpen(slug: string, status?: string | null): boolean {
	void slug;
	if (status == null) return true;
	return PUBLIC_STATUSES.has(status);
}
