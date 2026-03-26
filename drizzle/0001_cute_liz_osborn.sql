CREATE TABLE "media_asset" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"alt" text,
	"caption" text,
	"type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "program" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"category_id" text NOT NULL,
	"image" text,
	"badge" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"location" text,
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'published' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "program_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "program_locale" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"age_range" text,
	"dates_text" text,
	"duration_text" text,
	"location_text" text
);
--> statement-breakpoint
CREATE TABLE "program_mentor" (
	"program_id" integer NOT NULL,
	"mentor_id" integer NOT NULL,
	CONSTRAINT "program_mentor_program_id_mentor_id_pk" PRIMARY KEY("program_id","mentor_id")
);
--> statement-breakpoint
ALTER TABLE "mentor" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "mentor" ADD COLUMN "status" text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "mentor" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "mentor" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "program_locale" ADD CONSTRAINT "program_locale_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_mentor" ADD CONSTRAINT "program_mentor_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_mentor" ADD CONSTRAINT "program_mentor_mentor_id_mentor_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "program_locale_program_locale_idx" ON "program_locale" USING btree ("program_id","locale");