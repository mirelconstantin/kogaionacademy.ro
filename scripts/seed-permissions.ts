/**
 * Seed permission and role_permission tables from permissions-model.
 * Run after db:migrate. Usage: bun run scripts/seed-permissions.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { permission, rolePermission } from '../src/lib/server/db/schema';
import {
	PERMISSION_KEYS,
	PERMISSION_META,
	ROLE_PERMISSIONS,
	ROLES,
	type PermissionKey
} from '../src/lib/server/permissions-model';

const databaseUrl =
	process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('host:port')
		? process.env.DATABASE_URL
		: 'postgres://localhost:5432/kogaion';

async function seed() {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	console.log('Seeding permission...');
	for (const key of PERMISSION_KEYS) {
		const meta = PERMISSION_META[key as PermissionKey];
		await db
			.insert(permission)
			.values({
				key,
				label: meta.label,
				group: meta.group,
				description: meta.description ?? null
			})
			.onConflictDoUpdate({
				target: permission.key,
				set: { label: meta.label, group: meta.group, description: meta.description ?? null }
			});
	}

	console.log('Seeding role_permission...');
	const rolesToSeed = [...ROLES, 'editor', 'admin'] as const;
	for (const role of rolesToSeed) {
		const perms = ROLE_PERMISSIONS[role];
		if (!perms) continue;
		for (const permissionKey of perms) {
			await db
				.insert(rolePermission)
				.values({ role, permissionKey })
				.onConflictDoNothing();
		}
	}

	console.log('Permissions and role_permission seeded.');
	process.exit(0);
}

seed().catch((e) => {
	console.error(e);
	process.exit(1);
});
