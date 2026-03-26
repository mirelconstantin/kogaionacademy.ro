CREATE TABLE "blog_post" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body" text DEFAULT '' NOT NULL,
	"locale" text DEFAULT 'ro' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"featured_image" text,
	"published_at" timestamp,
	"scheduled_for" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "blog_post_slug_unique" UNIQUE("slug")
);
