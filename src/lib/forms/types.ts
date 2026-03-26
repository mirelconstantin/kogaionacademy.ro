/**
 * Shared form definition schema (stored in forms_definition.schema_json).
 */
export type FormFieldType = 'text' | 'email' | 'textarea' | 'tel' | 'number' | 'checkbox' | 'select';

export type LocalizedString = Record<string, string>;

export type FormFieldDef = {
	key: string;
	type: FormFieldType;
	label: LocalizedString;
	placeholder?: LocalizedString;
	/** Example values shown in admin preview (localized). */
	sampleValue?: LocalizedString;
	/** Width on desktop row in percent (e.g. 25, 50, 75, 100). */
	widthPercent?: number;
	required?: boolean;
	piiClass?: 'none' | 'contact' | 'sensitive';
	options?: { value: string; label: LocalizedString }[];
	/** Extra HTML attributes hints */
	rows?: number;
	autocomplete?: string;
};

export type FormSchemaV1 = {
	version?: number;
	fields: FormFieldDef[];
	submitLabel?: LocalizedString;
	/** Shown under submit (localized) */
	consentHint?: LocalizedString;
};

export type ConsentState = {
	/** Measurement / analytics (GA4, internal events with IP/UA) */
	analytics: boolean;
	/** Marketing / remarketing tags */
	marketing: boolean;
	/** Personalization / remembered preferences */
	personalization: boolean;
	updatedAt: string;
};

export const CONSENT_COOKIE = 'kogaion_consent';
export const SESSION_COOKIE_FORMS = 'forms_sid';
