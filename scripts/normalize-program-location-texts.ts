/**
 * Ensure program locale has locationText set and datesText without location suffix.
 *
 * Run: bun --env-file=.env scripts/normalize-program-location-texts.ts
 */
import { asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { program, programLocale } from '../src/lib/server/db/schema';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function looksLikeLocation(value: string): boolean {
	const v = value.trim();
	if (!v) return false;
	if (/\d/.test(v)) return false;
	if (
		/(zile|days|day|săptăm|week|iulie|august|septembrie|octombrie|noiembrie|decembrie|january|february|march|april|may|june|july|september|october|november|december)/i.test(
			v
		)
	)
		return false;
	return /[A-Za-zĂÂÎȘȚăâîșț]/.test(v);
}

function extractLocationFromDatesText(datesText: string | null | undefined): string | null {
	if (!datesText) return null;
	const parts = datesText
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);
	if (parts.length < 2) return null;
	const candidate = parts[parts.length - 1];
	return looksLikeLocation(candidate) ? candidate : null;
}

function stripLocationFromDatesText(
	datesText: string | null | undefined,
	locationText: string | null | undefined
): string | null {
	if (!datesText) return null;
	if (!locationText) return datesText.trim();
	const escapedLocation = escapeRegExp(locationText.trim());
	const withComma = new RegExp(`,\\s*${escapedLocation}\\s*$`, 'i');
	const withBullet = new RegExp(`\\s*[·-]\\s*${escapedLocation}\\s*$`, 'i');
	let clean = datesText.replace(withComma, '').replace(withBullet, '').trim();
	clean = clean.replace(/\s{2,}/g, ' ').trim();
	return clean || null;
}

async function main() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	const programs = await db
		.select({
			id: program.id,
			slug: program.slug,
			location: program.location
		})
		.from(program)
		.orderBy(asc(program.id));

	let updatedLocales = 0;
	let updatedPrograms = 0;
	const missingLocations: string[] = [];

	for (const p of programs) {
		const locales = await db
			.select({
				id: programLocale.id,
				locale: programLocale.locale,
				locationText: programLocale.locationText,
				datesText: programLocale.datesText
			})
			.from(programLocale)
			.where(eq(programLocale.programId, p.id));

		const roLocale = locales.find((l) => l.locale === 'ro');
		const roDerivedLocation =
			roLocale?.locationText?.trim() ||
			extractLocationFromDatesText(roLocale?.datesText) ||
			p.location?.trim() ||
			null;

		for (const loc of locales) {
			const currentLocation = loc.locationText?.trim() || null;
			const derivedLocation =
				currentLocation ||
				extractLocationFromDatesText(loc.datesText) ||
				roDerivedLocation ||
				null;
			const cleanedDatesText = stripLocationFromDatesText(loc.datesText, derivedLocation);

			if (derivedLocation !== currentLocation || cleanedDatesText !== (loc.datesText?.trim() || null)) {
				await db
					.update(programLocale)
					.set({
						locationText: derivedLocation,
						datesText: cleanedDatesText
					})
					.where(eq(programLocale.id, loc.id));
				updatedLocales++;
			}
		}

		if (roDerivedLocation && roDerivedLocation !== (p.location?.trim() || null)) {
			await db
				.update(program)
				.set({
					location: roDerivedLocation
				})
				.where(eq(program.id, p.id));
			updatedPrograms++;
		}

		if (!roDerivedLocation) missingLocations.push(p.slug);
	}

	await client.end();

	console.log(`Updated locales: ${updatedLocales}`);
	console.log(`Updated programs.location: ${updatedPrograms}`);
	if (missingLocations.length > 0) {
		console.log('Programs still missing location:', missingLocations.join(', '));
	} else {
		console.log('All programs have a location.');
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
