import type { FormFieldDef, FormSchemaV1 } from '$lib/forms/types';

const EMAIL_FALLBACK = 'exemplu@domeniu.ro';
const TEXT_FALLBACK = 'Text exemplu';
const TEXTAREA_FALLBACK =
	'Bună ziua, aș dori mai multe informații despre programele voastre și cum mă pot înscrie.';

export function sampleValueForField(field: FormFieldDef, locale: string): string {
	const loc = field.sampleValue?.[locale] ?? field.sampleValue?.['ro'];
	if (loc) return loc;
	switch (field.type) {
		case 'email':
			return EMAIL_FALLBACK;
		case 'number':
			return '42';
		case 'tel':
			return '0720 000 000';
		case 'checkbox':
			return 'true';
		case 'select':
			return field.options?.[0]?.value ?? 'opt1';
		case 'textarea':
			return TEXTAREA_FALLBACK;
		default:
			return TEXT_FALLBACK;
	}
}

/** Build initial values map for preview mode. */
export function previewValuesFromSchema(schema: FormSchemaV1, locale: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const f of schema.fields) {
		out[f.key] = sampleValueForField(f, locale);
	}
	return out;
}
