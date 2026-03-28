-- Migration 025: Add index on parsed_listings.ward_new for filter performance
-- ward_new is used in feed filtering but had no index (ward has idx_parsed_ward)

CREATE INDEX IF NOT EXISTS idx_parsed_ward_new ON parsed_listings(ward_new);
