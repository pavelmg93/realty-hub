-- Migration 012: Reduce status enum to 7 values
-- Remove in_negotiations and pending_closing

-- Migrate existing rows first
UPDATE parsed_listings SET status = 'for_sale'
  WHERE status IN ('in_negotiations', 'pending_closing');

-- Drop old constraint and create new one with 7 values
ALTER TABLE parsed_listings DROP CONSTRAINT IF EXISTS parsed_listings_status_check;

ALTER TABLE parsed_listings ADD CONSTRAINT parsed_listings_status_check
  CHECK (status IN (
    'just_listed', 'for_sale', 'price_dropped', 'price_increased',
    'deposit', 'sold', 'not_for_sale'
  ));
