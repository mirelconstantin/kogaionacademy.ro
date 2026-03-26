import { loadLegalPoliciesFromDb } from '$lib/server/legal/policies';
import { renderMarkdownToSafeHtml } from '$lib/server/markdown-safe';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const policies = await loadLegalPoliciesFromDb();
	return {
		title: 'Politica de confidențialitate',
		html: renderMarkdownToSafeHtml(policies.privacyPolicyMarkdown),
		lastUpdatedNote: policies.privacyPolicyLastUpdatedNote?.trim() ?? ''
	};
};
