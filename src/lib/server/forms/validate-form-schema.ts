import type { FormSchemaV1 } from '$lib/forms/types';

const KEY_RE = /^[a-z][a-z0-9_]*$/;

export function validateFormSchemaFields(schema: FormSchemaV1): { ok: true } | { ok: false; message: string } {
	if (!schema.fields?.length) {
		return { ok: false, message: 'Adaugă cel puțin un câmp.' };
	}
	const keys = new Set<string>();
	for (const f of schema.fields) {
		const k = (f.key ?? '').trim();
		if (!k) return { ok: false, message: 'Toate câmpurile trebuie să aibă o cheie (key).' };
		if (!KEY_RE.test(k)) {
			return {
				ok: false,
				message: `Cheie invalidă „${k}”: folosește litere mici, cifre și underscore (începe cu literă).`
			};
		}
		if (keys.has(k)) return { ok: false, message: `Cheie duplicată: „${k}”.` };
		keys.add(k);
		if (f.widthPercent != null) {
			const allowed = new Set([25, 33, 50, 66, 75, 100]);
			if (!allowed.has(Number(f.widthPercent))) {
				return {
					ok: false,
					message: `Lățime invalidă pentru „${k}”. Valori permise: 25, 33, 50, 66, 75, 100.`
				};
			}
		}
		if (f.type === 'select' && (!f.options || f.options.length === 0)) {
			return { ok: false, message: `Câmpul „${k}” (select) necesită cel puțin o opțiune.` };
		}
	}
	return { ok: true };
}
