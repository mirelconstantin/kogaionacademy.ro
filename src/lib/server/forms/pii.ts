/** Mask email for safe display/export (retains first + last char + domain). */
export function maskEmail(value: string): string {
	const s = value.trim();
	const at = s.indexOf('@');
	if (at < 1) return '***';
	const local = s.slice(0, at);
	const domain = s.slice(at + 1);
	if (!domain) return '***';
	const l =
		local.length <= 2
			? `${local[0] ?? '*'}*`
			: `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}`;
	return `${l}@${domain}`;
}

export function maskSensitiveField(piiClass: string, value: string | null | undefined): string {
	if (value == null || value === '') return '';
	if (piiClass === 'contact' && value.includes('@')) return maskEmail(value);
	if (piiClass === 'sensitive') return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : '***';
	return value;
}
