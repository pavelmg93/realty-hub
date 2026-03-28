# Session 43: Ward Mapping + Layout + Navigation
**Date:** 2026-03-28

### Summary
Overhauled the ward mapping system. "New Ward" is now 4 administrative regions (Nha Trang Ward, Bắc Nha Trang, Tây Nha Trang, Nam Nha Trang) instead of duplicating individual wards. Cascading dropdowns: selecting old ward auto-fills region; selecting region filters old ward list. Vietnamese display names on cards. Also fixed listing detail layout and Profile page titles.

### Technical Details & Fixes
* **Features Delivered:**
  - New Ward dropdown: 4 regions instead of 22 individual wards
  - Old Ward dropdown: filters to region's wards when region is selected, shows Vietnamese names
  - Cascading: old ward → auto-fills region; region → clears old ward, filters old ward list
  - Vietnamese ward names on all listing cards via formatWardDisplay()
  - Create Post button visible to all agents on listing detail (was owner-only)
  - Profile My Listings uses two-line title (street + title_standardized per ADR-005)
  - Consistent pt-4 spacing on listing detail regardless of ownership
  - Edit/Create Post moved below Prev/Next navigation

* **Architecture/DB Changes:**
  - Migration 025: `idx_parsed_ward_new` index
  - Migration 026: Backfill ward_new from individual ward ASCII to region names (13 rows updated)
  - Centralized ward constants: WARD_DISPLAY_NAME, NEW_WARD_OPTIONS (4 regions), REGION_TO_WARDS, WARD_TO_REGION, formatWardDisplay()
  - API `/api/agents/me` returns title_standardized fields for profile listings

* **Challenges Resolved:**
  - First attempt incorrectly used 22 individual wards for New Ward (same as Old Ward). Corrected to 4 regions per spec.
  - TypeScript null safety on SelectField onChange

### Files Touched
- `web/src/lib/constants.ts` — WARD_DISPLAY_NAME, NEW_WARD_OPTIONS (4 regions), REGION_TO_WARDS, WARD_TO_REGION, formatWardDisplay()
- `web/src/components/listings/DatabaseView.tsx` — Cascading ward dropdowns with region filtering
- `web/src/components/feed/FeedFilters.tsx` — Region-first ward filters with cascading
- `web/src/components/ui/ListingCard.tsx` — formatWardDisplay() for Vietnamese names
- `web/src/components/listings/ListingCard.tsx` — formatWardDisplay() for Vietnamese names
- `web/src/app/dashboard/listings/[id]/view/page.tsx` — pt-4 spacing, buttons below nav, Create Post for all
- `web/src/app/dashboard/profile/page.tsx` — Two-line title (ADR-005)
- `web/src/app/api/agents/me/route.ts` — Added title fields to listings query
- `src/db/migrations/025_ward_new_index.sql` — Index on ward_new
- `src/db/migrations/026_ward_new_regions.sql` — Backfill ward_new to region names
- `CLAUDE.md` — Migration level → 026
- `docs/SCOPE.md` — All Session 43 tasks marked complete
- `docs/CHANGELOG.md` — Session 43 entry
