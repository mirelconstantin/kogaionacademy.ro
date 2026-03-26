/**
 * Types for program_section payloads. Section keys and payload shapes for rich program detail pages.
 */

export type ProgramSectionKey =
	| 'hero_highlights'
	| 'intro'
	| 'curriculum_areas'
	| 'packages'
	| 'extracurricular'
	| 'benefits_family'
	| 'benefits_main'
	| 'benefits_secondary'
	| 'gallery'
	| 'transport'
	| 'menu'
	| 'location'
	| 'testimonials'
	| 'enrollment'
	| 'video_links';

export interface HeroHighlightsPayload {
	items: string[];
}

export interface IntroBlock {
	title?: string;
	body: string;
}

export interface IntroPayload {
	blocks: IntroBlock[];
	imageBetweenBlocks?: string;
	/** Optional index after which intro image is rendered. Defaults to end of intro. */
	imageAfterBlockIndex?: number;
}

export interface CurriculumArea {
	title: string;
}

export interface CurriculumAreaGroup {
	title: string;
	areas: CurriculumArea[];
}

export interface CurriculumAreasPayload {
	title?: string;
	areas: CurriculumArea[];
	groups?: CurriculumAreaGroup[];
	image?: string;
}

export interface PackageItem {
	title: string;
	subtitle?: string;
	items: string[];
}

export interface PackagesPayload {
	title?: string;
	intro?: string;
	packages: PackageItem[];
	note?: string;
}

export interface ExtracurricularPayload {
	title?: string;
	intro?: string;
	groups: { title: string; subtitle?: string; items: string[] }[];
	methods?: string;
}

export interface BenefitsFamilyPayload {
	title?: string;
	items: string[];
	note?: string;
	other?: string;
	otherItems?: string[];
}

export interface BenefitsMainPayload {
	/** Small caps label above title (e.g. „Beneficii”), same pattern as mentors „Echipa”. */
	eyebrow?: string;
	title?: string;
	/** Short intro under the title. */
	intro?: string;
	items: string[];
	image?: string;
}

export interface BenefitsSecondaryPayload {
	title?: string;
	items: string[];
}

export interface GalleryPayload {
	title?: string;
	images: { url: string; alt?: string; caption?: string }[];
}

export interface TransportPayload {
	title?: string;
	body: string;
	contact?: string;
}

export interface MenuPayload {
	title?: string;
	body: string;
	note?: string;
}

export interface LocationPayload {
	/** Small caps label above title (e.g. „Locație”). */
	eyebrow?: string;
	title?: string;
	/** Short intro under the title, before map/images. */
	intro?: string;
	subtitle?: string;
	address?: string;
	body: string;
	amenities?: string[];
	closing?: string;
	/** Main location image (above body). */
	image?: string;
	/** Optional grid of images (e.g. 3 per row, 2 rows). */
	images?: string[];
	mapEmbedUrl?: string;
}

export interface TestimonialItem {
	quote?: string;
	author?: string;
	role?: string;
}

export interface TestimonialsPayload {
	title?: string;
	items: TestimonialItem[];
}

export interface EnrollmentStep {
	order: number;
	label: string;
}

export interface EnrollmentPayload {
	title?: string;
	intro?: string;
	steps: EnrollmentStep[];
	contactNote?: string;
}

export interface VideoLink {
	label: string;
	url: string;
}

export interface VideoLinksPayload {
	title?: string;
	links: VideoLink[];
}

export type ProgramSectionPayload =
	| HeroHighlightsPayload
	| IntroPayload
	| CurriculumAreasPayload
	| PackagesPayload
	| ExtracurricularPayload
	| BenefitsFamilyPayload
	| BenefitsMainPayload
	| BenefitsSecondaryPayload
	| GalleryPayload
	| TransportPayload
	| MenuPayload
	| LocationPayload
	| TestimonialsPayload
	| EnrollmentPayload
	| VideoLinksPayload;

export interface ProgramSectionRow {
	section: string;
	sortOrder: number;
	payload: Record<string, unknown>;
}
