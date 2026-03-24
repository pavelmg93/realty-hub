-- Rename for_sale → selling in status enum and update existing rows
ALTER TABLE parsed_listings DROP CONSTRAINT IF EXISTS parsed_listings_status_check;
UPDATE parsed_listings SET status = 'selling' WHERE status = 'for_sale';
ALTER TABLE parsed_listings ADD CONSTRAINT parsed_listings_status_check
  CHECK (status IN ('just_listed', 'selling', 'price_dropped', 'price_increased', 'deposit', 'sold', 'not_for_sale'));
