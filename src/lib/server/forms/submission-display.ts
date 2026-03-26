/**
 * Human-readable + privacy-conscious display helpers for forms_submission in admin.
 */

export function maskIpAddress(ip: string | null | undefined): string {
	if (!ip?.trim()) return '—';
	const t = ip.trim();
	// IPv4: hide last octet
	if (/^\d{1,3}(\.\d{1,3}){3}$/.test(t)) {
		const parts = t.split('.');
		parts[3] = 'xxx';
		return parts.join('.');
	}
	// IPv6: show first 3 hextets only
	if (t.includes(':')) {
		const parts = t.split(':').filter(Boolean);
		if (parts.length >= 3) return `${parts.slice(0, 3).join(':')}:…`;
	}
	return t.length > 12 ? `${t.slice(0, 8)}…` : t;
}

export function summarizeUserAgent(ua: string | null | undefined): string {
	if (!ua?.trim()) return '—';
	const value = ua.toLowerCase();
	const browser = value.includes('edg/')
		? 'Edge'
		: value.includes('chrome/')
			? 'Chrome'
			: value.includes('firefox/')
				? 'Firefox'
				: value.includes('safari/') && !value.includes('chrome/')
					? 'Safari'
					: 'Browser';
	const os = value.includes('windows')
		? 'Windows'
		: value.includes('mac os')
			? 'macOS'
			: value.includes('android')
				? 'Android'
				: value.includes('iphone') || value.includes('ipad')
					? 'iOS'
					: value.includes('linux')
						? 'Linux'
						: 'OS';
	return `${browser} · ${os}`;
}

export function formatUtm(utm: Record<string, string> | null | undefined): string {
	if (!utm || typeof utm !== 'object') return '—';
	const pairs = Object.entries(utm).filter(([, v]) => v != null && String(v).trim() !== '');
	if (!pairs.length) return '—';
	return pairs.map(([k, v]) => `${k}=${v}`).join(', ');
}

export function formatConsentSnapshot(snapshot: unknown): { line: string; json: string } {
	if (snapshot == null || typeof snapshot !== 'object') {
		return { line: '—', json: '' };
	}
	const o = snapshot as Record<string, unknown>;
	const parts: string[] = [];
	if (typeof o.analytics === 'boolean') parts.push(`analiză: ${o.analytics ? 'da' : 'nu'}`);
	if (typeof o.marketing === 'boolean') parts.push(`marketing: ${o.marketing ? 'da' : 'nu'}`);
	if (typeof o.personalization === 'boolean') parts.push(`personalizare: ${o.personalization ? 'da' : 'nu'}`);
	if (typeof o.updatedAt === 'string' && o.updatedAt) {
		try {
			parts.push(`actualizat: ${new Date(o.updatedAt).toLocaleString('ro-RO')}`);
		} catch {
			parts.push(`actualizat: ${o.updatedAt}`);
		}
	}
	return {
		line: parts.length ? parts.join(' · ') : '—',
		json: JSON.stringify(snapshot, null, 2)
	};
}

export function truncateMiddle(s: string | null | undefined, max = 48): string {
	if (!s?.trim()) return '—';
	const t = s.trim();
	if (t.length <= max) return t;
	const half = Math.floor((max - 1) / 2);
	return `${t.slice(0, half)}…${t.slice(-half)}`;
}

export type SubmissionDetailForAdmin = {
	pageUrl: string;
	referrer: string;
	ipMasked: string;
	userAgentSummary: string;
	userAgentRaw: string;
	utmLine: string;
	consentLine: string;
	consentJson: string;
	sessionShort: string;
	sessionFull: string;
	userId: string;
	idempotencyKey: string;
};

export function buildSubmissionDetailForAdmin(row: {
	pageUrl: string | null;
	referrer: string | null;
	ipAddress: string | null;
	userAgent: string | null;
	utm: Record<string, string> | null;
	consentSnapshot: unknown;
	sessionFingerprint: string;
	userId: string | null;
	idempotencyKey: string | null;
}): SubmissionDetailForAdmin {
	const consent = formatConsentSnapshot(row.consentSnapshot);
	return {
		pageUrl: row.pageUrl?.trim() || '—',
		referrer: row.referrer?.trim() || '—',
		ipMasked: maskIpAddress(row.ipAddress),
		userAgentSummary: summarizeUserAgent(row.userAgent),
		userAgentRaw: row.userAgent?.trim() || '—',
		utmLine: formatUtm(row.utm ?? undefined),
		consentLine: consent.line,
		consentJson: consent.json,
		sessionShort: row.sessionFingerprint ? row.sessionFingerprint.slice(0, 12) + '…' : '—',
		sessionFull: row.sessionFingerprint || '—',
		userId: row.userId?.trim() || '—',
		idempotencyKey: row.idempotencyKey?.trim() || '—'
	};
}
