CREATE TABLE "contact_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"map_url" text,
	"socials" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "contact_settings_locale_unique" UNIQUE("locale")
);
--> statement-breakpoint
CREATE TABLE "hero_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"locale" text NOT NULL,
	"video_url" text NOT NULL,
	"poster_url" text,
	"cta_primary_label" text,
	"cta_primary_link" text,
	"cta_secondary_label" text,
	"cta_secondary_link" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "hero_settings_locale_unique" UNIQUE("locale")
);
--> statement-breakpoint
CREATE TABLE "mentor" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_ro" text NOT NULL,
	"name_en" text,
	"title_ro" text NOT NULL,
	"title_en" text,
	"bio_ro" text NOT NULL,
	"bio_en" text,
	"image" text,
	"year_joined" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "mentor_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_section" (
	"id" serial PRIMARY KEY NOT NULL,
	"page" text NOT NULL,
	"section" text NOT NULL,
	"locale" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "site_section_page_section_locale_idx" ON "site_section" USING btree ("page","section","locale");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");