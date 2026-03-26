import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { formsAnswer, formsDefinition, formsSubmission } from '$lib/server/db/schema';
import { logCmsAudit, getUserDisplayName } from '$lib/server/audit';
import { maskSensitiveField } from '$lib/server/forms/pii';
import { requirePermission } from '$lib/server/permissions';
import { desc, eq, inArray } from 'drizzle-orm';
import * as XLSX from 'xlsx';

const LIMIT = 10_000;

function toCsv(rows: Record<string, string>[], columns: string[]): string {
	const esc = (v: string) => {
		const s = v ?? '';
		if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
		return s;
	};
	const header = columns.map(esc).join(',');
	const lines = rows.map((r) => columns.map((c) => esc(r[c] ?? '')).join(','));
	return [header, ...lines].join('\n');
}

export const GET: RequestHandler = async (event) => {
	requirePermission(event, 'forms.export');
	const id = parseInt(event.params.id ?? '', 10);
	if (Number.isNaN(id)) throw error(400, 'Bad id');

	const [def] = await db.select().from(formsDefinition).where(eq(formsDefinition.id, id)).limit(1);
	if (!def) throw error(404, 'Not found');

	const format = event.url.searchParams.get('format') ?? 'csv';
	const mask = event.url.searchParams.get('mask') === '1';

	const subs = await db
		.select()
		.from(formsSubmission)
		.where(eq(formsSubmission.formKey, def.key))
		.orderBy(desc(formsSubmission.createdAt))
		.limit(LIMIT);

	const subIds = subs.map((s) => s.id);
	const answerRows =
		subIds.length === 0
			? []
			: await db.select().from(formsAnswer).where(inArray(formsAnswer.submissionId, subIds));

	const bySub = new Map<number, Record<string, string>>();
	for (const s of subs) {
		bySub.set(s.id, {
			id: String(s.id),
			createdAt: s.createdAt.toISOString(),
			formVersion: String(s.formVersion),
			locale: s.locale ?? ''
		});
	}
	for (const a of answerRows) {
		const row = bySub.get(a.submissionId);
		if (!row) continue;
		const raw = a.valueText ?? '';
		const pii = a.piiClass ?? 'none';
		row[a.fieldKey] = mask ? maskSensitiveField(pii, raw) : raw;
	}

	const pivotRows = [...bySub.values()];
	const fieldCols = [...new Set(answerRows.map((a) => a.fieldKey))].sort();
	const columns = ['id', 'createdAt', 'formVersion', 'locale', ...fieldCols];

	if (format === 'csv') {
		const csv = toCsv(pivotRows, columns);
		await logCmsAudit({
			entityType: 'forms_export',
			entityId: `${def.key}:${def.locale}`,
			userId: event.locals.user?.id ?? null,
			userName: getUserDisplayName(event.locals.user ?? null),
			action: 'export',
			payloadAfter: { format: 'csv', mask, rows: pivotRows.length }
		});
		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="${def.key}-${def.locale}-export.csv"`
			}
		});
	}

	if (format === 'xlsx') {
		const ws = XLSX.utils.json_to_sheet(
			pivotRows.map((r) => Object.fromEntries(columns.map((c) => [c, r[c] ?? ''])))
		);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Responses');
		const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
		await logCmsAudit({
			entityType: 'forms_export',
			entityId: `${def.key}:${def.locale}`,
			userId: event.locals.user?.id ?? null,
			userName: getUserDisplayName(event.locals.user ?? null),
			action: 'export',
			payloadAfter: { format: 'xlsx', mask, rows: pivotRows.length }
		});
		return new Response(buf, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': `attachment; filename="${def.key}-${def.locale}-export.xlsx"`
			}
		});
	}

	throw error(400, 'Unsupported format');
};
