-- Migration 010: Agent avatar URL + listing descriptions (VN/EN) for i18n
-- Run: docker exec -i realty-hub-app-postgres-1 psql -U re_nhatrang -d re_nhatrang < src/db/migrations/010_avatar_listing_i18n.sql

-- Agent avatar: store path under uploads/avatars/ (e.g. avatars/123.jpg)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512);

-- Listing descriptions per language (auto-translate on create, editable independently)
ALTER TABLE parsed_listings ADD COLUMN IF NOT EXISTS description_vi TEXT;
ALTER TABLE parsed_listings ADD COLUMN IF NOT EXISTS description_en TEXT;
-- Backfill: copy existing description to description_vi so existing listings have one language
UPDATE parsed_listings SET description_vi = description WHERE description_vi IS NULL AND description IS NOT NULL;
