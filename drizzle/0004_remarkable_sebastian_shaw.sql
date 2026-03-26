ALTER TABLE "media_asset" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "media_asset" ADD COLUMN "description" text;--> statement-breakpoint
CREATE UNIQUE INDEX "media_asset_url_unique" ON "media_asset" USING btree ("url");