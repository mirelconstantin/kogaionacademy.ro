/** Gradient color at bottom, e.g. oklch(0.15 0.06 250) or #0f172a */
export interface HeroSlide {
	title: string;
	description: string;
	color?: string;
}

export interface NewsItem {
	title: string;
	url?: string;
}

export const heroImages = [
	'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1920&q=80',
	'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80',
	'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1920&q=80',
	'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1920&q=80'
];

export const heroSlides: HeroSlide[] = [
	{
		title: 'Upcoming Bootcamp for Kids 6–12',
		description:
			'Creative, hands-on workshops blending science, art, and play. Spark curiosity and build confidence in a fun, supportive environment.',
		color: '#D86115'
	},
	{
		title: 'STEAM Programs This Spring',
		description:
			'Science, technology, engineering, art, and math come together in projects that inspire and challenge young minds.',
		color: '#303951'
	},
	{
		title: 'Join Our Learning Community',
		description:
			'Connect with families who value creativity and growth. Events, workshops, and support for gifted learners.',
		color: '#9D4134'
	},
	{
		title: 'Workshops for All Ages',
		description:
			'From ages 6 to 12, find programs designed to meet each child where they are and help them thrive.',
		color: '#CD5302'
	}
];

export const heroNews: NewsItem[] = [
	{ title: 'Welcome to Kogaion — Discover your potential' },
	{ title: 'New programs starting this spring' },
	{ title: 'Join our community of learners' },
	{ title: 'Explore creative workshops for all ages' }
];

export interface UpcomingProgram {
	title: string;
	description: string;
	color?: string;
	image?: string;
	image9x16?: string;
	startDate?: string;
	ageRange?: string;
}

const programImages1x1 = [
	'/programs/1x1_Conectom%20Advanced%20Learning.png',
	'/programs/1x1_Film%20and%20Photo%20Advanced%20Learning.png',
	'/programs/1x1_Kogaion%20Bright%20Academy.png',
	'/programs/1x1_Architecture%20Advanced%20Learning.png',
	'/programs/1x1_Interior%20Architecture%20Advanced%20Learning.png',
	'/programs/1x1_Kogaion%20Galactic%20Blueprint%20Bootcamp.png',
	'/programs/1x1_Kogaion%20Science%20Bootcamp.png'
];

// Files named 16x9_ are actually 9:16 portrait
const programImages9x16 = [
	'/programs/16x9_Conectom%20Advanced%20Learning.png',
	'/programs/16x9_Film%20%26%20Photo%20Advanced%20Learning.png',
	'/programs/16x9_Kogaion%20Bright%20Academy.png',
	'/programs/16x9_Architecture%20Advanced%20Learning.png',
	'/programs/16x9_Interior%20Architecture%20Advanced%20Learning.png',
	'/programs/16x9_Kogaion%20Galactic%20Blueprint%20Bootcamp.png',
	'/programs/16x9_Kogaion%20Science%20Bootcamp.png'
];

export const upcomingPrograms: UpcomingProgram[] = [
	{
		title: 'Upcoming Bootcamp for Kids 6–12',
		description:
			'Creative, hands-on workshops blending science, art, and play. Spark curiosity and build confidence.',
		color: 'oklch(0.18 0.06 250)',
		image: programImages1x1[0],
		image9x16: programImages9x16[0],
		startDate: 'March 15, 2025',
		ageRange: 'Ages 6–12'
	},
	{
		title: 'STEAM Programs This Spring',
		description:
			'Science, technology, engineering, art, and math come together in inspiring projects.',
		color: 'oklch(0.2 0.05 165)',
		image: programImages1x1[1],
		image9x16: programImages9x16[1],
		startDate: 'March 22, 2025',
		ageRange: 'Ages 6–12'
	},
	{
		title: 'Learning Community Events',
		description: 'Connect with families who value creativity and growth.',
		color: 'oklch(0.2 0.06 290)',
		image: programImages1x1[2],
		image9x16: programImages9x16[2],
		startDate: 'April 5, 2025',
		ageRange: 'All ages'
	},
	{
		title: 'Workshops for All Ages',
		description: 'Programs designed to meet each child where they are.',
		color: 'oklch(0.22 0.06 65)',
		image: programImages1x1[3],
		image9x16: programImages9x16[3],
		startDate: 'April 12, 2025',
		ageRange: 'Ages 6–12'
	},
	{
		title: 'Creative Arts Explorers',
		description: 'Discover drawing, painting, and creative expression.',
		color: 'oklch(0.2 0.08 320)',
		image: programImages1x1[4],
		image9x16: programImages9x16[4],
		startDate: 'April 19, 2025',
		ageRange: 'Ages 6–12'
	},
	{
		title: 'Kogaion Galactic Blueprint Bootcamp',
		description: 'Explore creativity, science, and design.',
		color: 'oklch(0.2 0.06 260)',
		image: programImages1x1[5],
		image9x16: programImages9x16[5],
		startDate: 'April 26, 2025',
		ageRange: 'Ages 6–12'
	},
	{
		title: 'Kogaion Science Bootcamp',
		description: 'Hands-on science and discovery.',
		color: 'oklch(0.2 0.05 200)',
		image: programImages1x1[6],
		image9x16: programImages9x16[6],
		startDate: 'May 3, 2025',
		ageRange: 'Ages 6–12'
	}
];
