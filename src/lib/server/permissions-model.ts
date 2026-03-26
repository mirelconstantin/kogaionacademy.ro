/**
 * RBAC model: permission keys, roles, and evaluation rule.
 * Effective permissions = (role_permissions ∪ allow_overrides) ∖ deny_overrides
 */

export const PERMISSION_KEYS = [
	'dashboard.view',
	'pages.view',
	'pages.edit',
	'programs.view',
	'programs.edit',
	'mentors.view',
	'mentors.edit',
	'blog.view',
	'blog.edit',
	'blog.publish',
	'media.view',
	'media.upload',
	'media.delete',
	'media.edit_metadata',
	'settings.view',
	'settings.edit',
	'history.view',
	'team.view',
	'team.invite',
	'team.edit_roles',
	'team.override_permissions',
	'forms.view',
	'forms.edit',
	'forms.analytics',
	'forms.export'
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_META: Record<
	PermissionKey,
	{ label: string; group: string; description?: string }
> = {
	'dashboard.view': { label: 'Vizualizare panou', group: 'Panou', description: 'Acces la pagina principală admin' },
	'pages.view': { label: 'Vizualizare pagini', group: 'Pagini' },
	'pages.edit': { label: 'Editare pagini', group: 'Pagini' },
	'programs.view': { label: 'Vizualizare programe', group: 'Programe' },
	'programs.edit': { label: 'Editare programe', group: 'Programe' },
	'mentors.view': { label: 'Vizualizare mentori', group: 'Mentori' },
	'mentors.edit': { label: 'Editare mentori', group: 'Mentori' },
	'blog.view': { label: 'Vizualizare blog', group: 'Blog' },
	'blog.edit': { label: 'Editare articole', group: 'Blog' },
	'blog.publish': { label: 'Publicare articole', group: 'Blog' },
	'media.view': { label: 'Vizualizare media', group: 'Media' },
	'media.upload': { label: 'Upload media', group: 'Media' },
	'media.delete': { label: 'Ștergere media', group: 'Media' },
	'media.edit_metadata': { label: 'Editare metadata media', group: 'Media' },
	'settings.view': { label: 'Vizualizare setări', group: 'Setări' },
	'settings.edit': { label: 'Editare setări', group: 'Setări' },
	'history.view': { label: 'Vizualizare istoric', group: 'Istoric' },
	'team.view': { label: 'Vizualizare echipă', group: 'Echipa' },
	'team.invite': { label: 'Invitare membri', group: 'Echipa' },
	'team.edit_roles': { label: 'Editare roluri', group: 'Echipa' },
	'team.override_permissions': { label: 'Override permisiuni', group: 'Echipa' },
	'forms.view': { label: 'Vizualizare formulare', group: 'Formulare' },
	'forms.edit': { label: 'Editare formulare', group: 'Formulare' },
	'forms.analytics': { label: 'Analiză formulare', group: 'Formulare' },
	'forms.export': { label: 'Export răspunsuri', group: 'Formulare' }
};

/** Predefined admin roles (stored in user.role). */
export const ROLES = ['super_admin', 'content_admin', 'page_editor', 'blog_editor'] as const;
export type AdminRole = (typeof ROLES)[number];

/** Legacy roles that map to content_admin for migration. */
export const LEGACY_EDITOR_ROLES = ['editor', 'admin'] as const;

/** Role → permission keys (base set; overrides applied separately). */
export const ROLE_PERMISSIONS: Record<AdminRole | 'editor' | 'admin', readonly PermissionKey[]> = {
	super_admin: [...PERMISSION_KEYS],
	content_admin: [
		'dashboard.view',
		'pages.view',
		'pages.edit',
		'programs.view',
		'programs.edit',
		'mentors.view',
		'mentors.edit',
		'blog.view',
		'blog.edit',
		'blog.publish',
		'media.view',
		'media.upload',
		'media.delete',
		'media.edit_metadata',
		'settings.view',
		'settings.edit',
		'history.view',
		'team.view',
		'forms.view',
		'forms.edit',
		'forms.analytics',
		'forms.export'
	],
	page_editor: [
		'dashboard.view',
		'pages.view',
		'pages.edit',
		'programs.view',
		'programs.edit',
		'mentors.view',
		'mentors.edit',
		'media.view',
		'media.upload',
		'media.edit_metadata',
		'history.view',
		'forms.view',
		'forms.analytics'
	],
	blog_editor: [
		'dashboard.view',
		'blog.view',
		'blog.edit',
		'blog.publish',
		'media.view',
		'media.upload',
		'media.edit_metadata'
	],
	editor: [
		'dashboard.view',
		'pages.view',
		'pages.edit',
		'programs.view',
		'programs.edit',
		'mentors.view',
		'mentors.edit',
		'blog.view',
		'blog.edit',
		'blog.publish',
		'media.view',
		'media.upload',
		'media.delete',
		'media.edit_metadata',
		'settings.view',
		'settings.edit',
		'history.view',
		'team.view',
		'forms.view',
		'forms.edit',
		'forms.analytics',
		'forms.export'
	],
	admin: [
		'dashboard.view',
		'pages.view',
		'pages.edit',
		'programs.view',
		'programs.edit',
		'mentors.view',
		'mentors.edit',
		'blog.view',
		'blog.edit',
		'blog.publish',
		'media.view',
		'media.upload',
		'media.delete',
		'media.edit_metadata',
		'settings.view',
		'settings.edit',
		'history.view',
		'team.view',
		'forms.view',
		'forms.edit',
		'forms.analytics',
		'forms.export',
		'team.invite',
		'team.edit_roles',
		'team.override_permissions'
	]
};

export type OverrideMode = 'allow' | 'deny';

/**
 * Compute effective permissions from role + overrides.
 * effective = (role_permissions ∪ allow) ∖ deny
 */
export function computeEffectivePermissions(
	rolePermissions: Set<PermissionKey>,
	allow: Set<PermissionKey>,
	deny: Set<PermissionKey>
): Set<PermissionKey> {
	const effective = new Set<PermissionKey>(rolePermissions);
	for (const k of allow) effective.add(k);
	for (const k of deny) effective.delete(k);
	return effective;
}

/** Get base permissions for a role string (including legacy editor/admin). */
export function getRolePermissionSet(role: string): Set<PermissionKey> {
	const list =
		ROLE_PERMISSIONS[role as AdminRole] ??
		(LEGACY_EDITOR_ROLES.includes(role as (typeof LEGACY_EDITOR_ROLES)[number])
			? ROLE_PERMISSIONS.content_admin
			: []);
	return new Set(list as readonly PermissionKey[]);
}
