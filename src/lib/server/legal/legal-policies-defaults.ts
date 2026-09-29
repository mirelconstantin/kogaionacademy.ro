/**
 * Fără import din $lib/server/db — poate fi folosit din scripturi Bun (ex. seed-legal-policies).
 */
import {
	DEFAULT_CONSENT_BANNER_BODY,
	DEFAULT_CONSENT_BANNER_TITLE,
	DEFAULT_COOKIE_POLICY_MARKDOWN,
	DEFAULT_PRIVACY_POLICY_MARKDOWN,
	DEFAULT_TERMS_MARKDOWN
} from './default-policy-markdown';

export const LEGAL_POLICIES_SETTING_KEY = 'legal_policies';

export type LegalPoliciesPayload = {
	operatorLegalName: string;
	operatorAddress: string;
	operatorEmail: string;
	dpoEmail: string;
	cookiePolicyMarkdown: string;
	privacyPolicyMarkdown: string;
	termsMarkdown: string;
	consentBannerTitle: string;
	consentBannerBodyMarkdown: string;
	cookiePolicyLastUpdatedNote: string;
	privacyPolicyLastUpdatedNote: string;
	termsLastUpdatedNote: string;
};

export function defaultLegalPoliciesPayload(): LegalPoliciesPayload {
	return {
		operatorLegalName: 'Kogaion Gifted Academy',
		// Lăsat gol intenționat: adresa poștală înregistrată a operatorului trebuie
		// furnizată de client (legea românească a protecției datelor cere o adresă
		// de contact a operatorului pentru notificările ANSPDCP). Așa cum nu mai
		// avem un sediu, nu inventăm una — nu există fallback implicit.
		operatorAddress: '',
		operatorEmail: 'contact@kogaionacademy.ro',
		dpoEmail: 'contact@kogaionacademy.ro',
		cookiePolicyMarkdown: DEFAULT_COOKIE_POLICY_MARKDOWN,
		privacyPolicyMarkdown: DEFAULT_PRIVACY_POLICY_MARKDOWN,
		termsMarkdown: DEFAULT_TERMS_MARKDOWN,
		consentBannerTitle: DEFAULT_CONSENT_BANNER_TITLE,
		consentBannerBodyMarkdown: DEFAULT_CONSENT_BANNER_BODY,
		cookiePolicyLastUpdatedNote: '',
		privacyPolicyLastUpdatedNote: '',
		termsLastUpdatedNote: ''
	};
}
