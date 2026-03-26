/**
 * Normalize program schedule fields (age/dates/duration) in DB.
 *
 * Fixes anomalies like:
 * ageRange: "adolescenți 13-18 ani, Perioade: 1-10 august, 21-30 august 2026"
 *
 * Run:
 * bun --env-file=.env scripts/normalize-program-schedule-texts.ts
 */
import { and, asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { program, programLocale } from '../src/lib/server/db/schema';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

function normalizeText(value?: string | null): string {
	return (value ?? '').trim();
}

function unique(values: string[]): string[] {
	return [...new Set(values)];
}

function splitValues(value: string): string[] {
	return value
		.split(/[\n;|]+/g)
		.map((part) => part.trim())
		.filter(Boolean);
}

function splitDateEntries(value: string): string[] {
	const direct = splitValues(value);
	if (direct.length > 1) return unique(direct);
	return unique(
		value
			.split(/,\s*(?=\d{1,2}\s*[-–]\s*\d{1,2}\b)/g)
			.map((part) => part.trim())
			.filter(Boolean)
	);
}

function inferDuration(entry: string): string | null {
	const m = entry.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
	if (!m) return null;
	const start = Number.parseInt(m[1], 10);
	const end = Number.parseInt(m[2], 10);
	if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
	return `${end - start + 1} zile`;
}

function extractPeriodsFromAge(ageRange: string): { ageOnly: string; periods: string | null } {
	const m = ageRange.match(/^(.*?)(?:,\s*)?(?:Perioade|Periods?)\s*:\s*(.+)$/i);
	if (!m) return { ageOnly: ageRange.trim(), periods: null };
	return {
		ageOnly: m[1].trim().replace(/,\s*$/, ''),
		periods: m[2].trim()
	};
}

function extractTrailingDuration(
	datesText: string,
	durationText: string
): { dates: string; duration: string } {
	let dates = datesText;
	let duration = durationText;

	if (!duration) {
		const m = dates.match(/^(.*?)(?:,\s*|\s+[·-]\s*)(\d+\s*(?:zile|zi|days|day))$/i);
		if (m) {
			dates = m[1].trim();
			duration = m[2].trim();
		}
	}
	return { dates, duration };
}

function normalizeSchedule(
	rawDatesText: string,
	rawDurationText: string
): { datesText: string | null; durationText: string | null } {
	const baseDates = normalizeText(rawDatesText);
	const baseDuration = normalizeText(rawDurationText);
	const extracted = extractTrailingDuration(baseDates, baseDuration);
	let dates = splitDateEntries(extracted.dates);
	let durations = splitValues(extracted.duration);

	if (dates.length > 1 && durations.length === 1) {
		durations = Array.from({ length: dates.length }, () => durations[0]);
	}
	if (dates.length > durations.length) {
		const padded = [...durations];
		for (let i = durations.length; i < dates.length; i++) {
			padded.push(inferDuration(dates[i]) ?? durations[durations.length - 1] ?? '');
		}
		durations = padded.filter(Boolean);
	}

	return {
		datesText: dates.length > 0 ? dates.join('; ') : null,
		durationText: durations.length > 0 ? durations.join('; ') : null
	};
}

async function main() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	const rows = await db
		.select({
			id: programLocale.id,
			programId: programLocale.programId,
			locale: programLocale.locale,
			slug: program.slug,
			ageRange: programLocale.ageRange,
			datesText: programLocale.datesText,
			durationText: programLocale.durationText
		})
		.from(programLocale)
		.innerJoin(program, eq(program.id, programLocale.programId))
		.orderBy(asc(program.slug), asc(programLocale.locale));

	let updates = 0;
	for (const row of rows) {
		const currentAge = normalizeText(row.ageRange);
		const currentDates = normalizeText(row.datesText);
		const currentDuration = normalizeText(row.durationText);

		const extracted = extractPeriodsFromAge(currentAge);
		const mergedDates = extracted.periods
			? [currentDates, extracted.periods].filter(Boolean).join('; ')
			: currentDates;
		const normalized = normalizeSchedule(mergedDates, currentDuration);

		const nextAge = extracted.ageOnly || null;
		const nextDates = normalized.datesText;
		const nextDuration = normalized.durationText;

		const ageChanged = (row.ageRange ?? null) !== nextAge;
		const datesChanged = (row.datesText ?? null) !== nextDates;
		const durationChanged = (row.durationText ?? null) !== nextDuration;
		if (!ageChanged && !datesChanged && !durationChanged) continue;

		await db
			.update(programLocale)
			.set({
				ageRange: nextAge,
				datesText: nextDates,
				durationText: nextDuration
			})
			.where(and(eq(programLocale.id, row.id), eq(programLocale.programId, row.programId)));

		updates++;
		console.log(`updated ${row.slug} [${row.locale}]`);
	}

	await client.end();
	console.log(`done. updated rows: ${updates}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

