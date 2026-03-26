import { db } from '$lib/server/db';
import { formsAnswer, formsEvent, formsSubmission } from '$lib/server/db/schema';
import { allowsAnalyticsTracking, consentSnapshot, getConsentFromEvent } from '$lib/server/consent';
import { DEFAULT_CONTACT_FORM_SCHEMA } from '$lib/server/forms/defaults';
import { bumpDailyMetricFromEvent } from '$lib/server/forms/metrics';
import { mapInternalEventToGa4, sendGa4Events } from '$lib/server/forms/ga4';
import { getPublishedFormDefinition, parseFormSchema } from '$lib/server/forms/queries';
import { checkRateLimit, pruneRateLimits } from '$lib/server/forms/rate-limit';
import { getClientIp, getOrCreateFormsSessionId } from '$lib/server/forms/session';
import { validateAgainstSchema } from '$lib/server/forms/validate';
import type { FormSchemaV1 } from '$lib/forms/types';
import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export type SubmitBody = {
	formKey: string;
	formVersion: number;
	pageUrl: string;
	locale?: string;
	values: Record<string, unknown>;
	idempotencyKey?: string | null;
	utm?: Record<string, string> | null;
};

async function resolveSchema(formKey: string, locale: string, formVersion: number): Promise<FormSchemaV1 | null> {
	const row = await getPublishedFormDefinition(formKey, locale);
	if (row) {
		if (row.version !== formVersion) return null;
		return parseFormSchema(row.schemaJson);
	}
	if (formKey === 'contact' && formVersion === 1) {
		return DEFAULT_CONTACT_FORM_SCHEMA;
	}
	return null;
}

export type SubmitResult =
	| { ok: true; submissionId: number }
	| { ok: false; errors: Record<string, string>; values: Record<string, string> };

export async function ingestFormSubmit(event: RequestEvent, body: SubmitBody): Promise<SubmitResult> {
	pruneRateLimits();
	const ip = getClientIp(event) ?? 'unknown';
	if (!checkRateLimit(`fs:${ip}`, 40, 60_000)) {
		return { ok: false, errors: { _form: 'rate_limited' }, values: {} };
	}

	const locale = body.locale ?? 'ro';
	const schema = await resolveSchema(body.formKey, locale, body.formVersion);
	if (!schema) {
		return { ok: false, errors: { _form: 'unknown_form' }, values: {} };
	}

	const validation = validateAgainstSchema(schema, body.values);
	const consent = getConsentFromEvent(event);
	const tracking = allowsAnalyticsTracking(consent);
	const sessionFingerprint = getOrCreateFormsSessionId(event);
	const userId = event.locals.user?.id ?? null;

	if (!validation.ok) {
		await db.insert(formsEvent).values({
			formKey: body.formKey,
			eventType: 'submit_error',
			sessionFingerprint,
			userId: userId ?? undefined,
			pageUrl: body.pageUrl.slice(0, 2048),
			locale,
			metadata: { errors: validation.errors, consent: consentSnapshot(consent) },
			ipAddress: tracking ? (getClientIp(event) ?? undefined) : undefined,
			userAgent: tracking ? event.request.headers.get('user-agent')?.slice(0, 512) ?? undefined : undefined
		});
		await bumpDailyMetricFromEvent(body.formKey, locale, 'submit_error');
		if (tracking) {
			const ga = mapInternalEventToGa4(body.formKey, 'submit_error');
			if (ga) void sendGa4Events(sessionFingerprint, [ga]);
		}
		return { ok: false, errors: validation.errors, values: validation.values };
	}

	if (body.idempotencyKey) {
		const existing = await db
			.select({ id: formsSubmission.id })
			.from(formsSubmission)
			.where(eq(formsSubmission.idempotencyKey, body.idempotencyKey))
			.limit(1);
		if (existing[0]) {
			return { ok: true, submissionId: existing[0].id };
		}
	}

	const referrer = event.request.headers.get('referer')?.slice(0, 1024) ?? null;

	const [sub] = await db
		.insert(formsSubmission)
		.values({
			formKey: body.formKey,
			formVersion: body.formVersion,
			sessionFingerprint,
			userId: userId ?? undefined,
			consentSnapshot: consentSnapshot(consent),
			ipAddress: tracking ? (getClientIp(event) ?? undefined) : undefined,
			userAgent: tracking ? event.request.headers.get('user-agent')?.slice(0, 512) ?? undefined : undefined,
			referrer: tracking ? referrer ?? undefined : undefined,
			utm: body.utm ?? undefined,
			pageUrl: body.pageUrl.slice(0, 2048),
			locale,
			idempotencyKey: body.idempotencyKey ?? undefined
		})
		.returning({ id: formsSubmission.id });

	const submissionId = sub?.id;
	if (submissionId == null) {
		return { ok: false, errors: { _form: 'save_failed' }, values: validation.values };
	}

	const rows = schema.fields.map((f) => {
		const val = validation.values[f.key] ?? '';
		const pii = f.piiClass ?? 'none';
		return {
			submissionId,
			fieldKey: f.key,
			valueText: val.slice(0, 8000),
			piiClass: pii
		};
	});

	if (rows.length) await db.insert(formsAnswer).values(rows);

	await db.insert(formsEvent).values({
		formKey: body.formKey,
		eventType: 'submit_success',
		sessionFingerprint,
		userId: userId ?? undefined,
		pageUrl: body.pageUrl.slice(0, 2048),
		locale,
		metadata: { submissionId, consent: consentSnapshot(consent) },
		ipAddress: tracking ? (getClientIp(event) ?? undefined) : undefined,
		userAgent: tracking ? event.request.headers.get('user-agent')?.slice(0, 512) ?? undefined : undefined
	});
	await bumpDailyMetricFromEvent(body.formKey, locale, 'submit_success');
	if (tracking) {
		const ga = mapInternalEventToGa4(body.formKey, 'submit_success');
		if (ga) void sendGa4Events(sessionFingerprint, [ga]);
	}

	return { ok: true, submissionId };
}
