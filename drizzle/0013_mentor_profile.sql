-- Structured mentor profile, for the mentors page card + modal.
--
-- Romanian only: the source content is Romanian and the live site has no English
-- version, so the read path falls back to these columns for the `en` locale exactly
-- like `nameEn ?? nameRo` already does. English variants can be added later without
-- a rewrite if translated copy ever appears.
--
-- Column meanings follow the client's spec (meeting notes 21/09/2026):
--   role_ro        - "Rol / categorie în Kogaion"
--   short_bio_ro   - card teaser, ~25-40 words
--   about_ro       - "Despre [Nume]", ~80-120 words (professional background)
--   kogaion_ro     - "În Kogaion", ~60-100 words (what they do at Kogaion)
--   voice_quote_ro - "Vocea mentorului", ~25-60 words, first person
--   expertise_ro   - "Domenii de expertiză", 3-6 tags
ALTER TABLE "mentor" ADD COLUMN "role_ro" text;
--> statement-breakpoint
ALTER TABLE "mentor" ADD COLUMN "short_bio_ro" text;
--> statement-breakpoint
ALTER TABLE "mentor" ADD COLUMN "about_ro" text;
--> statement-breakpoint
ALTER TABLE "mentor" ADD COLUMN "kogaion_ro" text;
--> statement-breakpoint
ALTER TABLE "mentor" ADD COLUMN "voice_quote_ro" text;
--> statement-breakpoint
ALTER TABLE "mentor" ADD COLUMN "expertise_ro" text[] DEFAULT '{}'::text[];
--> statement-breakpoint
-- The Bucharest premises (Șoseaua Nordului nr. 94F) has closed, so the office address is
-- gone. It was NOT NULL, which would have forced a placeholder value to stay in place.
ALTER TABLE "contact_settings" ALTER COLUMN "address" DROP NOT NULL;

