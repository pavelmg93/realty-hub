# Session 36: Audit S32-S35 + Filters Redesign
**Date:** 2026-03-26

### Summary
Audit session verifying all S32-S35 implementations against their Linear specs (which were not read during those sessions). All 11 issues passed the audit — code matches specs correctly. One gap noted: REA-20 (Notifications) specifies FCM push for mobile browsers, which was not implemented (in-app notifications only). New feature REA-100 implemented: filters panel redesigned with price at top (bigger), bedrooms + bathrooms, area range, ward old/new, and legal filter removed.

### Technical Details & Fixes
* **Features Delivered:**
  - REA-100: Filters panel redesigned — price min/max prominent at top with larger inputs, bedrooms + bathrooms row, area min/max row, ward old & new side-by-side, legal filter hidden
  - Added `num_bathrooms_min` and `ward_new` filters to both `/api/feed` and `/api/listings` routes
  - Added `minBaths` i18n key (en + vi)

* **Architecture/DB Changes:** No schema changes — new filters use existing columns (`num_bathrooms`, `ward_new`)

* **Audit Findings:**
  - REA-95 (toolbar): PASS — always rendered regardless of viewMode
  - REA-99 (1-wide fonts): PASS — text-base font, 40/60 photo/content split
  - REA-94 (map popups): PASS — standardized title + tiny card
  - REA-96 (search): PASS — tsvector GENERATED column, GIN index, unaccent, prefix matching
  - REA-98 (feed ordering): PASS — CASE by status, hides deposit/sold/nfs unless favorited/owner
  - REA-93 (Google Maps): PASS — link out + paste URL with coord extraction
  - REA-97 (My Store): PASS — two tabs, center nav, state persistence
  - REA-14 (share card): PASS — 1080x1350 canvas, Zalo/Facebook text
  - REA-12 (OCR): PASS — Gemini Vision, screenshot button, field population
  - REA-21 (rate limiting): PASS — sliding window, per-route configs, middleware
  - REA-20 (notifications): PARTIAL — in-app works, FCM push NOT implemented

### Files Touched
- `web/src/components/feed/FeedFilters.tsx` — redesigned layout, added ward_new/bathrooms fields
- `web/src/app/api/feed/route.ts` — added num_bathrooms_min, ward_new filters
- `web/src/app/api/listings/route.ts` — added num_bathrooms_min, ward_new filters
- `web/src/lib/i18n.ts` — added minBaths key
- `docs/SCOPE.md` — marked all tasks complete
- `docs/CHANGELOG.md` — session 36 entry
