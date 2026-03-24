# Session: Visual Regressions + Navigation Cleanup + Archive Removal

**Date:** 2026-03-24

### Summary

Session 27b tackled four UI issues from the Stabilization sprint. REA-70 was already done from S27. Completed REA-74 (archive removal), REA-78 (card/detail visual fixes), and REA-77 (back button removal, localStorage view persistence, filter toolbar fix in map mode).

### Technical Details & Fixes

* **Features Delivered:**
  - Archive button gone from listing detail action bar and card action rows — archive API/DB untouched
  - 1-wide card: StatusBadge removed from info column (corner flag on photo is sole status indicator); title lines upgraded to `text-base`; metadata (ward/agent/phone) upgraded to `text-sm`
  - Messages page: property types now render translated labels (`nha_rieng` → "Nhà riêng") via `getFieldValueLabel` instead of incomplete `getPropertyTypeKey` lookup map
  - Edit listing page: `px-4 sm:px-6` added — fixes missing mobile margin
  - Back/ArrowLeft removed globally from TopBar; "Back" button removed from listing detail header — browser back is the sole back navigation
  - View mode (grid/map + 1/2-wide cols) now persists across navigation via `realtyhub_view_mode` localStorage key; both feed and listings pages read on mount and write on change
  - Filter button and filters panel now visible in map mode on both feed and listings pages

* **Architecture/DB Changes:** None — no schema or API changes.

* **Challenges Resolved:**
  - `getPropertyTypeKey` in i18n.ts was missing `nha_rieng`, `nha_pho`, `villa` — switched the messages page to `getFieldValueLabel` which uses `FIELD_VALUE_LABELS` (already complete) instead of patching the incomplete lookup map.

### Files Touched

- `web/src/components/ui/TopBar.tsx` — removed ArrowLeft/back button rendering
- `web/src/components/listings/ListingCard.tsx` — removed `onArchive` prop, removed StatusBadge from 1-wide card, increased font sizes
- `web/src/app/dashboard/listings/[id]/view/page.tsx` — removed Archive button and Back button
- `web/src/app/dashboard/listings/[id]/edit/page.tsx` — added `px-4 sm:px-6`
- `web/src/app/dashboard/listings/page.tsx` — removed `handleArchive`/`onArchive`, added localStorage persistence, Filter always visible
- `web/src/app/dashboard/feed/page.tsx` — added localStorage persistence, Filter always visible
- `web/src/app/dashboard/messages/page.tsx` — switched to `getFieldValueLabel` for property type display
