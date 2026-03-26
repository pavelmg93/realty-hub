# Session 37: Critical Bug Fixes
**Date:** 2026-03-26

### Summary
Fixed four critical bugs and UI issues: search flickering/partial matches, screenshot OCR error handling, Google Maps paste not updating the map pin (plus goo.gl short link support), and map popup redesign with dark theme.

### Technical Details & Fixes
* **Features Delivered:**
  - Search fires on Enter only (no more debounce flicker) on both Feed and My Store pages
  - Whole-word tsvector matching (removed `:*` prefix operator) on both API routes
  - Screenshot OCR now has proper error handling with FileReader reject, error logging, and response validation
  - Google Maps URL paste now updates the Leaflet map pin in real-time via `MapUpdater` component + `useEffect` sync
  - goo.gl / maps.app short links resolved server-side via new `/api/resolve-url` endpoint
  - Map popup redesigned: dark theme, photo on top, two-line title, entire popup clickable, no "View Details" link

* **Architecture/DB Changes:**
  - New API route: `/api/resolve-url` — follows redirects for Google Maps short links
  - New CSS file: `map-popup.css` — Leaflet popup dark theme overrides
  - `ListingMap` component now has `MapUpdater` child that calls `map.setView()` on prop changes

* **Challenges Resolved:**
  - Leaflet's `MapContainer` only uses `center` prop on initial render — solved with `useMap()` hook in a child component
  - Search flickering caused by debounced fetch on every keystroke triggering rapid re-renders — solved by separating input state (`searchQuery`) from executed search state (`activeSearch`)

### Files Touched
- `web/src/app/dashboard/feed/page.tsx` — Enter-only search, removed debounce
- `web/src/app/dashboard/listings/page.tsx` — Enter-only search
- `web/src/app/api/feed/route.ts` — Removed `:*` prefix matching
- `web/src/app/api/listings/route.ts` — Removed `:*` prefix matching
- `web/src/components/listings/ListingForm.tsx` — Screenshot OCR error handling
- `web/src/components/listings/DatabaseView.tsx` — goo.gl short link resolution
- `web/src/components/map/ListingMap.tsx` — MapUpdater + useEffect sync
- `web/src/components/map/FeedMap.tsx` — Popup redesign, dark theme CSS import
- `web/src/components/map/map-popup.css` — NEW: Leaflet popup dark theme
- `web/src/app/api/resolve-url/route.ts` — NEW: Short URL resolver
- `docs/SCOPE.md` — Marked S37 tasks complete
- `docs/CHANGELOG.md` — Session 37 entry
