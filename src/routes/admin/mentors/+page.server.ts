import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { mentor } from '$lib/server/db/schema';
import { logCmsAudit, getUserDisplayName } from '$lib/server/audit';
import { requirePermission } from '$lib/server/permissions';
import { asc, eq, max } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

/** Generate URL slug from name: lowercase, diacritics → ASCII, spaces → hyphens, strip invalid. */
function slugFromName(name: string): string {
	const s = name
		.trim()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // strip combining marks (ă→a, ș→s, etc.)
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
	return s || 'mentor';
}

/** Find next available slug: base, base-2, base-3, ... */
async function ensureUniqueMentorSlug(base: string): Promise<string> {
	let slug = base;
	let n = 1;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const [existing] = await db.select({ id: mentor.id }).from(mentor).where(eq(mentor.slug, slug)).limit(1);
		if (!existing) return slug;
		slug = `${base}-${++n}`;
	}
}

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'mentors.view');
	const mentors = await db.select().from(mentor).orderBy(asc(mentor.sortOrder), asc(mentor.id));
	return { mentors };
};

export const actions: Actions = {
	create: async (event) => {
		requirePermission(event, 'mentors.edit');
		const formData = await event.request.formData();
		const nameRo = (formData.get('nameRo') as string)?.trim() ?? '';
		if (!nameRo) return fail(400, { error: 'Numele este obligatoriu', action: 'create' });
		const slug = await ensureUniqueMentorSlug(slugFromName(nameRo));
		const nameEn = (formData.get('nameEn') as string)?.trim() || null;
		const titleRo = (formData.get('titleRo') as string)?.trim() ?? '';
		const titleEn = (formData.get('titleEn') as string)?.trim() || null;
		const bioRo = (formData.get('bioRo') as string)?.trim() ?? '';
		const bioEn = (formData.get('bioEn') as string)?.trim() || null;
		const image = (formData.get('image') as string)?.trim() || null;
		const yearJoined = formData.get('yearJoined')
			? parseInt(formData.get('yearJoined') as string, 10)
			: null;
		const [maxRow] = await db.select({ max: max(mentor.sortOrder) }).from(mentor);
		const sortOrder = (maxRow?.max ?? -1) + 1;
		try {
			await db.insert(mentor).values({
				slug,
				nameRo,
				nameEn,
				titleRo,
				titleEn,
				bioRo,
				bioEn,
				image,
				yearJoined: Number.isNaN(yearJoined) ? null : yearJoined,
				sortOrder
			});
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Crearea a eșuat', action: 'create' });
		}
		return { success: true, action: 'create' };
	},
	update: async (event) => {
		requirePermission(event, 'mentors.edit');
		const formData = await event.request.formData();
		const id = parseInt(formData.get('id') as string, 10);
		if (Number.isNaN(id)) return fail(400, { error: 'Invalid id', action: 'update' });
		const nameRo = (formData.get('nameRo') as string)?.trim() ?? '';
		const nameEn = (formData.get('nameEn') as string)?.trim() || null;
		const titleRo = (formData.get('titleRo') as string)?.trim() ?? '';
		const titleEn = (formData.get('titleEn') as string)?.trim() || null;
		const bioRo = (formData.get('bioRo') as string)?.trim() ?? '';
		const bioEn = (formData.get('bioEn') as string)?.trim() || null;
		const image = (formData.get('image') as string)?.trim() || null;
		const yearJoined = formData.get('yearJoined')
			? parseInt(formData.get('yearJoined') as string, 10)
			: null;
		const userId = event.locals.user?.id ?? null;
		const [beforeRow] = await db.select().from(mentor).where(eq(mentor.id, id)).limit(1);
		try {
			await db
				.update(mentor)
				.set({
					nameRo,
					nameEn,
					titleRo,
					titleEn,
					bioRo,
					bioEn,
					image,
					yearJoined: Number.isNaN(yearJoined) ? null : yearJoined,
					updatedAt: new Date(),
					updatedBy: userId
				})
				.where(eq(mentor.id, id));
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to update', action: 'update' });
		}
		const [afterRow] = await db.select().from(mentor).where(eq(mentor.id, id)).limit(1);
		await logCmsAudit({
			entityType: 'mentor',
			entityId: String(id),
			userId,
			userName: getUserDisplayName(event.locals.user as { name?: string; email?: string } | null),
			action: 'update',
			payloadBefore: beforeRow ? (beforeRow as unknown as Record<string, unknown>) : undefined,
			payloadAfter: afterRow ? (afterRow as unknown as Record<string, unknown>) : undefined
		});
		return { success: true, action: 'update' };
	},
	reorder: async (event) => {
		requirePermission(event, 'mentors.edit');
		const formData = await event.request.formData();
		const orderRaw = formData.get('order') as string;
		if (!orderRaw) return fail(400, { error: 'Order required', action: 'reorder' });
		let order: number[];
		try {
			order = JSON.parse(orderRaw) as number[];
			if (!Array.isArray(order) || order.some((x) => typeof x !== 'number')) {
				throw new Error('Invalid order');
			}
		} catch {
			return fail(400, { error: 'Invalid order format', action: 'reorder' });
		}
		try {
			for (let i = 0; i < order.length; i++) {
				await db.update(mentor).set({ sortOrder: i, updatedAt: new Date() }).where(eq(mentor.id, order[i]));
			}
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to reorder', action: 'reorder' });
		}
		return { success: true, action: 'reorder' };
	},
	delete: async (event) => {
		requirePermission(event, 'mentors.edit');
		const formData = await event.request.formData();
		const id = parseInt(formData.get('id') as string, 10);
		if (Number.isNaN(id)) return fail(400, { error: 'Invalid id', action: 'delete' });
		try {
			await db.delete(mentor).where(eq(mentor.id, id));
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to delete', action: 'delete' });
		}
		return { success: true, action: 'delete' };
	}
};
