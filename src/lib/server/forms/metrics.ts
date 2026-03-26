import { db } from '$lib/server/db';
import { formsMetricDaily } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export type MetricField =
	| 'viewsCount'
	| 'visible50Count'
	| 'focusCount'
	| 'submitAttemptCount'
	| 'submitSuccessCount'
	| 'submitErrorCount';

const eventToField: Record<string, MetricField | undefined> = {
	form_view: 'viewsCount',
	form_visible_50: 'visible50Count',
	first_focus: 'focusCount',
	submit_attempt: 'submitAttemptCount',
	submit_success: 'submitSuccessCount',
	submit_error: 'submitErrorCount'
};

function bumpSet(field: MetricField) {
	switch (field) {
		case 'viewsCount':
			return { viewsCount: sql`${formsMetricDaily.viewsCount} + 1` };
		case 'visible50Count':
			return { visible50Count: sql`${formsMetricDaily.visible50Count} + 1` };
		case 'focusCount':
			return { focusCount: sql`${formsMetricDaily.focusCount} + 1` };
		case 'submitAttemptCount':
			return { submitAttemptCount: sql`${formsMetricDaily.submitAttemptCount} + 1` };
		case 'submitSuccessCount':
			return { submitSuccessCount: sql`${formsMetricDaily.submitSuccessCount} + 1` };
		case 'submitErrorCount':
			return { submitErrorCount: sql`${formsMetricDaily.submitErrorCount} + 1` };
		default:
			return {};
	}
}

export async function bumpDailyMetricFromEvent(
	formKey: string,
	locale: string,
	eventType: string
): Promise<void> {
	const field = eventToField[eventType];
	if (!field) return;
	const day = new Date().toISOString().slice(0, 10);
	const loc = locale ?? '';

	await db
		.insert(formsMetricDaily)
		.values({
			day,
			formKey,
			locale: loc,
			viewsCount: 0,
			visible50Count: 0,
			focusCount: 0,
			submitAttemptCount: 0,
			submitSuccessCount: 0,
			submitErrorCount: 0,
			uniqueSessionsEstimate: 0,
			[field]: 1
		})
		.onConflictDoUpdate({
			target: [formsMetricDaily.day, formsMetricDaily.formKey, formsMetricDaily.locale],
			set: bumpSet(field)
		});
}
