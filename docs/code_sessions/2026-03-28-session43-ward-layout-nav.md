# Session 43: Ward Mapping + Layout + Navigation
**Date:** 2026-03-28

### Summary
Overhauled the ward mapping system to centralize all ward data, add cascading dropdown behavior between old and new wards, display Vietnamese names on cards, and add a missing database index. Also fixed listing detail page layout: consistent top spacing regardless of ownership, repositioned Edit/Create Post buttons below Prev/Next navigation, and updated Profile page listing titles to follow ADR-005 two-line format.

### Technical Details & Fixes
* **Features Delivered:**
  - Ward cascading: selecting old ward auto-fills new ward (and vice versa for 1:1 wards); merged wards clear old ward since multiple map to one
  - Vietnamese ward names on all listing cards and share text (was showing ASCII)
  - FeedFilters now includes all 22 post-merger wards (Vinh Thai, Phuoc Dong were missing)
  - Create Post button visible to all agents on listing detail (was owner-only)
  - Profile My Listings uses two-line title (street + title_standardized)

* **Architecture/DB Changes:**
  - Migration 025: `idx_parsed_ward_new` on parsed_listings
  - Centralized ward constants: WARD_DISPLAY_NAME, NEW_WARD_OPTIONS, OLD_TO_NEW_WARD, NEW_TO_OLD_WARDS, formatWardDisplay() — all in constants.ts
  - Removed duplicated NEW_WARD_OPTIONS from DatabaseView.tsx and FeedFilters.tsx
  - API `/api/agents/me` now returns title_standardized and related fields for profile listings

* **Challenges Resolved:**
  - TypeScript null safety: SelectField onChange can return null, needed guards before indexing ward maps

### Files Touched
- `web/src/lib/constants.ts` — Added WARD_DISPLAY_NAME, NEW_WARD_OPTIONS, OLD_TO_NEW_WARD, NEW_TO_OLD_WARDS, formatWardDisplay()
- `web/src/components/listings/DatabaseView.tsx` — Removed local NEW_WARD_OPTIONS, added cascading ward onChange
- `web/src/components/feed/FeedFilters.tsx` — Removed local NEW_WARD_OPTIONS, added cascading ward onChange
- `web/src/components/ui/ListingCard.tsx` — Vietnamese ward display via formatWardDisplay()
- `web/src/components/listings/ListingCard.tsx` — Vietnamese ward display via formatWardDisplay()
- `web/src/app/dashboard/listings/[id]/view/page.tsx` — pt-4 spacing, moved action buttons below nav, Create Post for all agents, Vietnamese ward in share text
- `web/src/app/dashboard/profile/page.tsx` — Two-line title (ADR-005), updated listing type
- `web/src/app/api/agents/me/route.ts` — Added title fields to listings query
- `src/db/migrations/025_ward_new_index.sql` — Index on ward_new
- `CLAUDE.md` — Migration level 024→025
- `docs/SCOPE.md` — Tasks marked complete
- `docs/CHANGELOG.md` — Session 43 entry
