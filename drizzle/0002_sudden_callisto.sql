CREATE TABLE "cms_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"user_id" text,
	"user_name" text,
	"action" text NOT NULL,
	"payload_before" jsonb,
	"payload_after" jsonb,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
