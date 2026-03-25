# Session 32: UI Polish — Toolbar, Cards, Map Popups
**Date:** 2026-03-25

### Summary
Quick UI fixes session focused on toolbar consistency, card readability, and map popup titles. Grid toggle buttons now stay visible regardless of view mode, 1-wide listing cards use larger fonts and wider photos for better readability, and map popups use the standardized two-line title format (ADR-005). REA-92 (docs cleanup) was already completed in Session 31.

### Technical Details & Fixes
* **Features Delivered:**
  - REA-95: GridToggle always visible in toolbar (feed + listings pages)
  - REA-99: 1-wide cards — photo 33%→40%, title text-sm→text-base, metadata text-xs→text-sm, auto-height instead of fixed 180px, photo count badge added
  - REA-94: Map popups use two-line title (street + title_standardized) with price/area on separate line
  - REA-92: Verified already done in Session 31

* **Architecture/DB Changes:** None — pure frontend changes
* **Challenges Resolved:** None — straightforward UI changes

### Files Touched
- `web/src/app/dashboard/feed/page.tsx` — removed GridToggle conditional
- `web/src/app/dashboard/listings/page.tsx` — removed GridToggle conditional
- `web/src/components/ui/ListingCard.tsx` — 1-wide card: wider photo, larger fonts, auto-height
- `web/src/components/listings/ListingCard.tsx` — 1-wide card: wider photo, spacing improvements
- `web/src/components/map/FeedMap.tsx` — popup uses two-line title (ADR-005), removed getPropertyTypeKey import
- `docs/SCOPE.md` — marked S32 tasks complete
- `docs/CHANGELOG.md` — added S32 entry
