/** Singurul program cu pagină de detaliu publică activă (restul sunt vizibile în listă, dar blocate). */
export const PUBLIC_PROGRAM_SLUG = 'kogaion-family-bootcamp-4-6-ani';

export function isProgramPubliclyOpen(slug: string): boolean {
	return slug === PUBLIC_PROGRAM_SLUG;
}
