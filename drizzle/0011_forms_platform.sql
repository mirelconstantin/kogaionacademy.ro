CREATE TABLE IF NOT EXISTS "forms_definition" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"locale" text DEFAULT 'ro' NOT NULL,
	"version" integer NOT NULL,
	"title" text,
	"schema_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "forms_definition_key_locale_version_idx" ON "forms_definition" ("key","locale","version");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forms_placement" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_key" text NOT NULL,
	"placement_key" text NOT NULL,
	"route_pattern" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "forms_placement_form_placement_idx" ON "forms_placement" ("form_key","placement_key");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forms_submission" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_key" text NOT NULL,
	"form_version" integer NOT NULL,
	"session_fingerprint" text NOT NULL,
	"user_id" text,
	"consent_snapshot" jsonb,
	"ip_address" text,
	"user_agent" text,
	"referrer" text,
	"utm" jsonb,
	"page_url" text,
	"locale" text,
	"idempotency_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forms_submission_form_key_created_idx" ON "forms_submission" ("form_key","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "forms_submission_idempotency_idx" ON "forms_submission" ("idempotency_key");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forms_answer" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"field_key" text NOT NULL,
	"value_text" text,
	"value_json" jsonb,
	"pii_class" text DEFAULT 'none' NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forms_answer_submission_idx" ON "forms_answer" ("submission_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forms_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_key" text NOT NULL,
	"event_type" text NOT NULL,
	"field_key" text,
	"session_fingerprint" text NOT NULL,
	"user_id" text,
	"page_url" text NOT NULL,
	"locale" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forms_event_form_occurred_idx" ON "forms_event" ("form_key","occurred_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forms_metric_daily" (
	"id" serial PRIMARY KEY NOT NULL,
	"day" date NOT NULL,
	"form_key" text NOT NULL,
	"locale" text DEFAULT '' NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"visible_50_count" integer DEFAULT 0 NOT NULL,
	"focus_count" integer DEFAULT 0 NOT NULL,
	"submit_attempt_count" integer DEFAULT 0 NOT NULL,
	"submit_success_count" integer DEFAULT 0 NOT NULL,
	"submit_error_count" integer DEFAULT 0 NOT NULL,
	"unique_sessions_estimate" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "forms_metric_daily_day_form_locale_idx" ON "forms_metric_daily" ("day","form_key","locale");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forms_saved_view" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_key" text NOT NULL,
	"name" text NOT NULL,
	"filters_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forms_submission" ADD CONSTRAINT "forms_submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forms_answer" ADD CONSTRAINT "forms_answer_submission_id_forms_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."forms_submission"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forms_event" ADD CONSTRAINT "forms_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
