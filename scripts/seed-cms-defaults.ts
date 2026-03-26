/**
 * Seed default CMS data: contact_settings and hero_settings for ro/en.
 * Run after db:migrate. Usage: bun run scripts/seed-cms-defaults.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { contactSettings, heroSettings } from '../src/lib/server/db/schema';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const defaultContact = {
	email: 'diana@kogaionacademy.ro',
	phone: '0720.529.398',
	address: 'Șoseaua Nordului nr. 94F, Sector 1, București',
	mapUrl:
		'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2846.587903677995!2d26.085061215524853!3d44.48261917910155!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b20267fc6d485f%3A0xa768d9560c723b52!2sKogaion+Gifted+Academy!5e0!3m2!1sen!2sus!4v1494924214903',
	socials: [
		{ name: 'instagram', url: 'https://instagram.com' },
		{ name: 'facebook', url: 'https://facebook.com' },
		{ name: 'linkedin', url: 'https://linkedin.com' }
	] as { name: string; url: string }[]
};

const defaultHero = {
	videoUrl: '/media/uploads/home/hero.mp4',
	posterUrl: '/media/uploads/home/hero-poster.webp',
	ctaPrimaryLabel: 'Descoperă programele',
	ctaPrimaryLink: '/programe',
	ctaSecondaryLabel: 'Despre',
	ctaSecondaryLink: '/despre'
};

async function seed() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	console.log('Seeding contact_settings...');
	for (const locale of ['ro', 'en']) {
		await db
			.insert(contactSettings)
			.values({
				locale,
				...defaultContact
			})
			.onConflictDoUpdate({
				target: contactSettings.locale,
				set: {
					email: defaultContact.email,
					phone: defaultContact.phone,
					address: defaultContact.address,
					mapUrl: defaultContact.mapUrl,
					socials: defaultContact.socials
				}
			});
	}

	console.log('Seeding hero_settings...');
	for (const locale of ['ro', 'en']) {
		const labelPrimary = locale === 'ro' ? 'Descoperă programele' : 'Discover programmes';
		const labelSecondary = locale === 'ro' ? 'Despre' : 'About';
		await db
			.insert(heroSettings)
			.values({
				locale,
				videoUrl: defaultHero.videoUrl,
				posterUrl: defaultHero.posterUrl,
				ctaPrimaryLabel: labelPrimary,
				ctaPrimaryLink: locale === 'ro' ? '/programe' : '/programs',
				ctaSecondaryLabel: labelSecondary,
				ctaSecondaryLink: locale === 'ro' ? '/despre' : '/about'
			})
			.onConflictDoUpdate({
				target: heroSettings.locale,
				set: {
					videoUrl: defaultHero.videoUrl,
					posterUrl: defaultHero.posterUrl,
					ctaPrimaryLabel: labelPrimary,
					ctaPrimaryLink: locale === 'ro' ? '/programe' : '/programs',
					ctaSecondaryLabel: labelSecondary,
					ctaSecondaryLink: locale === 'ro' ? '/despre' : '/about'
				}
			});
	}

	console.log('CMS defaults seeded.');
	process.exit(0);
}

seed().catch((e) => {
	console.error(e);
	process.exit(1);
});
