/**
 * Sets role to editor for the super-admin email (pazalgroup@gmail.com).
 * Login is Google-only; run this after first Google login to grant editor role,
 * or the user can be updated manually in DB.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { SUPER_ADMIN_EMAIL } from '$lib/server/permissions';

export const POST: RequestHandler = async (event) => {
	const secret = env.SEED_ADMIN_SECRET;
	const isDev = env.NODE_ENV === 'development';
	if (!isDev && !secret) {
		return json({ error: 'SEED_ADMIN_SECRET not set' }, { status: 403 });
	}
	const body = await event.request.json().catch(() => ({}));
	const providedSecret = body?.secret ?? body?.SEED_ADMIN_SECRET ?? event.url.searchParams.get('secret');
	if (!isDev && secret !== providedSecret) {
		return json({ error: 'Invalid or missing secret' }, { status: 403 });
	}

	const [updated] = await db
		.update(user)
		.set({ role: 'editor' })
		.where(eq(user.email, SUPER_ADMIN_EMAIL))
		.returning({ id: user.id });

	if (!updated) {
		return json({
			ok: false,
			message:
				'Loghează-te mai întâi cu Google (pazalgroup@gmail.com); acel cont va fi super admin. Nu există cont email/parolă. Rulează din nou acest seed după primul login.'
		});
	}
	return json({ ok: true, message: 'Rol editor setat pentru ' + SUPER_ADMIN_EMAIL });
};
