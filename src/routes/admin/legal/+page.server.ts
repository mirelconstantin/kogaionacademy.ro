import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contactSettings } from '$lib/server/db/schema';
import { logCmsAudit, getUserDisplayName } from '$lib/server/audit';
import {
	defaultLegalPoliciesPayload,
	loadLegalPoliciesFromDb,
	saveLegalPoliciesToDb,
	type LegalPoliciesPayload
} from '$lib/server/legal/policies';
import { requirePermission } from '$lib/server/permissions';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'pages.view');
	const policies = await loadLegalPoliciesFromDb();
	const [contactRo] = await db.select().from(contactSettings).where(eq(contactSettings.locale, 'ro')).limit(1);
	return {
		policies,
		contactHints: {
			email: contactRo?.email ?? '',
			address: contactRo?.address ?? '',
			phone: contactRo?.phone ?? ''
		}
	};
};

export const actions: Actions = {
	save: async (event) => {
		requirePermission(event, 'pages.edit');
		const fd = await event.request.formData();
		const before = await loadLegalPoliciesFromDb();
		const defaults = defaultLegalPoliciesPayload();
		const pickNonEmpty = (...values: Array<string | null | undefined>) => {
			for (const value of values) {
				const normalized = String(value ?? '').trim();
				if (normalized) return normalized;
			}
			return '';
		};
		const payload: LegalPoliciesPayload = {
			operatorLegalName: pickNonEmpty(
				String(fd.get('operatorLegalName') ?? ''),
				before.operatorLegalName,
				defaults.operatorLegalName
			),
			operatorAddress: pickNonEmpty(
				String(fd.get('operatorAddress') ?? ''),
				before.operatorAddress,
				defaults.operatorAddress
			),
			operatorEmail: pickNonEmpty(
				String(fd.get('operatorEmail') ?? ''),
				before.operatorEmail,
				defaults.operatorEmail
			),
			dpoEmail: pickNonEmpty(String(fd.get('dpoEmail') ?? ''), before.dpoEmail, defaults.dpoEmail),
			cookiePolicyMarkdown: String(fd.get('cookiePolicyMarkdown') ?? ''),
			privacyPolicyMarkdown: String(fd.get('privacyPolicyMarkdown') ?? ''),
			termsMarkdown: String(fd.get('termsMarkdown') ?? ''),
			consentBannerTitle: before.consentBannerTitle,
			consentBannerBodyMarkdown: before.consentBannerBodyMarkdown,
			cookiePolicyLastUpdatedNote: String(fd.get('cookiePolicyLastUpdatedNote') ?? '').trim(),
			privacyPolicyLastUpdatedNote: String(fd.get('privacyPolicyLastUpdatedNote') ?? '').trim(),
			termsLastUpdatedNote: String(fd.get('termsLastUpdatedNote') ?? '').trim()
		};
		if (!payload.operatorLegalName || !payload.operatorEmail) {
			return fail(400, { message: 'Numele operatorului și emailul sunt obligatorii.' });
		}
		const uid = event.locals.user?.id ?? null;
		await saveLegalPoliciesToDb(payload, event.locals.user?.email ?? event.locals.user?.id ?? null);
		await logCmsAudit({
			entityType: 'site_settings',
			entityId: 'legal_policies',
			userId: uid,
			userName: getUserDisplayName(event.locals.user ?? null),
			action: 'update',
			payloadBefore: { operatorLegalName: before.operatorLegalName },
			payloadAfter: { operatorLegalName: payload.operatorLegalName }
		});
		return { ok: true };
	},
	resetDefaults: async (event) => {
		requirePermission(event, 'pages.edit');
		const defaults = defaultLegalPoliciesPayload();
		await saveLegalPoliciesToDb(defaults, event.locals.user?.email ?? event.locals.user?.id ?? null);
		await logCmsAudit({
			entityType: 'site_settings',
			entityId: 'legal_policies',
			userId: event.locals.user?.id ?? null,
			userName: getUserDisplayName(event.locals.user ?? null),
			action: 'update',
			payloadAfter: { reset: true }
		});
		return { ok: true, reset: true };
	}
};
