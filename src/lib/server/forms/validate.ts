import type { FormFieldDef, FormSchemaV1 } from '$lib/forms/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ValidationResult =
	| { ok: true; values: Record<string, string> }
	| { ok: false; errors: Record<string, string>; values: Record<string, string> };

export function validateAgainstSchema(schema: FormSchemaV1, body: Record<string, unknown>): ValidationResult {
	const values: Record<string, string> = {};
	const errors: Record<string, string> = {};

	for (const field of schema.fields) {
		const raw = body[field.key];
		const str = raw == null ? '' : String(raw).trim();
		values[field.key] = str;

		if (field.required && !str) {
			errors[field.key] = 'required';
			continue;
		}
		if (!str) continue;

		switch (field.type) {
			case 'email':
				if (!EMAIL_REGEX.test(str)) errors[field.key] = 'invalid';
				break;
			case 'number':
				if (Number.isNaN(Number(str))) errors[field.key] = 'invalid';
				break;
			case 'checkbox':
				// expect 'on' or 'true'
				break;
			case 'select':
				if (field.options && !field.options.some((o) => o.value === str)) errors[field.key] = 'invalid';
				break;
			default:
				break;
		}
	}

	if (Object.keys(errors).length > 0) return { ok: false, errors, values };
	return { ok: true, values };
}

export function fieldDefsByKey(schema: FormSchemaV1): Map<string, FormFieldDef> {
	return new Map(schema.fields.map((f) => [f.key, f]));
}
