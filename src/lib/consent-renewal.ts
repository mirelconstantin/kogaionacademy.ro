/**
 * Reafișare banner + expirare „analiză” pe server după acest interval (consimțământ reînnoit).
 */
export const CONSENT_REFRESH_DAYS = 7;
export const CONSENT_REFRESH_MS = CONSENT_REFRESH_DAYS * 24 * 60 * 60 * 1000;

/**
 * Reset global consimțământ.
 * Toate alegerile mai vechi decât acest timestamp devin expirate și cer reconfirmare.
 * Schimbă această valoare când vrei un nou reset pentru toți utilizatorii.
 */
export const CONSENT_GLOBAL_RESET_AT = '2026-03-21T00:00:00.000Z';
const CONSENT_GLOBAL_RESET_MS = new Date(CONSENT_GLOBAL_RESET_AT).getTime();

/** True dacă lipsește data sau a trecut intervalul — utilizatorul trebuie să confirme din nou. */
export function isConsentChoiceStale(updatedAt: string | undefined | null): boolean {
	if (updatedAt == null || String(updatedAt).trim() === '') return true;
	const t = new Date(updatedAt).getTime();
	if (Number.isNaN(t)) return true;
	if (!Number.isNaN(CONSENT_GLOBAL_RESET_MS) && t < CONSENT_GLOBAL_RESET_MS) return true;
	return Date.now() - t > CONSENT_REFRESH_MS;
}
