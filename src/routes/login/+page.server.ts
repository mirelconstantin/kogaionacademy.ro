import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { isEditor } from '$lib/server/permissions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.session && event.locals.user && isEditor(event.locals.user)) {
		const callbackURL = event.url.searchParams.get('callbackURL') ?? '/admin';
		throw redirect(302, callbackURL);
	}
	return { callbackURL: event.url.searchParams.get('callbackURL') ?? '/admin' };
};

export const actions: Actions = {
	signInGoogle: async (event) => {
		const callbackURL = (await event.request.formData()).get('callbackURL')?.toString() ?? '/admin';
		const res = await auth.api.signInSocial({
			body: { provider: 'google', callbackURL },
			headers: event.request.headers,
			asResponse: true
		});
		const url =
			res instanceof Response
				? res.headers.get('Location')
				: (res as { url?: string } | null)?.url;
		if (url) throw redirect(302, url);
		throw redirect(302, callbackURL);
	},
	signOut: async (event) => {
		await auth.api.signOut({ headers: event.request.headers });
		throw redirect(302, '/');
	}
};
