import { browser } from '$app/environment';
import { isConsentChoiceStale } from '$lib/consent-renewal';
import type { ConsentState } from '$lib/forms/types';
import { CONSENT_COOKIE } from '$lib/forms/types';

const MAX_AGE = 60 * 60 * 24 * 180; // 180 days

const emptyConsent = (): ConsentState => ({
	analytics: false,
	marketing: false,
	personalization: false,
	updatedAt: ''
});

export function readConsentFromDocument(): ConsentState {
	if (!browser) return emptyConsent();
	const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
	const raw = match?.[1];
	if (!raw) return emptyConsent();
	try {
		const decoded = decodeURIComponent(raw);
		const v = JSON.parse(decoded) as Partial<ConsentState>;
		return {
			analytics: Boolean(v.analytics),
			marketing: Boolean(v.marketing),
			personalization: Boolean(v.personalization),
			updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : ''
		};
	} catch {
		return emptyConsent();
	}
}

export function writeConsentCookie(state: ConsentState): void {
	if (!browser) return;
	const payload = encodeURIComponent(
		JSON.stringify({
			...state,
			updatedAt: state.updatedAt || new Date().toISOString()
		})
	);
	document.cookie = `${CONSENT_COOKIE}=${payload};path=/;max-age=${MAX_AGE};SameSite=Lax`;
}

export function allowsClientAnalytics(): boolean {
	const c = readConsentFromDocument();
	if (!c.analytics) return false;
	if (isConsentChoiceStale(c.updatedAt)) return false;
	return true;
}
