import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	formsAnswer,
	formsDefinition,
	formsDefinitionRevision,
	formsEvent,
	formsMetricDaily,
	formsSubmission
} from '$lib/server/db/schema';
import { logCmsAudit, getUserDisplayName } from '$lib/server/audit';
import { parseFormSchema } from '$lib/server/forms/queries';
import { validateFormSchemaFields } from '$lib/server/forms/validate-form-schema';
import {
	buildSubmissionDetailForAdmin,
	truncateMiddle,
	type SubmissionDetailForAdmin
} from '$lib/server/forms/submission-display';
import { requirePermission } from '$lib/server/permissions';
import { and, count, desc, eq, gte, inArray, max } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

const SUBMISSION_LIMIT = 500;

/** Postgres 42P01 = undefined_table (ex. migrația 0012 neaplicată). */
function isMissingRevisionTableError(e: unknown): boolean {
	if (!e || typeof e !== 'object') return false;
	const o = e as Record<string, unknown>;
	if (o.code === '42P01') return true;
	const cause = o.cause;
	if (cause && typeof cause === 'object') {
		const c = cause as Record<string, unknown>;
		if (c.code === '42P01') return true;
	}
	const msg = String(o.message ?? '');
	const causeMsg = cause && typeof cause === 'object' ? String((cause as { message?: string }).message ?? '') : '';
	const full = `${msg} ${causeMsg}`;
	return /forms_definition_revision/i.test(full) && /does not exist/i.test(full);
}

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'forms.view');
	const id = parseInt(event.params.id ?? '', 10);
	if (Number.isNaN(id)) redirect(302, '/admin/forms');

	const [def] = await db.select().from(formsDefinition).where(eq(formsDefinition.id, id)).limit(1);
	if (!def) redirect(302, '/admin/forms');

	const schema = parseFormSchema(def.schemaJson);
	const fieldKeys = schema?.fields.map((f) => f.key) ?? [];

	const subs = await db
		.select()
		.from(formsSubmission)
		.where(eq(formsSubmission.formKey, def.key))
		.orderBy(desc(formsSubmission.createdAt))
		.limit(SUBMISSION_LIMIT);

	const subIds = subs.map((s) => s.id);
	let answers: (typeof formsAnswer.$inferSelect)[] = [];
	if (subIds.length) {
		answers = await db.select().from(formsAnswer).where(inArray(formsAnswer.submissionId, subIds));
	}

	const pivotRows: Record<string, string>[] = [];
	const bySub = new Map<number, Record<string, string>>();
	for (const s of subs) {
		const row: Record<string, string> = {
			id: String(s.id),
			createdAt: s.createdAt.toISOString(),
			formVersion: String(s.formVersion),
			locale: s.locale ?? ''
		};
		bySub.set(s.id, row);
		pivotRows.push(row);
	}
	for (const a of answers) {
		const row = bySub.get(a.submissionId);
		if (row) row[a.fieldKey] = a.valueText ?? '';
	}

	const submissionDetails: Record<string, SubmissionDetailForAdmin> = {};
	for (const s of subs) {
		submissionDetails[String(s.id)] = buildSubmissionDetailForAdmin({
			pageUrl: s.pageUrl,
			referrer: s.referrer,
			ipAddress: s.ipAddress,
			userAgent: s.userAgent,
			utm: s.utm,
			consentSnapshot: s.consentSnapshot,
			sessionFingerprint: s.sessionFingerprint,
			userId: s.userId,
			idempotencyKey: s.idempotencyKey
		});
		const row = bySub.get(s.id);
		if (row) {
			const d = submissionDetails[String(s.id)];
			row._context = [
				d.pageUrl,
				d.referrer,
				d.userAgentSummary,
				d.utmLine,
				d.consentLine,
				d.sessionFull,
				d.userId,
				d.idempotencyKey
			]
				.join(' ')
				.toLowerCase();
			row._pageHint = truncateMiddle(s.pageUrl, 36);
			row._uaSummary = d.userAgentSummary;
		}
	}

	const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5);
	const funnelRows = await db
		.select({
			eventType: formsEvent.eventType,
			n: count()
		})
		.from(formsEvent)
		.where(and(eq(formsEvent.formKey, def.key), gte(formsEvent.occurredAt, thirtyDaysAgo)))
		.groupBy(formsEvent.eventType);

	const metricsRows = await db
		.select()
		.from(formsMetricDaily)
		.where(and(eq(formsMetricDaily.formKey, def.key), gte(formsMetricDaily.day, thirtyDaysAgo.toISOString().slice(0, 10))))
		.orderBy(desc(formsMetricDaily.day));

	const views = Number(funnelRows.find((r) => r.eventType === 'form_view')?.n ?? 0);
	const submits = Number(funnelRows.find((r) => r.eventType === 'submit_success')?.n ?? 0);
	const conversion = views > 0 ? Math.round((submits / views) * 1000) / 10 : 0;

	let revisions: (typeof formsDefinitionRevision.$inferSelect)[] = [];
	try {
		revisions = await db
			.select()
			.from(formsDefinitionRevision)
			.where(eq(formsDefinitionRevision.definitionId, def.id))
			.orderBy(desc(formsDefinitionRevision.createdAt))
			.limit(80);
	} catch (e) {
		if (!isMissingRevisionTableError(e)) throw e;
		console.warn(
			'[admin/forms] Tabelul forms_definition_revision lipsește. Rulează: bun run db:migrate'
		);
	}

	return {
		definition: def,
		schemaJsonText: JSON.stringify(def.schemaJson ?? {}, null, 2),
		fieldKeys,
		pivotRows,
		submissionDetails,
		funnel: funnelRows,
		metricsDaily: metricsRows,
		revisions,
		kpi: { views, submits, conversion }
	};
};

