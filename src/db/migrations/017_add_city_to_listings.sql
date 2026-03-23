-- Migration 017: Add city column to parsed_listings
-- Backfill all existing rows with 'Nha Trang'

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parsed_listings' AND column_name = 'city'
  ) THEN
    ALTER TABLE parsed_listings ADD COLUMN city VARCHAR(100) DEFAULT 'Nha Trang';
  END IF;
END $$;

UPDATE parsed_listings SET city = 'Nha Trang' WHERE city IS NULL;

INSERT INTO schema_migrations (version, description)
VALUES ('017', 'Add city column to parsed_listings')
ON CONFLICT (version) DO NOTHING;
