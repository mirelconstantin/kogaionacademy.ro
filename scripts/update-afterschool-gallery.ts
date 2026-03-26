/**
 * Update the afterschool-kogaion-self-mastery program gallery to use only the curated 18 images.
 * Validates that each image path exists under static/ before updating the DB.
 * Run: bun run scripts/update-afterschool-gallery.ts
 */
import { existsSync } from 'fs';
import { join } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { program, programSection } from '../src/lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

const PROGRAM_SLUG = 'afterschool-kogaion-self-mastery';
const UPLOAD_BASE = '/media/uploads/programe/afterschool-self-mastery';

/** Uses semantic local .webp asset names from static/media/uploads/programe/afterschool-self-mastery. */
const GALLERY_IMAGES: { url: string; alt: string }[] = [
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-01.webp`, alt: 'Galerie afterschool 1' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-02.webp`, alt: 'Galerie afterschool 2' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-03.webp`, alt: 'Galerie afterschool 3' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-04.webp`, alt: 'Galerie afterschool 4' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-05.webp`, alt: 'Galerie afterschool 5' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-06.webp`, alt: 'Galerie afterschool 6' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-07.webp`, alt: 'Galerie afterschool 7' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-08.webp`, alt: 'Galerie afterschool 8' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-09.webp`, alt: 'Galerie afterschool 9' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-10.webp`, alt: 'Galerie afterschool 10' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-11.webp`, alt: 'Galerie afterschool 11' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-12.webp`, alt: 'Galerie afterschool 12' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-13.webp`, alt: 'Galerie afterschool 13' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-14.webp`, alt: 'Galerie afterschool 14' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-15.webp`, alt: 'Galerie afterschool 15' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-16.webp`, alt: 'Galerie afterschool 16' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-17.webp`, alt: 'Galerie afterschool 17' },
	{ url: `${UPLOAD_BASE}/afterschool-self-mastery-gallery-18.webp`, alt: 'Galerie afterschool 18' }
];

function staticPath(url: string): string {
	// url is e.g. /media/uploads/programe/afterschool-self-mastery/afterschool-self-mastery-gallery-01.webp
	return join(process.cwd(), 'static', url.replace(/^\//, ''));
}

async function main() {
	const missing = GALLERY_IMAGES.filter((img) => !existsSync(staticPath(img.url)));
	if (missing.length > 0) {
		console.error('Missing files under static/:');
		missing.forEach((m) => console.error('  ', m.url));
		process.exit(1);
	}

	const client = postgres(databaseUrl);
	const db = drizzle(client);

	const [prog] = await db.select().from(program).where(eq(program.slug, PROGRAM_SLUG)).limit(1);
	if (!prog) {
		console.error('Program not found:', PROGRAM_SLUG);
		process.exit(1);
	}

	await db
		.update(programSection)
		.set({
			payload: {
				title: 'Galerie foto',
				images: GALLERY_IMAGES
			}
		})
		.where(
			and(
				eq(programSection.programId, prog.id),
				eq(programSection.section, 'gallery'),
				eq(programSection.locale, 'ro')
			)
		);

	console.log('Gallery updated with', GALLERY_IMAGES.length, 'images.');
	await client.end();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