const REVISION_PRUNE = 100;

async function pruneOldRevisions(definitionId: number): Promise<void> {
	const rows = await db
		.select({ id: formsDefinitionRevision.id })
		.from(formsDefinitionRevision)
		.where(eq(formsDefinitionRevision.definitionId, definitionId))
		.orderBy(desc(formsDefinitionRevision.createdAt));
	const toDelete = rows.slice(REVISION_PRUNE).map((r) => r.id);
	if (toDelete.length) {
		await db.delete(formsDefinitionRevision).where(inArray(formsDefinitionRevision.id, toDelete));
	}
}

async function appendDefinitionRevisionSnapshot(
	definitionId: number,
	schemaJson: unknown,
	title: string | null,
	createdBy: string | null
): Promise<void> {
	try {
		await db.insert(formsDefinitionRevision).values({
			definitionId,
			schemaJson,
			title,
			createdBy
		});
		await pruneOldRevisions(definitionId);
	} catch (e) {
		if (!isMissingRevisionTableError(e)) throw e;
		console.warn(
			'[admin/forms] Nu s-a putut salva snapshot-ul în istoric (tabel lipsă). Rulează: bun run db:migrate'
		);
	}
}

export const actions: Actions = {
	saveDraft: async (event) => {
		requirePermission(event, 'forms.edit');
		const id = parseInt(event.params.id ?? '', 10);
		if (Number.isNaN(id)) return fail(400, { message: 'Invalid id' });

		const data = await event.request.formData();
		const title = (data.get('title') as string)?.trim() ?? '';
		const schemaText = (data.get('schemaJson') as string) ?? '';
		let schemaJson: unknown;
		try {
			schemaJson = JSON.parse(schemaText);
		} catch {
			return fail(400, { message: 'Schema JSON invalid' });
		}
		const parsed = parseFormSchema(schemaJson);
		if (!parsed) return fail(400, { message: 'Schema invalid: need fields[]' });
		const fieldCheck = validateFormSchemaFields(parsed);
		if (!fieldCheck.ok) return fail(400, { message: fieldCheck.message });

		const [before] = await db.select().from(formsDefinition).where(eq(formsDefinition.id, id)).limit(1);
		if (!before) return fail(404, { message: 'Not found' });

		await db
			.update(formsDefinition)
			.set({
				title: title || null,
				schemaJson,
				updatedAt: new Date(),
				updatedBy: event.locals.user?.email ?? event.locals.user?.id ?? null
			})
			.where(eq(formsDefinition.id, id));

		await appendDefinitionRevisionSnapshot(
			id,
			schemaJson,
			title || null,
			event.locals.user?.email ?? event.locals.user?.id ?? null
		);

		await logCmsAudit({
			entityType: 'forms_definition',
			entityId: String(id),
			userId: event.locals.user?.id ?? null,
			userName: getUserDisplayName(event.locals.user ?? null),
			action: 'update',
			payloadBefore: { title: before.title, status: before.status },
			payloadAfter: { title, status: before.status }
		});

		return { ok: true };
	},

	restoreRevision: async (event) => {
		requirePermission(event, 'forms.edit');
		const id = parseInt(event.params.id ?? '', 10);
		if (Number.isNaN(id)) return fail(400, { message: 'Invalid id' });
		const data = await event.request.formData();
		const revId = parseInt((data.get('revisionId') as string) ?? '', 10);
		if (Number.isNaN(revId)) return fail(400, { message: 'Invalid revision' });

		let rev: (typeof formsDefinitionRevision.$inferSelect) | undefined;
		try {
			const rows = await db
				.select()
				.from(formsDefinitionRevision)
				.where(eq(formsDefinitionRevision.id, revId))
				.limit(1);
			rev = rows[0];
		} catch (e) {
			if (!isMissingRevisionTableError(e)) throw e;
			return fail(503, {
				message:
					'Istoricul formularelor nu e disponibil: lipsește tabelul din DB. Rulează bun run db:migrate (migrația 0012).'
			});
		}
		if (!rev || rev.definitionId !== id) return fail(404, { message: 'Revision not found' });

		const parsed = parseFormSchema(rev.schemaJson);
		if (!parsed) return fail(400, { message: 'Revision schema invalid' });
		const fieldCheck = validateFormSchemaFields(parsed);
		if (!fieldCheck.ok) return fail(400, { message: fieldCheck.message });

		await db
			.update(formsDefinition)
			.set({
				title: rev.title,
				schemaJson: rev.schemaJson,
				updatedAt: new Date(),
				updatedBy: event.locals.user?.email ?? event.locals.user?.id ?? null
			})
			.where(eq(formsDefinition.id, id));

		await appendDefinitionRevisionSnapshot(
			id,
			rev.schemaJson,
			rev.title,
			event.locals.user?.email ?? event.locals.user?.id ?? null
		);

		await logCmsAudit({
			entityType: 'forms_definition',
			entityId: String(id),
			userId: event.locals.user?.id ?? null,
			userName: getUserDisplayName(event.locals.user ?? null),
			action: 'update',
			payloadAfter: { restoredFromRevisionId: revId }
		});

		throw redirect(303, `/admin/forms/${id}`);
	},

	publish: async (event) => {
		requirePermission(event, 'forms.edit');
		const id = parseInt(event.params.id ?? '', 10);
		if (Number.isNaN(id)) return fail(400, { message: 'Invalid id' });

		const [row] = await db.select().from(formsDefinition).where(eq(formsDefinition.id, id)).limit(1);
		if (!row) return fail(404, { message: 'Not found' });

		const [m] = await db
			.select({ v: max(formsDefinition.version) })
			.from(formsDefinition)
			.where(and(eq(formsDefinition.key, row.key), eq(formsDefinition.locale, row.locale)));

		const maxV = Number(m?.v ?? 0);
		const nextV = maxV + 1;

		await db.transaction(async (tx) => {
			await tx
				.update(formsDefinition)
				.set({ status: 'archived' })
				.where(
					and(
						eq(formsDefinition.key, row.key),
						eq(formsDefinition.locale, row.locale),
						eq(formsDefinition.status, 'published')
					)
				);
			await tx
				.update(formsDefinition)
				.set({
					status: 'published',
					version: nextV,
					publishedAt: new Date(),
					updatedAt: new Date(),
					updatedBy: event.locals.user?.email ?? event.locals.user?.id ?? null
				})
				.where(eq(formsDefinition.id, id));
		});

		await logCmsAudit({
			entityType: 'forms_definition',
			entityId: String(id),
			userId: event.locals.user?.id ?? null,
			userName: getUserDisplayName(event.locals.user ?? null),
			action: 'update',
			payloadAfter: { publishedVersion: nextV, key: row.key, locale: row.locale }
		});

		throw redirect(303, `/admin/forms/${id}`);
	}
};
