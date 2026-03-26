import { loadLegalPoliciesFromDb } from '$lib/server/legal/policies';
import { renderMarkdownToSafeHtml } from '$lib/server/markdown-safe';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const policies = await loadLegalPoliciesFromDb();
	return {
		title: 'Termeni și condiții',
		html: renderMarkdownToSafeHtml(policies.termsMarkdown),
		lastUpdatedNote: policies.termsLastUpdatedNote?.trim() ?? ''
	};
};
