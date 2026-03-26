import {
	pgTable,
	serial,
	integer,
	boolean,
	text,
	timestamp,
	date,
	jsonb,
	uniqueIndex,
	index,
	primaryKey
} from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const mentor = pgTable('mentor', {
	id: serial('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	nameRo: text('name_ro').notNull(),
	nameEn: text('name_en'),
	titleRo: text('title_ro').notNull(),
	titleEn: text('title_en'),
	bioRo: text('bio_ro').notNull(),
	bioEn: text('bio_en'),
	image: text('image'),
	yearJoined: integer('year_joined'),
	sortOrder: integer('sort_order').notNull().default(0),
	location: text('location'),
	status: text('status').notNull().default('published'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	publishedAt: timestamp('published_at'),
	updatedBy: text('updated_by')
});

/** Program (shared fields, slug, category, media, dates). */
export const program = pgTable('program', {
	id: serial('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	categoryId: text('category_id').notNull(),
	image: text('image'), // poster/fallback when videoUrl is set
	videoUrl: text('video_url'), // optional hero video (mp4/webm)
	badge: text('badge'), // 'early_bird' | 'new' | null
	sortOrder: integer('sort_order').notNull().default(0),
	location: text('location'),
	startDate: date('start_date'),
	endDate: date('end_date'),
	status: text('status').notNull().default('published'),
	publishedAt: timestamp('published_at'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	updatedBy: text('updated_by')
});

/** Program content per locale (RO first, EN fallback). */
export const programLocale = pgTable(
	'program_locale',
	{
		id: serial('id').primaryKey(),
		programId: integer('program_id')
			.notNull()
			.references(() => program.id, { onDelete: 'cascade' }),
		locale: text('locale').notNull(),
		title: text('title').notNull(),
		subtitle: text('subtitle'),
		description: text('description'),
		ageRange: text('age_range'),
		datesText: text('dates_text'),
		durationText: text('duration_text'),
		locationText: text('location_text')
	},
	(t) => [uniqueIndex('program_locale_program_locale_idx').on(t.programId, t.locale)]
);

/** Per-program rich sections (hero highlights, packages, gallery, transport, etc.). One row per (program, section, locale). */
export const programSection = pgTable(
	'program_section',
	{
		id: serial('id').primaryKey(),
		programId: integer('program_id')
			.notNull()
			.references(() => program.id, { onDelete: 'cascade' }),
		section: text('section').notNull(),
		locale: text('locale').notNull(),
		sortOrder: integer('sort_order').notNull().default(0),
		payload: jsonb('payload').notNull().default({}),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
		updatedBy: text('updated_by')
	},
	(t) => [uniqueIndex('program_section_program_section_locale_idx').on(t.programId, t.section, t.locale)]
);

/** Many-to-many: which mentors are linked to which program. */
export const programMentor = pgTable(
	'program_mentor',
	{
		programId: integer('program_id')
			.notNull()
			.references(() => program.id, { onDelete: 'cascade' }),
		mentorId: integer('mentor_id')
			.notNull()
			.references(() => mentor.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.programId, t.mentorId] })]
);

/** Media assets (images/video) – metadata și SEO. URL = cheie logică. */
export const mediaAsset = pgTable(
	'media_asset',
	{
		id: serial('id').primaryKey(),
		url: text('url').notNull(),
		title: text('title'),
		alt: text('alt'),
		caption: text('caption'),
		description: text('description'), // SEO / descriere
		type: text('type'), // 'image' | 'video'
		tags: jsonb('tags').$type<string[]>().default([]),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
		updatedBy: text('updated_by')
	},
	(t) => [uniqueIndex('media_asset_url_unique').on(t.url)]
);

/** Locale-aware editable content for page sections (key, page, section, locale, payload). */
export const siteSection = pgTable(
	'site_section',
	{
		id: serial('id').primaryKey(),
		page: text('page').notNull(),
		section: text('section').notNull(),
		locale: text('locale').notNull(),
		payload: jsonb('payload').notNull().default({}),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
		updatedBy: text('updated_by')
	},
	(t) => [uniqueIndex('site_section_page_section_locale_idx').on(t.page, t.section, t.locale)]
);

/** Contact page settings per locale. */
export const contactSettings = pgTable('contact_settings', {
	id: serial('id').primaryKey(),
	locale: text('locale').notNull().unique(),
	email: text('email').notNull(),
	phone: text('phone').notNull(),
	address: text('address').notNull(),
	mapUrl: text('map_url'),
	socials: jsonb('socials').$type<{ name: string; url: string }[]>().default([]),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	updatedBy: text('updated_by')
});

/** Audit log for all CMS changes (sections, mentors, programs, hero, contact). */
export const cmsAuditLog = pgTable('cms_audit_log', {
	id: serial('id').primaryKey(),
	entityType: text('entity_type').notNull(), // 'site_section' | 'mentor' | 'program' | 'hero_settings' | 'contact_settings'
	entityId: text('entity_id').notNull(), // e.g. 'about:letter:ro' or '42' for mentor
	userId: text('user_id'),
	userName: text('user_name'),
	action: text('action').notNull(), // 'create' | 'update'
	payloadBefore: jsonb('payload_before'),
	payloadAfter: jsonb('payload_after'),
	changedAt: timestamp('changed_at').defaultNow().notNull()
});

/** Blog post (rich text via Edra/Tiptap HTML, status draft | scheduled | published). Soft-deleted when deletedAt is set. */
export const blogPost = pgTable('blog_post', {
	id: serial('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	excerpt: text('excerpt'),
	body: text('body').notNull().default(''),
	locale: text('locale').notNull().default('ro'),
	status: text('status').notNull().default('draft'), // 'draft' | 'scheduled' | 'published'
	featuredImage: text('featured_image'),
	publishedAt: timestamp('published_at'),
	scheduledFor: timestamp('scheduled_for'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	updatedBy: text('updated_by'),
	deletedAt: timestamp('deleted_at'),
	deletedBy: text('deleted_by')
});

/** Global site settings (key-value). */
export const siteSetting = pgTable('site_setting', {
	key: text('key').primaryKey(),
	value: jsonb('value').notNull().default({}),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	updatedBy: text('updated_by')
});

/** Hero section settings per locale (home hero). */
export const heroSettings = pgTable('hero_settings', {
	id: serial('id').primaryKey(),
	locale: text('locale').notNull().unique(),
	videoUrl: text('video_url').notNull(),
	posterUrl: text('poster_url'),
	ctaPrimaryLabel: text('cta_primary_label'),
	ctaPrimaryLink: text('cta_primary_link'),
	ctaSecondaryLabel: text('cta_secondary_label'),
	ctaSecondaryLink: text('cta_secondary_link'),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	updatedBy: text('updated_by')
});

// --- RBAC: permissions, role_permission, user overrides, admin invites ---

/** Permission definitions (key = permission key used in code). */
export const permission = pgTable('permission', {
	key: text('key').primaryKey(),
	label: text('label').notNull(),
	group: text('group').notNull(),
	description: text('description')
});

/** Role → permission mapping (which permissions each role has by default). */
export const rolePermission = pgTable(
	'role_permission',
	{
		role: text('role').notNull(),
		permissionKey: text('permission_key')
			.notNull()
			.references(() => permission.key, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.role, t.permissionKey] })]
);

/** Per-user permission overrides: allow adds, deny removes from role base. */
export const userPermissionOverride = pgTable(
	'user_permission_override',
	{
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		permissionKey: text('permission_key')
			.notNull()
			.references(() => permission.key, { onDelete: 'cascade' }),
		mode: text('mode').notNull() // 'allow' | 'deny'
	},
	(t) => [primaryKey({ columns: [t.userId, t.permissionKey] })]
);

/** Published/draft form definitions (versioned per key + locale). */
export const formsDefinition = pgTable(
	'forms_definition',
	{
		id: serial('id').primaryKey(),
		key: text('key').notNull(),
		locale: text('locale').notNull().default('ro'),
		version: integer('version').notNull(),
		title: text('title'),
		schemaJson: jsonb('schema_json').notNull().default({}),
		status: text('status').notNull().default('draft'),
		publishedAt: timestamp('published_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
		updatedBy: text('updated_by')
	},
	(t) => [uniqueIndex('forms_definition_key_locale_version_idx').on(t.key, t.locale, t.version)]
);

/** Where a form key is mounted on the site (for documentation / future routing). */
export const formsPlacement = pgTable(
	'forms_placement',
	{
		id: serial('id').primaryKey(),
		formKey: text('form_key').notNull(),
		placementKey: text('placement_key').notNull(),
		routePattern: text('route_pattern'),
		enabled: integer('enabled').notNull().default(1),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(t) => [uniqueIndex('forms_placement_form_placement_idx').on(t.formKey, t.placementKey)]
);

/** One row per form submission. */
export const formsSubmission = pgTable(
	'forms_submission',
	{
		id: serial('id').primaryKey(),
		formKey: text('form_key').notNull(),
		formVersion: integer('form_version').notNull(),
		sessionFingerprint: text('session_fingerprint').notNull(),
		userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
		consentSnapshot: jsonb('consent_snapshot'),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		referrer: text('referrer'),
		utm: jsonb('utm').$type<Record<string, string>>(),
		pageUrl: text('page_url'),
		locale: text('locale'),
		idempotencyKey: text('idempotency_key'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [
		index('forms_submission_form_key_created_idx').on(t.formKey, t.createdAt),
		uniqueIndex('forms_submission_idempotency_idx').on(t.idempotencyKey)
	]
);

/** Field answers for a submission (wide export built from these rows). */
export const formsAnswer = pgTable(
	'forms_answer',
	{
		id: serial('id').primaryKey(),
		submissionId: integer('submission_id')
			.notNull()
			.references(() => formsSubmission.id, { onDelete: 'cascade' }),
		fieldKey: text('field_key').notNull(),
		valueText: text('value_text'),
		valueJson: jsonb('value_json'),
		piiClass: text('pii_class').notNull().default('none')
	},
	(t) => [index('forms_answer_submission_idx').on(t.submissionId)]
);

/** High-volume interaction events (views, focus, field_change, submit_*). */
export const formsEvent = pgTable(
	'forms_event',
	{
		id: serial('id').primaryKey(),
		formKey: text('form_key').notNull(),
		eventType: text('event_type').notNull(),
		fieldKey: text('field_key'),
		sessionFingerprint: text('session_fingerprint').notNull(),
		userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
		pageUrl: text('page_url').notNull(),
		locale: text('locale'),
		metadata: jsonb('metadata').$type<Record<string, unknown>>(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		occurredAt: timestamp('occurred_at').defaultNow().notNull()
	},
	(t) => [index('forms_event_form_occurred_idx').on(t.formKey, t.occurredAt)]
);

/** Pre-aggregated daily metrics for dashboards (updated incrementally or by job). */
export const formsMetricDaily = pgTable(
	'forms_metric_daily',
	{
		id: serial('id').primaryKey(),
		day: date('day').notNull(),
		formKey: text('form_key').notNull(),
		locale: text('locale').notNull().default(''),
		viewsCount: integer('views_count').notNull().default(0),
		visible50Count: integer('visible_50_count').notNull().default(0),
		focusCount: integer('focus_count').notNull().default(0),
		submitAttemptCount: integer('submit_attempt_count').notNull().default(0),
		submitSuccessCount: integer('submit_success_count').notNull().default(0),
		submitErrorCount: integer('submit_error_count').notNull().default(0),
		uniqueSessionsEstimate: integer('unique_sessions_estimate').notNull().default(0)
	},
	(t) => [uniqueIndex('forms_metric_daily_day_form_locale_idx').on(t.day, t.formKey, t.locale)]
);

/** Saved filter / segment presets per form (admin BI). */
export const formsSavedView = pgTable('forms_saved_view', {
	id: serial('id').primaryKey(),
	formKey: text('form_key').notNull(),
	name: text('name').notNull(),
	filtersJson: jsonb('filters_json').notNull().default({}),
	createdBy: text('created_by'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

/** Snapshot of form definition after each save (for restore / audit). */
export const formsDefinitionRevision = pgTable(
	'forms_definition_revision',
	{
		id: serial('id').primaryKey(),
		definitionId: integer('definition_id')
			.notNull()
			.references(() => formsDefinition.id, { onDelete: 'cascade' }),
		schemaJson: jsonb('schema_json').notNull().default({}),
		title: text('title'),
		createdBy: text('created_by'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [index('forms_def_revision_def_created_idx').on(t.definitionId, t.createdAt)]
);

/** Admin invite: email, role, optional overrides, token, status, expiry. */
export const adminInvite = pgTable('admin_invite', {
	id: serial('id').primaryKey(),
	email: text('email').notNull(),
	role: text('role').notNull(),
	overridesJson: text('overrides_json'), // JSON array of { permissionKey, mode }
	token: text('token').notNull().unique(),
	status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'expired' | 'revoked'
	expiresAt: timestamp('expires_at').notNull(),
	invitedBy: text('invited_by').references(() => user.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	acceptedAt: timestamp('accepted_at')
});

export * from './auth.schema';
