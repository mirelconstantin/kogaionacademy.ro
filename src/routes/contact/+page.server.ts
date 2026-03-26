import { getLocale } from '$lib/paraglide/runtime';
import { getContactSettings, getPageSections } from '$lib/server/content';
import { DEFAULT_CONTACT_FORM_SCHEMA } from '$lib/server/forms/defaults';
import { getPublishedFormDefinition, parseFormSchema } from '$lib/server/forms/queries';
import type { Locale } from '$lib/server/content';
import type { PageServerLoad } from './$types';

const FALLBACK_EMAIL = 'diana@kogaionacademy.ro';
const FALLBACK_PHONE = '0720.529.398';
const FALLBACK_ADDRESS = 'Șoseaua Nordului nr. 94F, Sector 1, București';

export const load: PageServerLoad = async () => {
	const locale = getLocale() as Locale;
	const [contact, sections, published] = await Promise.all([
		getContactSettings(locale),
		getPageSections('contact', locale),
		getPublishedFormDefinition('contact', locale)
	]);
	const socials = (contact?.socials ?? []) as { name: string; url: string }[];
	const contactSocials = socials.filter((s) => s?.url?.trim());
	const schema =
		published != null ? (parseFormSchema(published.schemaJson) ?? DEFAULT_CONTACT_FORM_SCHEMA) : DEFAULT_CONTACT_FORM_SCHEMA;
	const formVersion = published?.version ?? 1;
	return {
		contactEmail: contact?.email ?? FALLBACK_EMAIL,
		contactPhone: contact?.phone ?? FALLBACK_PHONE,
		contactAddress: contact?.address ?? FALLBACK_ADDRESS,
		contactSocials,
		sections,
		formRuntime: {
			formKey: 'contact' as const,
			formVersion,
			schema
		}
	};
};
