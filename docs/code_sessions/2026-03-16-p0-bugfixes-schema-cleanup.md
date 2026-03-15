# Session: P0 Bug Fixes, Schema Cleanup & Deployment Prep
**Date:** 2026-03-16

### Summary
Picked up from Cursor/AntiGravity handoff. The critical blocker was that Add Listing and Edit Listing were crashing with server errors — root cause was `description_vi` and `description_en` ghost columns in the INSERT/UPDATE SQL that don't exist in the database. Fixed both API routes, cleaned up the validation schema and types, dropped the old overlapping status constraint via migration 011, fixed the favorites API to use a simple toggle pattern, filled in missing status enum values across the stack, and prepared a one-command deployment script for GCP VM.

### Technical Details & Fixes
* **Features Delivered:**
  - Add Listing and Edit Listing now work end-to-end (POST + PUT)
  - Favorites toggle API rebuilt as simple POST toggle (no JSON body)
  - All 9 listing statuses (including `in_negotiations`, `pending_closing`) now work across DB, validation, StatusBadge, constants, and i18n
  - GEMINI_API_KEY passthrough added to docker-compose for web container
  - `scripts/deploy-vm.sh` — one-command GCP VM deployment

* **Architecture/DB Changes:**
  - Migration 011: dropped old `ck_parsed_listings_status` constraint (was blocking `just_listed`, `price_dropped`, `price_increased`, `deposit` statuses)
  - Removed `description_vi`/`description_en` from validation schema, TypeScript types, ListingForm, and both API routes (columns never existed in DB — introduced by prior agents)
  - Demo account passwords (pavel/dean) reset to `demo123` via bcryptjs hash

* **Challenges Resolved:**
  - Ghost columns: Cursor/AntiGravity added `description_vi` and `description_en` to the TypeScript layer without creating corresponding DB columns. The INSERT/UPDATE SQL had 47 placeholders but the column list included 2 non-existent columns, causing Postgres errors.
  - Favorites API was expecting `{action: "add"|"remove"}` JSON body but the ListingCard was calling it with a simple POST. Rebuilt as idempotent toggle.

### Files Touched
- `web/src/app/api/listings/route.ts` — removed ghost columns from INSERT
- `web/src/app/api/listings/[id]/route.ts` — removed ghost columns from UPDATE
- `web/src/app/api/listings/[id]/favorite/route.ts` — rebuilt as toggle + GET
- `web/src/lib/validation.ts` — removed description_vi/en, added in_negotiations/pending_closing
- `web/src/lib/types.ts` — removed description_vi/en
- `web/src/lib/constants.ts` — added in_negotiations/pending_closing to LISTING_STATUSES
- `web/src/lib/i18n.ts` — added inNegotiations key (en+vi)
- `web/src/components/listings/ListingForm.tsx` — removed description_vi/en
- `web/src/components/ui/ListingCard.tsx` — simplified favorite toggle call
- `web/src/components/ui/StatusBadge.tsx` — added in_negotiations/pending_closing
- `src/db/migrations/011_drop_old_status_constraint.sql` — new migration
- `docker-compose.yml` — added GEMINI_API_KEY env var
- `scripts/deploy-vm.sh` — new deployment script
- `docs/SCHEMA.md` — updated to migration level 011
- `docs/CHANGELOG.md` — session 15 entry
- `docs/SCOPE.md` — all P0-P5 items checked off
- `CLAUDE.md` — updated migration level, session number, repo structure
