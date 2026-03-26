import { env } from '$env/dynamic/private';

type Ga4Event = {
	name: string;
	params?: Record<string, string | number | boolean>;
};

/**
 * Server-side GA4 Measurement Protocol (optional).
 * Set GA4_MEASUREMENT_ID (G-XXXXXXXX) and GA4_API_SECRET.
 */
export async function sendGa4Events(clientId: string, events: Ga4Event[]): Promise<void> {
	const measurementId = env.GA4_MEASUREMENT_ID?.trim();
	const apiSecret = env.GA4_API_SECRET?.trim();
	if (!measurementId || !apiSecret || events.length === 0) return;

	const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;

	try {
		await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				client_id: clientId.slice(0, 64),
				non_personalized_ads: false,
				events: events.map((e) => ({
					name: e.name,
					params: e.params ?? {}
				}))
			})
		});
	} catch {
		// non-fatal
	}
}

export function mapInternalEventToGa4(formKey: string, eventType: string): Ga4Event | null {
	const base = { form_key: formKey };
	switch (eventType) {
		case 'form_view':
			return { name: 'form_view', params: base };
		case 'submit_success':
			return { name: 'form_submit', params: { ...base, success: true } };
		case 'submit_error':
			return { name: 'form_submit', params: { ...base, success: false } };
		default:
			return null;
	}
}
