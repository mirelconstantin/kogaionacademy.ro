/**
 * Mentor profile content — the one published mentor with no source biography.
 *
 * `vladimir-stefanescu` has `bio_ro` empty in the database, so there is no source text to
 * restructure. He is a real mentor (linked to two programmes, holds a coordinator role), so
 * he stays published; inventing a biography for him would be worse than leaving the fields
 * empty. Only `role` and `expertise` are filled, both derived strictly from `title_ro`,
 * which is the only claim the database actually makes.
 *
 * The mentors page renders this honestly: a card with a name, a title and a role, and a
 * modal that omits the "Despre", "În Kogaion" and "Vocea mentorului" sections entirely
 * instead of showing empty headings. Fill in `bio_ro` and re-run
 * `bun run scripts/seed-mentor-profiles.ts` to complete the profile.
 *
 * `luminita-muresan` has the same problem and is handled in batch 2 — she is not repeated
 * here, because the seed script rejects duplicate slugs.
 */
export interface MentorProfileContent {
	slug: string;
	role: string;
	short: string;
	about: string;
	kogaion: string;
	quote: string;
	expertise: string[];
}

export const mentorProfileBatch4: MentorProfileContent[] = [
	{
		slug: 'vladimir-stefanescu',
		role: 'Coordonator Școala de Astronomie',
		// Empty: no biography exists to shorten into a 25-40 word teaser.
		short: '',
		about: '',
		kogaion: '',
		quote: '',
		expertise: ['Astronomie', 'Educație STEM', 'Telescoape']
	}
];
