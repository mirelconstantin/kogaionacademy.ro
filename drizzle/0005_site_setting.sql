CREATE TABLE IF NOT EXISTS "site_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb DEFAULT '{}' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
