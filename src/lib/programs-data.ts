/**
 * Programs listing data: categories and programs with Paraglide message keys.
 * Rendered on the Programs page; links use slug for future detail pages.
 */

export type ProgramBadge = 'early_bird' | 'new';

export interface ProgramCategory {
	id: string;
	titleKey: string;
	subtitleKey: string;
}

export interface ProgramItem {
	slug: string;
	categoryId: string;
	titleKey: string;
	ageKey: string;
	/** Optional; if missing, description may be derived (e.g. shared bootcamp description). */
	descriptionKey?: string;
	locationKey: string;
	/** Optional for enrichment (date range only). */
	durationKey?: string;
	datesKey: string;
	badge?: ProgramBadge;
	/** Optional image path under static; fallback used if missing. */
	image?: string;
}

export const programCategories: ProgramCategory[] = [
	{
		id: 'enrichment',
		titleKey: 'programs_category_enrichment',
		subtitleKey: 'programs_category_enrichment_subtitle'
	},
	{
		id: 'family',
		titleKey: 'programs_category_family',
		subtitleKey: 'programs_category_family_subtitle'
	},
	{
		id: 'children',
		titleKey: 'programs_category_children',
		subtitleKey: 'programs_category_children_subtitle'
	},
	{
		id: 'teens',
		titleKey: 'programs_category_teens',
		subtitleKey: 'programs_category_teens_subtitle'
	}
];

/** Shared description key for the 6 children bootcamps. */
const BOOTCAMP_CHILDREN_DESC = 'program_bootcamp_children_description';

