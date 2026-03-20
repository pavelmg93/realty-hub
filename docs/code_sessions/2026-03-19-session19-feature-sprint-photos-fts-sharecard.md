# Session: Feature Sprint — Photos, FTS, Share Card, UX
**Date:** 2026-03-19

### Summary
Second session of the day (following Session 18's infrastructure hardening). The goal was to deliver the pilot launch feature set from SCOPE.md: photo pipeline improvements, full-text search on the feed, a share card generator, and UX polish. All seven Linear issues in scope were completed: REA-9 (photo validation/HEIC/thumbnails), REA-10 (primary photo selection), REA-11 (Gemini Vietnamese prompts), REA-13 (feed FTS), REA-14 (share card), REA-15 (i18n keys), and REA-17 (skeletons + empty states). Migration 013 was applied to support the new DB columns and FTS index.

### Technical Details & Fixes
* **Features Delivered:**
  - REA-9: Photo upload now enforces a 10MB limit with client-side feedback. HEIC/HEIF files are converted to JPEG via `sharp`. 400px thumbnails (`thumb_<file>`) generated on upload. DELETE endpoint removes files from disk. Previously the limit was 20MB with no conversion.
  - REA-10: Star icon in PhotoUploader lets agents set a primary photo. Feed and My Listings cards prefer `is_primary=TRUE` when selecting which photo to display. First uploaded photo is auto-set as primary.
  - REA-11: Gemini system prompt fully rewritten in Vietnamese. Now handles abbreviated prices (e.g. "3.5 tỷ"), compass directions, Vietnamese property terms (nở hậu), and multiple contact entries. Added 30s timeout with 1 retry before falling back to the regex parser.
  - REA-13: Full-text search on the listing feed. Search bar with 300ms debounce, result count display, and clear button. API accepts `?q=<term>` with prefix matching via tsvector.
  - REA-14: "Create Post" share card generates real Vietnamese listing text. Toggle between Zalo and Facebook format. One-click clipboard copy.
  - REA-15: Added 10 missing i18n keys (searchListings, shareText, setPrimary, photo error messages, empty state strings) in both `en` and `vi`.
  - REA-17: Skeleton loaders on Feed (4 cards), My Listings (4 cards), Messages (3 rows). Empty states with CTAs for all three pages.

* **Architecture/DB Changes:**
  - Migration 013 applied: added `is_primary BOOLEAN` and `thumb_path TEXT` columns to `listing_photos`; added `search_vector TSVECTOR` column with a GIN index to `parsed_listings`; enabled the `unaccent` PostgreSQL extension for accent-insensitive search.
  - SCHEMA.md updated to reflect `listing_photos` changes.
  - Upload route size limit changed from 20MB to 10MB.

* **Challenges Resolved:**
  - Gemini prompt quality was poor for Vietnamese listings with abbreviated prices and local terminology. Rewriting the prompt entirely in Vietnamese (rather than English with Vietnamese examples) significantly improved parse accuracy.
  - HEIC uploads from iPhone users were failing silently. Added `sharp` HEIC→JPEG conversion in the upload route before saving to disk, so the stored file is always a valid JPEG regardless of input format.

### Files Touched
- `src/db/migrations/013_fts_primary_photo.sql` — new migration
- `web/src/app/api/listings/[id]/photos/route.ts` — upload size limit, sharp conversion, thumbnail generation, DELETE disk cleanup
- `web/src/app/api/listings/route.ts` — FTS query (`?q=`), primary photo subquery
- `web/src/app/api/ai/parse-listing/route.ts` — Vietnamese Gemini prompt, 30s timeout, retry + fallback
- `web/src/components/PhotoUploader.tsx` — star icon for primary, client-side validation feedback, staged photo handling
- `web/src/components/ShareCard.tsx` — new component, Zalo/Facebook format toggle, clipboard copy
- `web/src/app/(app)/feed/page.tsx` — search bar, debounce, result count, skeleton loaders, empty state
- `web/src/app/(app)/listings/page.tsx` — skeleton loaders, empty state
- `web/src/app/(app)/messages/page.tsx` — skeleton loaders, empty state
- `web/src/lib/i18n.ts` — 10 new keys (en + vi)
- `docs/SCHEMA.md` — listing_photos table updated
- `docs/CHANGELOG.md` — Session 19 entry added
