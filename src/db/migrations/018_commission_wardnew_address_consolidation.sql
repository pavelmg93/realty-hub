-- Migration 018: Commission fields, ward_new, address consolidation
-- Adds commission_pct, commission_months, ward_new to parsed_listings
-- Consolidates address_raw → street where street is empty

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parsed_listings' AND column_name = 'commission_pct'
  ) THEN
    ALTER TABLE parsed_listings ADD COLUMN commission_pct NUMERIC;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parsed_listings' AND column_name = 'commission_months'
  ) THEN
    ALTER TABLE parsed_listings ADD COLUMN commission_months SMALLINT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parsed_listings' AND column_name = 'ward_new'
  ) THEN
    ALTER TABLE parsed_listings ADD COLUMN ward_new VARCHAR(100);
  END IF;
END $$;

-- Address consolidation: copy address_raw → street where street is empty
-- Keeps longer string if both exist
UPDATE parsed_listings
SET street = TRIM(address_raw)
WHERE address_raw IS NOT NULL
  AND TRIM(address_raw) != ''
  AND (street IS NULL OR TRIM(street) = '');

-- Backfill commission_pct from existing commission string (e.g. "hh1" → 1)
UPDATE parsed_listings
SET commission_pct = CAST(SUBSTRING(commission FROM 3) AS NUMERIC)
WHERE commission IS NOT NULL
  AND commission ~ '^hh[0-9]+(\.[0-9]+)?$';

-- Backfill commission_months from existing commission string (e.g. "mm2" → 2)
UPDATE parsed_listings
SET commission_months = CAST(SUBSTRING(commission FROM 3) AS SMALLINT)
WHERE commission IS NOT NULL
  AND commission ~ '^mm[0-9]+$';

INSERT INTO schema_migrations (version, description)
VALUES ('018', 'Commission fields, ward_new, address consolidation')
ON CONFLICT (version) DO NOTHING;
