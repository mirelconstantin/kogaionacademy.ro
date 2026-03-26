import { db } from '$lib/server/db';
import { formsEvent } from '$lib/server/db/schema';
import { allowsAnalyticsTracking, consentSnapshot, getConsentFromEvent } from '$lib/server/consent';
import { bumpDailyMetricFromEvent } from '$lib/server/forms/metrics';
import { mapInternalEventToGa4, sendGa4Events } from '$lib/server/forms/ga4';
import { checkRateLimit, pruneRateLimits } from '$lib/server/forms/rate-limit';
import { getClientIp, getOrCreateFormsSessionId } from '$lib/server/forms/session';
import type { RequestEvent } from '@sveltejs/kit';

const DEDUPE_MS = 5 * 60 * 1000;
const dedupe = new Map<string, number>();

function dedupeKey(sessionId: string, formKey: string, eventType: string, fieldKey?: string | null): string {
	return `${sessionId}|${formKey}|${eventType}|${fieldKey ?? ''}`;
}

function shouldDedupe(eventType: string): boolean {
	return eventType === 'form_view' || eventType === 'form_visible_50' || eventType === 'first_focus';
}

export type IncomingFormEvent = {
	formKey: string;
	eventType: string;
	fieldKey?: string | null;
	pageUrl: string;
	locale?: string | null;
	metadata?: Record<string, unknown> | null;
};

export async function ingestFormEvent(event: RequestEvent, body: IncomingFormEvent): Promise<{ ok: boolean }> {
	pruneRateLimits();
	const ip = getClientIp(event) ?? 'unknown';
	if (!checkRateLimit(`fe:${ip}`, 120, 60_000)) {
		return { ok: false };
	}

	const consent = getConsentFromEvent(event);
	const tracking = allowsAnalyticsTracking(consent);
	if (!tracking) {
		return { ok: true };
	}

	const sessionFingerprint = getOrCreateFormsSessionId(event);
	const userId = event.locals.user?.id ?? null;

	if (shouldDedupe(body.eventType)) {
		const dk = dedupeKey(sessionFingerprint, body.formKey, body.eventType, body.fieldKey);
		const now = Date.now();
		const last = dedupe.get(dk);
		if (last && now - last < DEDUPE_MS) return { ok: true };
		dedupe.set(dk, now);
	}

	await db.insert(formsEvent).values({
		formKey: body.formKey,
		eventType: body.eventType,
		fieldKey: body.fieldKey ?? null,
		sessionFingerprint,
		userId: userId ?? undefined,
		pageUrl: body.pageUrl.slice(0, 2048),
		locale: body.locale ?? null,
		metadata: {
			...(body.metadata ?? {}),
			consent: consentSnapshot(consent)
		},
		ipAddress: tracking ? (getClientIp(event) ?? undefined) : undefined,
		userAgent: tracking ? event.request.headers.get('user-agent')?.slice(0, 512) ?? undefined : undefined
	});

	await bumpDailyMetricFromEvent(body.formKey, body.locale ?? '', body.eventType);

	if (tracking) {
		const ga = mapInternalEventToGa4(body.formKey, body.eventType);
		if (ga) {
			void sendGa4Events(sessionFingerprint, [ga]);
		}
	}

	return { ok: true };
}
