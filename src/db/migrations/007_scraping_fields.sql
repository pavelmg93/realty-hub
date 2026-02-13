-- Migration 007: Scraping provenance and new parsed fields
-- Adds source tracking to raw_listings, road width / frontages / beach distance to parsed_listings.

-- raw_listings: provenance tracking for scraped content
ALTER TABLE raw_listings ADD COLUMN IF NOT EXISTS source_url VARCHAR(500);
ALTER TABLE raw_listings ADD COLUMN IF NOT EXISTS source_listing_id VARCHAR(100);

-- Dedup index: prevent re-importing the same URL
CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_source_url ON raw_listings(source_url)
  WHERE source_url IS NOT NULL;

-- parsed_listings: new extracted fields
ALTER TABLE parsed_listings ADD COLUMN IF NOT EXISTS road_width_m DOUBLE PRECISION;
ALTER TABLE parsed_listings ADD COLUMN IF NOT EXISTS num_frontages SMALLINT;
ALTER TABLE parsed_listings ADD COLUMN IF NOT EXISTS distance_to_beach_m DOUBLE PRECISION;
