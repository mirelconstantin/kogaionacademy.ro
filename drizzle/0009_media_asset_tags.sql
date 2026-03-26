-- Add tags to media_asset for organization and filtering
ALTER TABLE "media_asset" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb;
