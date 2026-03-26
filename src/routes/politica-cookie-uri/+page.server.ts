import { loadLegalPoliciesFromDb } from '$lib/server/legal/policies';
import { renderMarkdownToSafeHtml } from '$lib/server/markdown-safe';
import { CONSENT_REFRESH_DAYS } from '$lib/consent-renewal';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const policies = await loadLegalPoliciesFromDb();
	return {
		pageTitle: 'Politica de cookie-uri și preferințe',
		policyHeading: 'Politica de cookie-uri',
		html: renderMarkdownToSafeHtml(policies.cookiePolicyMarkdown),
		lastUpdatedNote: policies.cookiePolicyLastUpdatedNote?.trim() ?? '',
		consentBannerTitle: policies.consentBannerTitle,
		consentBodyHtml: renderMarkdownToSafeHtml(policies.consentBannerBodyMarkdown),
		privacyPolicyHref: '/politica-de-confidentialitate' as const,
		refreshDays: CONSENT_REFRESH_DAYS
	};
};
