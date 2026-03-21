-- Migration 015: Fix stale title_standardized values
-- Strips m² suffix, strips T suffix from floors, replaces x dimension separator with space.
-- Run: docker exec -i realty-hub-app-postgres-1 psql -U re_nhatrang -d re_nhatrang < src/db/migrations/015_fix_title_standardized.sql

DO $$
BEGIN
  -- Step 1: strip m² suffix from area values (e.g. "100m²" → "100")
  UPDATE parsed_listings
    SET title_standardized = regexp_replace(title_standardized, '(\d+(?:\.\d+)?)m²', '\1', 'g')
    WHERE title_standardized ~ '\d+m²';

  -- Step 2: strip T suffix from floor counts (e.g. "7T " → "7 ")
  UPDATE parsed_listings
    SET title_standardized = regexp_replace(title_standardized, '\b(\d+)T\b', '\1', 'g')
    WHERE title_standardized ~ '\b\d+T\b';

  -- Step 3: replace x dimension separator with space (e.g. "10x15" → "10 15")
  UPDATE parsed_listings
    SET title_standardized = regexp_replace(title_standardized, '(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)', '\1 \2', 'g')
    WHERE title_standardized ~ '\d+x\d+';

  -- Collapse any double spaces introduced by the replacements
  UPDATE parsed_listings
    SET title_standardized = regexp_replace(title_standardized, '\s{2,}', ' ', 'g')
    WHERE title_standardized ~ '\s{2,}';

  RAISE NOTICE 'Migration 015: title_standardized cleanup complete.';
END $$;

INSERT INTO schema_migrations (version) VALUES ('015') ON CONFLICT DO NOTHING;
