import { db } from '$lib/server/db';
import { siteSetting } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import {
	defaultLegalPoliciesPayload,
	LEGAL_POLICIES_SETTING_KEY,
	type LegalPoliciesPayload
} from './legal-policies-defaults';

export {
	LEGAL_POLICIES_SETTING_KEY,
	defaultLegalPoliciesPayload,
	type LegalPoliciesPayload
} from './legal-policies-defaults';

function mergePayload(base: LegalPoliciesPayload, patch: Partial<LegalPoliciesPayload>): LegalPoliciesPayload {
	return {
		operatorLegalName: patch.operatorLegalName ?? base.operatorLegalName,
		operatorAddress: patch.operatorAddress ?? base.operatorAddress,
		operatorEmail: patch.operatorEmail ?? base.operatorEmail,
		dpoEmail: patch.dpoEmail ?? base.dpoEmail,
		cookiePolicyMarkdown: patch.cookiePolicyMarkdown ?? base.cookiePolicyMarkdown,
		privacyPolicyMarkdown: patch.privacyPolicyMarkdown ?? base.privacyPolicyMarkdown,
		termsMarkdown: patch.termsMarkdown ?? base.termsMarkdown,
		consentBannerTitle: patch.consentBannerTitle ?? base.consentBannerTitle,
		consentBannerBodyMarkdown: patch.consentBannerBodyMarkdown ?? base.consentBannerBodyMarkdown,
		cookiePolicyLastUpdatedNote: patch.cookiePolicyLastUpdatedNote ?? base.cookiePolicyLastUpdatedNote,
		privacyPolicyLastUpdatedNote: patch.privacyPolicyLastUpdatedNote ?? base.privacyPolicyLastUpdatedNote,
		termsLastUpdatedNote: patch.termsLastUpdatedNote ?? base.termsLastUpdatedNote
	};
}

function coercePayload(raw: unknown): Partial<LegalPoliciesPayload> {
	if (!raw || typeof raw !== 'object') return {};
	const o = raw as Record<string, unknown>;
	const str = (key: string): string | undefined =>
		typeof o[key] === 'string' ? (o[key] as string) : undefined;
	const legacyLastUpdated = str('lastUpdatedNote') ?? '';
	return {
		...(str('operatorLegalName') !== undefined ? { operatorLegalName: str('operatorLegalName')! } : {}),
		...(str('operatorAddress') !== undefined ? { operatorAddress: str('operatorAddress')! } : {}),
		...(str('operatorEmail') !== undefined ? { operatorEmail: str('operatorEmail')! } : {}),
		...(str('dpoEmail') !== undefined ? { dpoEmail: str('dpoEmail')! } : {}),
		...(str('cookiePolicyMarkdown') !== undefined ? { cookiePolicyMarkdown: str('cookiePolicyMarkdown')! } : {}),
		...(str('privacyPolicyMarkdown') !== undefined ? { privacyPolicyMarkdown: str('privacyPolicyMarkdown')! } : {}),
		...(str('termsMarkdown') !== undefined ? { termsMarkdown: str('termsMarkdown')! } : {}),
		...(str('consentBannerTitle') !== undefined ? { consentBannerTitle: str('consentBannerTitle')! } : {}),
		...(str('consentBannerBodyMarkdown') !== undefined
			? { consentBannerBodyMarkdown: str('consentBannerBodyMarkdown')! }
			: {}),
		cookiePolicyLastUpdatedNote: str('cookiePolicyLastUpdatedNote') ?? legacyLastUpdated,
		privacyPolicyLastUpdatedNote: str('privacyPolicyLastUpdatedNote') ?? legacyLastUpdated,
		termsLastUpdatedNote: str('termsLastUpdatedNote') ?? legacyLastUpdated
	};
}

export async function loadLegalPoliciesFromDb(): Promise<LegalPoliciesPayload> {
	const defaults = defaultLegalPoliciesPayload();
	const [row] = await db
		.select()
		.from(siteSetting)
		.where(eq(siteSetting.key, LEGAL_POLICIES_SETTING_KEY))
		.limit(1);
	if (!row?.value || typeof row.value !== 'object') return defaults;
	return mergePayload(defaults, coercePayload(row.value));
}

export async function saveLegalPoliciesToDb(
	payload: LegalPoliciesPayload,
	updatedBy: string | null
): Promise<void> {
	await db
		.insert(siteSetting)
		.values({
			key: LEGAL_POLICIES_SETTING_KEY,
			value: payload as unknown as Record<string, unknown>,
			updatedBy
		})
		.onConflictDoUpdate({
			target: siteSetting.key,
			set: {
				value: payload as unknown as Record<string, unknown>,
				updatedBy,
				updatedAt: new Date()
			}
		});
}

/** Date pentru banner + layout (HTML deja sanitizat în load). */
export type ConsentBannerLayoutData = {
	title: string;
	bodyHtml: string;
	cookiePolicyHref: string;
	privacyPolicyHref: string;
};
