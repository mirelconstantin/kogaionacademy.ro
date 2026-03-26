/**
 * Copiază datele din baza veche în cea nouă.
 * Setează OLD_DATABASE_URL = conexiunea la baza actuală (sursă)
 * Setează DATABASE_URL = conexiunea la baza nouă (destinație)
 * Rulează: OLD_DATABASE_URL=... DATABASE_URL=... bun run scripts/migrate-db-to-new.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/server/db/schema';

const oldUrl = process.env.OLD_DATABASE_URL;
const newUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: null;

if (!oldUrl || !newUrl) {
	console.error('Set both OLD_DATABASE_URL and DATABASE_URL');
	process.exit(1);
}

async function migrate() {
	const oldClient = postgres(oldUrl);
	const newClient = postgres(newUrl);
	const oldDb = drizzle(oldClient, { schema });
	const newDb = drizzle(newClient, { schema });

	try {
		const users = await oldDb.select().from(schema.user);
		if (users.length) {
			for (const row of users) {
				await newDb.insert(schema.user).values(row).onConflictDoNothing();
			}
			console.log('user:', users.length);
		}
		const accounts = await oldDb.select().from(schema.account);
		if (accounts.length) {
			for (const row of accounts) {
				await newDb.insert(schema.account).values(row).onConflictDoNothing();
			}
			console.log('account:', accounts.length);
		}
		const sessions = await oldDb.select().from(schema.session);
		if (sessions.length) {
			for (const row of sessions) {
				await newDb.insert(schema.session).values(row).onConflictDoNothing();
			}
			console.log('session:', sessions.length);
		}
		const verifications = await oldDb.select().from(schema.verification);
		if (verifications.length) {
			for (const row of verifications) {
				await newDb.insert(schema.verification).values(row).onConflictDoNothing();
			}
			console.log('verification:', verifications.length);
		}
		const mentors = await oldDb.select().from(schema.mentor);
		if (mentors.length) {
			for (const row of mentors) {
				await newDb.insert(schema.mentor).values(row).onConflictDoNothing();
			}
			console.log('mentor:', mentors.length);
		}
		const tasks = await oldDb.select().from(schema.task);
		if (tasks.length) {
			for (const row of tasks) {
				await newDb.insert(schema.task).values(row).onConflictDoNothing();
			}
			console.log('task:', tasks.length);
		}
		const siteSections = await oldDb.select().from(schema.siteSection);
		if (siteSections.length) {
			for (const row of siteSections) {
				await newDb.insert(schema.siteSection).values(row).onConflictDoNothing();
			}
			console.log('site_section:', siteSections.length);
		}
		const contactSettings = await oldDb.select().from(schema.contactSettings);
		if (contactSettings.length) {
			for (const row of contactSettings) {
				await newDb.insert(schema.contactSettings).values(row).onConflictDoNothing();
			}
			console.log('contact_settings:', contactSettings.length);
		}
		const heroSettings = await oldDb.select().from(schema.heroSettings);
		if (heroSettings.length) {
			for (const row of heroSettings) {
				await newDb.insert(schema.heroSettings).values(row).onConflictDoNothing();
			}
			console.log('hero_settings:', heroSettings.length);
		}
	} catch (e) {
		console.error(e);
	} finally {
		await oldClient.end();
		await newClient.end();
	}
	console.log('Done.');
}

migrate().catch((e) => {
	console.error(e);
	process.exit(1);
});
