#!/bin/bash
# scripts/regenerate-titles.sh — Regenerate all title_standardized values in parsed_listings
#
# Replicates generateTitleStandardized() from web/src/lib/constants.ts using SQL.
# Formula: "<area> <floors> <frontage> <depth> <price> <commission>"
# - NO suffixes (m², T, x), NO ward, NO address, NO property type
# - Null fields omitted silently
# - Price: >= 1B → "Xty", >= 1M → "Xtr" (2 decimal max, trailing zeros stripped)
#
# Usage:
#   ./scripts/regenerate-titles.sh          # uses docker compose
#   PSQL_CMD="psql -U re_nhatrang" ./scripts/regenerate-titles.sh  # custom psql

set -e

PSQL_CMD="${PSQL_CMD:-docker compose exec -T app-postgres psql -U re_nhatrang -d re_nhatrang}"

echo ">>> Regenerating title_standardized for all parsed_listings..."

$PSQL_CMD <<'SQL'
UPDATE parsed_listings SET title_standardized =
  CONCAT_WS(' ',
    CASE WHEN area_m2     IS NOT NULL THEN area_m2::text     END,
    CASE WHEN num_floors  IS NOT NULL THEN num_floors::text   END,
    CASE
      WHEN frontage_m IS NOT NULL OR depth_m IS NOT NULL THEN
        TRIM(CONCAT_WS(' ',
          CASE WHEN frontage_m IS NOT NULL THEN frontage_m::text END,
          CASE WHEN depth_m    IS NOT NULL THEN depth_m::text    END
        ))
      ELSE NULL
    END,
    CASE
      WHEN price_vnd IS NOT NULL AND price_vnd >= 1000000000 THEN
        CONCAT(TO_CHAR(price_vnd / 1000000000.0, 'FM99999999.99'), 'ty')
      WHEN price_vnd IS NOT NULL AND price_vnd >= 1000000 THEN
        CONCAT(TO_CHAR(price_vnd / 1000000.0, 'FM99999999.99'), 'tr')
      ELSE NULL
    END,
    COALESCE(commission, 'hh1')
  );
SELECT COUNT(*) AS updated FROM parsed_listings;
SQL

echo ">>> title_standardized regeneration complete."
echo ">>> Verify: no m² or ward names remain:"
$PSQL_CMD -c "SELECT COUNT(*) AS bad_rows FROM parsed_listings WHERE title_standardized LIKE '%m²%' OR title_standardized LIKE '%Loc Tho%' OR title_standardized LIKE '%Vinh%' OR title_standardized LIKE '%Phuoc%';"
