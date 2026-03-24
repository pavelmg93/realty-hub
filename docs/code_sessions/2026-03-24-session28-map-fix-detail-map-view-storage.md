# Session: Map Mode Fix (5th Attempt), Detail Map Overlap, Separate View Storage
**Date:** 2026-03-24

### Summary
Fifth attempt at fixing map mode in feed and listings pages. This time followed the escalation protocol: ran both required grep commands, traced the actual rendered JSX in both pages, posted full pre-code audit to REA-79 on Linear, then fixed all four confirmed problems. Also fixed the listing detail Leaflet map overlapping the FIDT header (REA-80) and split localStorage keys so feed and listings have independent view mode storage (REA-81).

### Technical Details & Fixes
* **Features Delivered:**
  - Map mode now constrained to `max-w-3xl mx-auto px-4 sm:px-6` — matches grid width on all screen sizes
  - Header ("Listings Feed" / "My Listings" + city selector / Add button) always visible in map mode
  - `MAP_HEIGHT` updated to `min(calc(100dvh - 176px), 500px)` — uses `dvh` for mobile browser chrome, capped at 500px on desktop
  - Listing detail map wrapper gets `overflow-hidden rounded-lg z-0` to prevent Leaflet bleed over sticky header
  - Feed uses `realtyhub_feed_view_mode` localStorage key; Listings uses `realtyhub_listings_view_mode`

* **Architecture/DB Changes:** None.

* **Challenges Resolved:**
  - Root cause of all prior attempts: the outer wrapper div used `viewMode === "map" ? "" : "px-4 sm:px-6 py-4 max-w-3xl mx-auto"` — the empty string meant the map had zero width constraints. Fix was to always apply `px-4 sm:px-6 max-w-3xl mx-auto` and only conditionally add `py-4` for grid mode.
  - Header was behind `{viewMode !== "map" && ...}` — removed the guard entirely.
  - Toolbar had redundant `px-4 sm:px-6` in map mode (now handled by outer div).

### Files Touched
- `web/src/lib/layout-constants.ts` — MAP_HEIGHT: `100vh` → `min(calc(100dvh - 176px), 500px)`
- `web/src/app/dashboard/feed/page.tsx` — outer div always padded/centered; header always visible; toolbar simplified; localStorage key `realtyhub_feed_view_mode`
- `web/src/app/dashboard/listings/page.tsx` — same changes; localStorage key `realtyhub_listings_view_mode`
- `web/src/app/dashboard/listings/[id]/view/page.tsx` — map wrapper: `overflow-hidden rounded-lg z-0`
