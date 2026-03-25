-- Migration 020: Full-text search on parsed_listings
-- Adds search_vector generated column + GIN index + unaccent extension

-- Enable unaccent for Vietnamese diacritics handling
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Immutable wrapper for unaccent (required for GENERATED columns)
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
  SELECT unaccent($1);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- tsvector generated column combining key searchable fields
ALTER TABLE parsed_listings
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      immutable_unaccent(coalesce(address_raw, '')) || ' ' ||
      immutable_unaccent(coalesce(ward, '')) || ' ' ||
      immutable_unaccent(coalesce(street, '')) || ' ' ||
      immutable_unaccent(coalesce(district, '')) || ' ' ||
      immutable_unaccent(coalesce(description, '')) || ' ' ||
      immutable_unaccent(coalesce(title_standardized, '')) || ' ' ||
      immutable_unaccent(coalesce(property_type, ''))
    )
  ) STORED;

-- GIN index for fast full-text queries
CREATE INDEX IF NOT EXISTS idx_parsed_listings_fts
  ON parsed_listings USING GIN (search_vector);

-- Track migration
INSERT INTO schema_migrations (version, description)
VALUES ('020_full_text_search', 'Full-text search tsvector + GIN index')
ON CONFLICT DO NOTHING;
