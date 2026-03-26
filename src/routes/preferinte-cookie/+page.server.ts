import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Preferințele sunt pe aceeași pagină cu politica de cookie-uri. */
export const load: PageServerLoad = () => {
	throw redirect(308, '/politica-cookie-uri#preferinte-cookie');
};
