# Session: Critical Bug Fixes + Listing Detail Cleanup
**Date:** 2026-03-23

### Summary
Session 25 addressed a set of critical bugs and UX improvements across the listing detail, messaging, feed, and map views. The session also introduced the `regenerate-titles.sh` script, migration 017 (city field), and the feed city selector. Multiple listing detail layout issues were resolved.

### Technical Details & Fixes
* **Features Delivered:**
  - REA-57: `scripts/regenerate-titles.sh` — regenerates all `title_standardized` values via SQL on every deploy. Integrated into `deploy-vm.sh update`.
  - REA-59: Feed header "Listings Feed" + city dropdown (Nha Trang/Hà Nội/TP.HCM/Đà Nẵng) filtering via `?city=`
  - REA-62: CLAUDE.md deployment section updated — documents `deploy-vm.sh update` as single deploy command
  - REA-60: Map height fixed to `calc(100vh - 56px - 60px - 124px)` in Feed and My Listings
  - REA-61: Listing detail layout linearized — removed price block, new section order: title → photos → description → specs → legal → map → documents → agent → messages
  - REA-53: Feed message routing — all message buttons route to `/dashboard/listings/[id]/view?from=feed#messages`
  - REA-54: Conversation scroll fixed — `MessageThread` owns scroll container
  - REA-55: Conversation header redesign — Bar 1 (Agent info) + Bar 2 (Property), archive button removed
  - REA-58: Duplicate photos — "Manage Photos" removed from listing detail view (edit-only)
  - REA-56: Message icon — `Eye` replaced with `MessageSquare` in `ListingCard`

* **Architecture/DB Changes:**
  - Migration 017: Added `city VARCHAR(100) DEFAULT 'Nha Trang'` to `parsed_listings`, backfilled all rows
  - New script: `scripts/regenerate-titles.sh`

* **Challenges Resolved:**
  - Map height overlap with bottom nav — addressed with hardcoded calc (later revisited in S27)
  - Title zombie values in DB — addressed by regenerate-titles script on every deploy

### Files Touched
- `scripts/regenerate-titles.sh` (new)
- `scripts/deploy-vm.sh` (regenerate-titles integration)
- `src/db/migrations/017_city_column.sql` (new)
- `web/src/app/dashboard/feed/page.tsx` (city selector, map height, message routing)
- `web/src/app/dashboard/listings/page.tsx` (map height)
- `web/src/app/dashboard/listings/[id]/view/page.tsx` (layout linearized)
- `web/src/components/messages/MessageThread.tsx` (scroll fix)
- `web/src/components/listings/ListingCard.tsx` (message icon)
- `CLAUDE.md` (deployment section)
