/**
 * Shared view-model + label helpers for the mentors page.
 *
 * The CMS can deliver NULL or blank strings for every `*_ro` profile field, so
 * every value is normalised to `string | null` before it reaches the markup.
 * A section is rendered only when its value is non-null: we never render an
 * empty heading.
 */

import type { MentorForDisplay } from '$lib/server/content';

/** Normalises a nullable CMS string: `null`, `undefined` and blanks become `null`. */
export function textOrNull(value: string | null | undefined): string | null {
	const trimmed = (value ?? '').trim();
	return trimmed.length > 0 ? trimmed : null;
}

/** Normalises a nullable list of CMS strings, dropping blanks and duplicates. */
export function tagList(value: string[] | null | undefined): string[] {
	if (!Array.isArray(value)) return [];
	const seen = new Set<string>();
	const result: string[] = [];
	for (const entry of value) {
		const tag = textOrNull(entry);
		if (!tag) continue;
		const key = tag.toLocaleLowerCase('ro');
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(tag);
	}
	return result;
}

export type MentorLabels = {
	/** Card CTA that opens the large profile popup. */
	readMore: string;
	/** Primary footer action inside the popup. */
	readProfile: string;
	/** Secondary (dismiss) action inside the popup. */
	readLess: string;
	/** Accessible label for the popup close button. */
	close: string;
	/** Accessible label for the whole-card click target. */
	openProfile: (name: string) => string;
};

const RO_LABELS: MentorLabels = {
	readMore: 'Citește mai mult',
	readProfile: 'Citește profil',
	readLess: 'Mai puțin',
	close: 'Închide',
	openProfile: (name) => `Vezi profilul complet al lui ${name}`
};

const EN_LABELS: MentorLabels = {
	readMore: 'Read more',
	readProfile: 'Read profile',
	readLess: 'Less',
	close: 'Close',
	openProfile: (name) => `View the full profile of ${name}`
};

/** Mirrors the `getLocale() === 'en' ? … : …` pattern used across the page. */
export function mentorLabels(locale: string): MentorLabels {
	return locale === 'en' ? EN_LABELS : RO_LABELS;
}

/** Section headings, hardcoded in Romanian per the client spec. */
export const MENTOR_SECTION_LABELS = {
	about: (name: string) => (name.trim() ? `Despre ${name.trim()}` : 'Despre'),
	kogaion: 'În Kogaion',
	voice: 'Vocea mentorului',
	expertise: 'Domenii de expertiză'
} as const;

export type MentorView = {
	id: number;
	slug: string;
	name: string;
	/** Profesie / specializare. */
	title: string | null;
	/** Rol / categorie în Kogaion. */
	role: string | null;
	/** Card teaser. */
	shortBio: string | null;
	/** "Despre [Nume]" body — falls back to the legacy `bio`. */
	about: string | null;
	/** "În Kogaion" body. */
	kogaion: string | null;
	/** "Vocea mentorului" quote. */
	voiceQuote: string | null;
	/** "Domenii de expertiză" tags. */
	expertise: string[];
	image: string | null;
	yearJoined: number | null;
	aboutHeading: string;
};

/**
 * Projects a `MentorForDisplay` row into the shape the UI renders, dropping
 * every blank field so the markup can simply test for `null`.
 */
export function mentorView(mentor: MentorForDisplay): MentorView {
	const name = textOrNull(mentor.name) ?? '';
	return {
		id: mentor.id,
		slug: mentor.slug,
		name,
		title: textOrNull(mentor.title),
		role: textOrNull(mentor.role),
		shortBio: textOrNull(mentor.shortBio),
		about: textOrNull(mentor.about) ?? textOrNull(mentor.bio),
		kogaion: textOrNull(mentor.kogaion),
		voiceQuote: textOrNull(mentor.voiceQuote),
		expertise: tagList(mentor.expertise),
		image: textOrNull(mentor.image),
		yearJoined: typeof mentor.yearJoined === 'number' ? mentor.yearJoined : null,
		aboutHeading: MENTOR_SECTION_LABELS.about(name)
	};
}
