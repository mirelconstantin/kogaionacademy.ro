import type { ConsentState } from '$lib/forms/types';
import { isConsentChoiceStale } from '$lib/consent-renewal';
import type { RequestEvent } from '@sveltejs/kit';

const EMPTY: ConsentState = {
	analytics: false,
	marketing: false,
	personalization: false,
	updatedAt: ''
};

function parseConsentCookie(raw: string | undefined): ConsentState {
	if (!raw) return { ...EMPTY };
	try {
		const v = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentState>;
		return {
			analytics: Boolean(v.analytics),
			marketing: Boolean(v.marketing),
			personalization: Boolean(v.personalization),
			updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : ''
		};
	} catch {
		return { ...EMPTY };
	}
}

/** Read consent from Cookie header (server). */
export function getConsentFromEvent(event: RequestEvent): ConsentState {
	const raw = event.cookies.get('kogaion_consent');
	return parseConsentCookie(raw ?? undefined);
}

/** True if we may store PII-adjacent telemetry (IP, UA, detailed events). */
export function allowsAnalyticsTracking(consent: ConsentState): boolean {
	if (consent.analytics !== true) return false;
	if (isConsentChoiceStale(consent.updatedAt)) return false;
	return true;
}

/** Snapshot for DB (persisted on submit / critical events). */
export function consentSnapshot(consent: ConsentState): Record<string, unknown> {
	return {
		analytics: consent.analytics,
		marketing: consent.marketing,
		personalization: consent.personalization,
		updatedAt: consent.updatedAt
	};
}
