/**
 * Transformă stringul de scurtătură din toolbar (ex. Ctrl+Alt+1, ⌘⌥1) în segmente pentru <kbd>.
 */
const MAC_MODIFIERS = /^[\u2318\u2325\u21E7\u2303]+/u;

export function parseShortcutToSegments(shortcut: string): string[] {
	const s = shortcut.trim();
	if (!s) return [];
	if (s.includes('+')) {
		return s
			.split('+')
			.map((p) => p.trim())
			.filter(Boolean);
	}
	const m = s.match(/^([\u2318\u2325\u21E7\u2303]+)(.*)$/u);
	if (m) {
		const mods = [...m[1]];
		const rest = m[2];
		return rest ? [...mods, rest] : mods;
	}
	return [s];
}
