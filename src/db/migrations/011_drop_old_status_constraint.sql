-- Migration 011: Drop the old overlapping status constraint
-- The old ck_parsed_listings_status is missing just_listed, price_dropped, price_increased, deposit
-- The newer parsed_listings_status_check is the authoritative one

ALTER TABLE parsed_listings DROP CONSTRAINT IF EXISTS ck_parsed_listings_status;
