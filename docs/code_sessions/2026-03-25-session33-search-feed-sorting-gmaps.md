# Session 33: Search, Feed Sorting, Google Maps
**Date:** 2026-03-25

### Summary
Database migration session adding full-text search, feed status-based sorting, and Google Maps integration. The search_vector column with GIN index enables fast, diacritics-insensitive search across listing fields. Feed now groups listings by status priority. Google Maps links work bidirectionally — view on Google Maps from listing detail, paste a Google Maps URL to extract coordinates on the form.

### Technical Details & Fixes
* **Features Delivered:**
  - REA-96: Full-text search via tsvector + GIN index (migration 020). `immutable_unaccent()` wrapper function solves PostgreSQL's immutability constraint for generated columns. Listings API upgraded from ILIKE to FTS.
  - REA-98: Feed ORDER BY uses CASE on status: just_listed=1, price changes=2, selling=3, deposit/sold/not_for_sale=4, then user sort.
  - REA-93: "Open in Google Maps" link on detail view. Paste Google Maps URL field on add/edit form with regex extraction for `@lat,lng`, `?q=lat,lng`, `/place/lat,lng`, `ll=lat,lng` formats.

* **Architecture/DB Changes:**
  - Migration 020: `CREATE EXTENSION unaccent`, `CREATE FUNCTION immutable_unaccent()`, `ALTER TABLE parsed_listings ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (...)`, GIN index.
  - Current migration level: 020

* **Challenges Resolved:**
  - PostgreSQL `unaccent()` is not immutable, which blocks GENERATED ALWAYS AS columns. Solution: `immutable_unaccent()` wrapper function marked as IMMUTABLE.

### Files Touched
- `src/db/migrations/020_full_text_search.sql` — new migration
- `web/src/app/api/feed/route.ts` — status-priority ORDER BY
- `web/src/app/api/listings/route.ts` — ILIKE → tsvector search
- `web/src/app/dashboard/listings/[id]/view/page.tsx` — "Open in Google Maps" link
- `web/src/components/listings/DatabaseView.tsx` — Google Maps URL paste field with coordinate extraction
- `web/src/lib/i18n.ts` — new keys: openInGoogleMaps, pasteGoogleMapsLink, coordsExtracted, invalidGoogleMapsLink
- `docs/SCOPE.md` — marked S33 tasks complete
- `docs/CHANGELOG.md` — added S33 entry
