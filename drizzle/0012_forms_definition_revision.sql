CREATE TABLE IF NOT EXISTS "forms_definition_revision" (
	"id" serial PRIMARY KEY NOT NULL,
	"definition_id" integer NOT NULL,
	"schema_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"title" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "forms_def_revision_def_created_idx" ON "forms_definition_revision" ("definition_id","created_at");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forms_definition_revision" ADD CONSTRAINT "forms_definition_revision_definition_id_forms_definition_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."forms_definition"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
