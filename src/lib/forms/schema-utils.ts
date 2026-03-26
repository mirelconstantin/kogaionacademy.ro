import type { FormSchemaV1 } from '$lib/forms/types';

export function parseFormSchemaClient(raw: unknown): FormSchemaV1 | null {
	if (!raw || typeof raw !== 'object') return null;
	const o = raw as Record<string, unknown>;
	if (!Array.isArray(o.fields)) return null;
	return raw as FormSchemaV1;
}

export function emptyFormSchema(): FormSchemaV1 {
	return { version: 1, fields: [] };
}
