ALTER TABLE "blog_post" ADD COLUMN "deleted_at" timestamp;
--> statement-breakpoint
ALTER TABLE "blog_post" ADD COLUMN "deleted_by" text;
