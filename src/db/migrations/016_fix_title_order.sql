-- Migration 016: Fix title_standardized order (price before commission)
-- Old format: "100 7 10 10 hh1 20ty"
-- New format: "100 7 10 10 20ty hh1"
UPDATE parsed_listings
SET title_standardized = regexp_replace(
  title_standardized,
  ' (hh[0-9.]+) ([^ ]+(?:ty|tr))$',
  ' \2 \1'
)
WHERE title_standardized ~ ' hh[0-9.]+ [^ ]+(?:ty|tr)$';