export const programsList: ProgramItem[] = [
	// Enrichment (2)
	{
		slug: 'afterschool-kogaion-self-mastery',
		categoryId: 'enrichment',
		titleKey: 'program_self_mastery_title',
		ageKey: 'program_self_mastery_age',
		descriptionKey: 'program_self_mastery_description',
		locationKey: 'programs_location_bucharest',
		datesKey: 'program_self_mastery_dates',
		image: '/media/uploads/programe/afterschool-self-mastery/afterschool-self-mastery-cover.webp'
	},
	{
		slug: 'kogaion-bright-academy',
		categoryId: 'enrichment',
		titleKey: 'program_bright_academy_title',
		ageKey: 'program_bright_academy_age',
		descriptionKey: 'program_bright_academy_description',
		locationKey: 'programs_location_bucharest',
		datesKey: 'program_bright_academy_dates',
		image: '/media/uploads/programe/kogaion-bright-academy/kogaion-bright-academy-cover.webp'
	},
	// Family (3)
	{
		slug: 'kogaion-family-bootcamp-4-6-ani',
		categoryId: 'family',
		titleKey: 'program_family_4_6_title',
		ageKey: 'program_family_4_6_age',
		descriptionKey: 'program_family_4_6_description',
		locationKey: 'programs_location_moieciu',
		durationKey: 'programs_duration_7_days',
		datesKey: 'program_family_4_6_dates',
		badge: 'early_bird',
		image: '/media/uploads/programe/kogaion-family-bootcamp-4-6-ani/kogaion-family-bootcamp-4-6-ani-cover.webp'
	},
	{
		slug: 'kogaion-family-bootcamp',
		categoryId: 'family',
		titleKey: 'program_family_7_12_title',
		ageKey: 'program_family_7_12_age',
		descriptionKey: 'program_family_7_12_description',
		locationKey: 'programs_location_moieciu',
		durationKey: 'programs_duration_7_days',
		datesKey: 'program_family_7_12_dates',
		image: '/media/uploads/programe/kogaion-family-bootcamp/kogaion-family-bootcamp-cover.webp'
	},
	{
		slug: 'kogaion-gifted-family',
		categoryId: 'family',
		titleKey: 'program_gifted_family_title',
		ageKey: 'program_gifted_family_age',
		descriptionKey: 'program_gifted_family_description',
		locationKey: 'programs_location_moieciu',
		durationKey: 'programs_duration_7_days',
		datesKey: 'program_gifted_family_dates',
		image: '/media/uploads/programe/kogaion-gifted-family/kogaion-gifted-family-cover.webp'
	},
	// Children (6)
	{
		slug: 'kogaion-science-bootcamp',
		categoryId: 'children',
		titleKey: 'program_science_title',
		ageKey: 'program_science_age',
		descriptionKey: BOOTCAMP_CHILDREN_DESC,
		locationKey: 'programs_location_moieciu',
		durationKey: 'programs_duration_6_days',
		datesKey: 'program_science_dates',
		image: '/media/uploads/programe/kogaion-science-bootcamp/kogaion-science-bootcamp-cover.webp'
	},
	{
		slug: 'kogaion-architecture-bootcamp',
		categoryId: 'children',
		titleKey: 'program_architecture_bc_title',
		ageKey: 'program_architecture_bc_age',
		descriptionKey: BOOTCAMP_CHILDREN_DESC,
		locationKey: 'programs_location_moieciu',
		durationKey: 'programs_duration_6_days',
		datesKey: 'program_architecture_bc_dates',
		image: '/media/uploads/programe/kogaion-architecture-bootcamp/kogaion-architecture-bootcamp-cover.webp'
	},
	{
		slug: 'kogaion-engineer-bootcamp-2',
		categoryId: 'children',
		titleKey: 'program_engineer_title',
		ageKey: 'program_engineer_age',
		descriptionKey: BOOTCAMP_CHILDREN_DESC,
		locationKey: 'programs_location_moieciu',
		durationKey: 'programs_duration_6_days',
		datesKey: 'program_engineer_dates',
		image: '/media/uploads/programe/kogaion-engineer-bootcamp-2/kogaion-engineer-bootcamp-2-cover.webp'
	},
	{
		slug: 'kogaion-astronomy-bootcamp',
		categoryId: 'children',
		titleKey: 'program_astronomy_title',
		ageKey: 'program_astronomy_age',
		descriptionKey: BOOTCAMP_CHILDREN_DESC,
		locationKey: 'programs_location_moieciu',
		durationKey: 'programs_duration_6_days',
		datesKey: 'program_astronomy_dates',
		image: '/media/uploads/programe/kogaion-astronomy-bootcamp/kogaion-astronomy-bootcamp-cover.webp'
	},
	{
		slug: 'kogaion-arts-bootcamp-2',
		categoryId: 'children',
		titleKey: 'program_arts_title',
		ageKey: 'program_arts_age',
		descriptionKey: BOOTCAMP_CHILDREN_DESC,
		locationKey: 'programs_location_moieciu',
		durationKey: 'programs_duration_6_days',
		datesKey: 'program_arts_dates',
		image: '/media/uploads/programe/kogaion-arts-bootcamp-2/kogaion-arts-bootcamp-2-cover.webp'
	},
	{
		slug: 'kogaion-robotics-bootcamp-2',
		categoryId: 'children',
		titleKey: 'program_robotics_title',
		ageKey: 'program_robotics_age',
		descriptionKey: BOOTCAMP_CHILDREN_DESC,
		locationKey: 'programs_location_moieciu',
		durationKey: 'programs_duration_6_days',
		datesKey: 'program_robotics_dates',
		image: '/media/uploads/programe/kogaion-robotics-bootcamp-2/kogaion-robotics-bootcamp-2-cover.webp'
	},
	// Teens (5)
	{
		slug: 'film-and-photo-advanced-learning',
		categoryId: 'teens',
		titleKey: 'program_film_photo_title',
		ageKey: 'program_film_photo_age',
		descriptionKey: 'program_film_photo_description',
		locationKey: 'programs_location_bran',
		durationKey: 'programs_duration_10_days',
		datesKey: 'program_film_photo_dates',
		image: '/media/uploads/programe/film-and-photo-advanced-learning/film-and-photo-advanced-learning-cover.webp'
	},
	{
		slug: 'architecture-advanced-learning',
		categoryId: 'teens',
		titleKey: 'program_architecture_al_title',
		ageKey: 'program_architecture_al_age',
		descriptionKey: 'program_architecture_al_description',
		locationKey: 'programs_location_bran',
		durationKey: 'programs_duration_10_days',
		datesKey: 'program_architecture_al_dates',
		image: '/media/uploads/programe/architecture-advanced-learning/architecture-advanced-learning-cover.webp'
	},
	{
		slug: 'technology-advanced-learning',
		categoryId: 'teens',
		titleKey: 'program_technology_title',
		ageKey: 'program_technology_age',
		descriptionKey: 'program_technology_description',
		locationKey: 'programs_location_bran',
		durationKey: 'programs_duration_10_days',
		datesKey: 'program_technology_dates',
		image: '/media/uploads/programe/technology-advanced-learning/technology-advanced-learning-cover.webp'
	},
	{
		slug: 'interior-architecture-advanced-learning',
		categoryId: 'teens',
		titleKey: 'program_interior_title',
		ageKey: 'program_interior_age',
		descriptionKey: 'program_interior_description',
		locationKey: 'programs_location_bran',
		durationKey: 'programs_duration_10_days',
		datesKey: 'program_interior_dates',
		image: '/media/uploads/programe/interior-architecture-advanced-learning/interior-architecture-advanced-learning-cover.webp'
	},
	{
		slug: 'conectom-advanced-learning-2',
		categoryId: 'teens',
		titleKey: 'program_conectom_title',
		ageKey: 'program_conectom_age',
		descriptionKey: 'program_conectom_description',
		locationKey: 'programs_location_bran',
		durationKey: 'programs_duration_10_days',
		datesKey: 'program_conectom_dates',
		badge: 'new',
		image: '/media/uploads/programe/conectom-advanced-learning-2/conectom-advanced-learning-2-cover.webp'
	}
];
