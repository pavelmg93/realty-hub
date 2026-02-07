-- Migration: Add listing_hash and message_date to parsed_listings
-- For dev environments, prefer: docker compose down -v && docker compose up -d
-- For existing data, run this migration manually.

ALTER TABLE parsed_listings
    ADD COLUMN IF NOT EXISTS listing_hash CHAR(32),
    ADD COLUMN IF NOT EXISTS message_date TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_parsed_listing_hash ON parsed_listings(listing_hash);
