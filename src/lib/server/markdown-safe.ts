import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

/** Markdown → HTML, apoi sanitizare (admin-trusted content pentru pagini legale). */
export function renderMarkdownToSafeHtml(markdown: string): string {
	const raw = marked(markdown.trim() || '(fără conținut)', {
		async: false,
		gfm: true
	}) as string;
	return DOMPurify.sanitize(raw, {
		USE_PROFILES: { html: true }
	});
}
