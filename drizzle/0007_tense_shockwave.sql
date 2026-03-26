CREATE TABLE "permission" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"group" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "role_permission" (
	"role" text NOT NULL,
	"permission_key" text NOT NULL,
	CONSTRAINT "role_permission_role_permission_key_pk" PRIMARY KEY("role","permission_key")
);
--> statement-breakpoint
CREATE TABLE "user_permission_override" (
	"user_id" text NOT NULL,
	"permission_key" text NOT NULL,
	"mode" text NOT NULL,
	CONSTRAINT "user_permission_override_user_id_permission_key_pk" PRIMARY KEY("user_id","permission_key")
);
--> statement-breakpoint
CREATE TABLE "admin_invite" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"overrides_json" text,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"invited_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	CONSTRAINT "admin_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_key_permission_key_fk" FOREIGN KEY ("permission_key") REFERENCES "public"."permission"("key") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_permission_override" ADD CONSTRAINT "user_permission_override_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_permission_override" ADD CONSTRAINT "user_permission_override_permission_key_permission_key_fk" FOREIGN KEY ("permission_key") REFERENCES "public"."permission"("key") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "admin_invite" ADD CONSTRAINT "admin_invite_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
