import { requirePermission } from '$lib/server/permissions';
import type { PageServerLoad } from './$types';

/** Page keys that are editable as "Pagini" (mentors has its own admin section). */
const PAGE_KEYS = [
	{ key: 'home', label: 'Pagina principală', desc: 'Hero, intro, statistici, mentori și programe evidențiate' },
	{ key: 'about', label: 'Despre', desc: 'Scrisoare, timeline, misiune, competențe, fondatori' },
	{ key: 'programs', label: 'Programe', desc: 'Titlu hero și listă de programe cu descrieri' },
	{ key: 'contact', label: 'Contact', desc: 'Date de contact, adresă și setări pagină contact' }
] as const;

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'pages.view');
	return { pages: PAGE_KEYS };
};
