import type { FormSchemaV1 } from '$lib/forms/types';

/** Used when DB has no published definition yet (bootstrap). */
export const DEFAULT_CONTACT_FORM_SCHEMA: FormSchemaV1 = {
	version: 1,
	fields: [
		{
			key: 'name',
			type: 'text',
			label: { ro: 'Nume', en: 'Nume' },
			placeholder: {
				ro: 'ex. Maria Ionescu',
				en: 'ex. Maria Ionescu'
			},
			sampleValue: { ro: 'Alexandru Ionescu', en: 'Alexandru Ionescu' },
			required: false,
			piiClass: 'contact',
			autocomplete: 'name'
		},
		{
			key: 'email',
			type: 'email',
			label: { ro: 'Email', en: 'Email' },
			placeholder: {
				ro: 'nume@email.com',
				en: 'nume@email.com'
			},
			sampleValue: { ro: 'contact@exemplu.ro', en: 'contact@exemplu.ro' },
			required: true,
			piiClass: 'contact',
			autocomplete: 'email'
		},
		{
			key: 'message',
			type: 'textarea',
			label: { ro: 'Mesaj', en: 'Mesaj' },
			placeholder: {
				ro: 'Scrie aici întrebarea sau mesajul tău…',
				en: 'Scrie aici întrebarea sau mesajul tău…'
			},
			sampleValue: {
				ro: 'Bună ziua, aș dori să aflu mai multe despre taberele de vară pentru copii 10–12 ani și termenele de înscriere. Mulțumesc!',
				en: 'Bună ziua, aș dori să aflu mai multe despre taberele de vară pentru copii 10–12 ani și termenele de înscriere. Mulțumesc!'
			},
			required: true,
			piiClass: 'sensitive',
			rows: 6,
			autocomplete: 'off'
		}
	],
	submitLabel: { ro: 'Trimite mesajul', en: 'Trimite mesajul' },
	consentHint: {
		ro: 'Prin trimitere, ești de acord să te contactăm pentru clarificări.',
		en: 'Prin trimitere, ești de acord să te contactăm pentru clarificări.'
	}
};
