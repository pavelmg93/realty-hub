-- Migration 013: Primary photo flag + full-text search
-- Run after 012_reduce_status_enum.sql

-- 1. Primary photo flag + thumbnail path on listing_photos
ALTER TABLE listing_photos
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE listing_photos
  ADD COLUMN IF NOT EXISTS thumb_path TEXT;

-- At most one primary per listing (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_photos_primary
  ON listing_photos (listing_id)
  WHERE is_primary = TRUE;

-- 2. Full-text search on parsed_listings
CREATE EXTENSION IF NOT EXISTS unaccent;

-- tsvector generated column (GIN-indexed) combining key text fields
ALTER TABLE parsed_listings
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      unaccent(coalesce(address_raw, '')) || ' ' ||
      unaccent(coalesce(ward, '')) || ' ' ||
      unaccent(coalesce(street, '')) || ' ' ||
      unaccent(coalesce(district, '')) || ' ' ||
      unaccent(coalesce(description, ''))
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_parsed_listings_fts
  ON parsed_listings USING GIN (search_vector);
