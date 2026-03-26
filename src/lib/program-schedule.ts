export function normalizeText(value?: string | null): string {
	return (value ?? '').trim();
}

export function formatAgeRangeLabel(
	categoryId: string | null | undefined,
	ageRange: string | null | undefined
): string | null {
	const age = normalizeText(ageRange);
	if (!age) return null;

	const lower = age.toLowerCase();
	if (/(copii|adolescen|children|teens)/i.test(lower)) return age;
	if (!/^\d{1,2}\s*[-–]\s*\d{1,2}\s*ani$/i.test(age)) return age;

	if (categoryId === 'children') return `copii ${age}`;
	if (categoryId === 'teens') return `adolescenți ${age}`;
	return age;
}

function unique(values: string[]): string[] {
	return [...new Set(values)];
}

function splitByDelimiters(value: string): string[] {
	return value
		.split(/[\n;|]+/g)
		.map((part) => part.trim())
		.filter(Boolean);
}

function splitDateEntries(value: string): string[] {
	const direct = splitByDelimiters(value);
	if (direct.length > 1) return unique(direct);

	return unique(
		value
			.split(/,\s*(?=\d{1,2}\s*[-–]\s*\d{1,2}\b)/g)
			.map((part) => part.trim())
			.filter(Boolean)
	);
}

function inferDurationFromDateRange(entry: string): string | null {
	const m = entry.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
	if (!m) return null;
	const start = Number.parseInt(m[1], 10);
	const end = Number.parseInt(m[2], 10);
	if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
	return `${end - start + 1} zile`;
}

export function buildScheduleLines(
	datesText?: string | null,
	durationText?: string | null
): string[] {
	const dates = splitDateEntries(normalizeText(datesText));
	let durations = splitByDelimiters(normalizeText(durationText));

	// Business rule requested: if no interval/duration, do not display schedule.
	if (durations.length === 0) return [];

	if (dates.length === 0) return durations;
	if (dates.length > 1 && durations.length === 1) durations = Array.from({ length: dates.length }, () => durations[0]);
	if (dates.length > durations.length) {
		const padded = [...durations];
		for (let i = durations.length; i < dates.length; i++) {
			padded.push(inferDurationFromDateRange(dates[i]) ?? durations[durations.length - 1] ?? '');
		}
		durations = padded;
	}

	return dates
		.map((date, index) => {
			const duration = normalizeText(durations[index] ?? durations[0] ?? '');
			return duration ? `${date} · ${duration}` : '';
		})
		.filter(Boolean);
}

