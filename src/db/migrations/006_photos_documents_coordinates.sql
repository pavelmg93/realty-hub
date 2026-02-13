-- Migration 006: Photos, Documents, and Coordinates
-- Adds lat/lng to parsed_listings, creates listing_photos and listing_documents tables.

-- Add coordinate columns to parsed_listings
ALTER TABLE parsed_listings ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE parsed_listings ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Index for geospatial queries (listings with coordinates)
CREATE INDEX IF NOT EXISTS idx_parsed_coords ON parsed_listings(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Listing photos
CREATE TABLE IF NOT EXISTS listing_photos (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES parsed_listings(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255),
  file_size INTEGER,
  display_order SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_listing ON listing_photos(listing_id);

-- Listing documents
CREATE TABLE IF NOT EXISTS listing_documents (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES parsed_listings(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  category VARCHAR(50) NOT NULL DEFAULT 'other'
    CHECK (category IN (
      'ownership_cert', 'floorplan', 'property_sketch',
      'use_permit', 'construction_permit', 'proposal', 'other'
    )),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_listing ON listing_documents(listing_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON listing_documents(listing_id, category);
