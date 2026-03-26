/**
 * Actualizează URL-urile vechi din hero_settings la noile path-uri din media/uploads.
 * Rulează: bun run scripts/fix-hero-urls.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { heroSettings } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const MIGRATIONS: [string, string][] = [
	['/media/home/hero-learning.mp4', '/media/uploads/home/hero.mp4'],
	['/media/home/hero-no-people.mp4', '/media/uploads/home/hero.mp4'],
	['/kogaion-source/images/008-RDCL5971-scaled.jpg', '/media/uploads/home/hero-poster.webp']
];

async function main() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	const rows = await db.select().from(heroSettings);
	let updated = 0;
	for (const row of rows) {
		let changed = false;
		let videoUrl = row.videoUrl;
		let posterUrl = row.posterUrl;
		for (const [oldPath, newPath] of MIGRATIONS) {
			if (videoUrl?.includes(oldPath) || videoUrl === oldPath) {
				videoUrl = newPath;
				changed = true;
			}
			if (posterUrl?.includes(oldPath) || posterUrl === oldPath) {
				posterUrl = newPath;
				changed = true;
			}
		}
		if (changed) {
			await db
				.update(heroSettings)
				.set({ videoUrl: videoUrl ?? row.videoUrl, posterUrl: posterUrl ?? row.posterUrl })
				.where(eq(heroSettings.id, row.id));
			updated++;
			console.log(`Actualizat hero_settings locale=${row.locale}`);
		}
	}
	console.log(`Gata. ${updated} înregistrări actualizate.`);
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
