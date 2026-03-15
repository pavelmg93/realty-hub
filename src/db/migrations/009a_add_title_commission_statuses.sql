-- Migration 009: Add title_standardized, commission, and new statuses

ALTER TABLE parsed_listings
ADD COLUMN IF NOT EXISTS title_standardized VARCHAR(500),
ADD COLUMN IF NOT EXISTS commission VARCHAR(50) DEFAULT 'hh1';

-- Update the status check constraint
ALTER TABLE parsed_listings DROP CONSTRAINT IF EXISTS parsed_listings_status_check;

ALTER TABLE parsed_listings ADD CONSTRAINT parsed_listings_status_check 
CHECK (status IN ('just_listed', 'for_sale', 'price_dropped', 'price_increased', 'in_negotiations', 'deposit', 'pending_closing', 'sold', 'not_for_sale'));

CREATE TABLE IF NOT EXISTS listing_favorites (
    agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    listing_id INTEGER NOT NULL REFERENCES parsed_listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (agent_id, listing_id)
);
