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
	email: 'contact@kogaionacademy.ro',
	phone: '0720.529.398',
	// Fără sediu: coloana `address` este NOT NULL în schemă, deci se trimite șir gol.
	address: '',
	mapUrl: null,
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
