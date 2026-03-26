CREATE TABLE IF NOT EXISTS "program_section" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"section" text NOT NULL,
	"locale" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"payload" jsonb DEFAULT '{}' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_section" ADD CONSTRAINT "program_section_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "program_section_program_section_locale_idx" ON "program_section" USING btree ("program_id","section","locale");
