# Session: Bug Fixes + UI Polish for Pilot
**Date:** 2026-03-21

### Summary
Session 21 focused on fixing pilot-blocking bugs and polishing the UI across all 8 items from SCOPE.md. All tasks completed in one session. The core theme: making the app feel production-ready for the 10-user FIDT pilot on Mar 23. No schema changes, no migrations — pure UI/UX and logic fixes.

### Technical Details & Fixes

* **Features Delivered:**
  - Feed "View Messages" button now works for listing owners (navigates to `/dashboard/messages` when no direct conversation exists)
  - AI parse no longer shows confusing follow-up question UI — fields populate silently
  - Listing detail view shows the two-line standardized title (address + specs) matching Feed/My Listings cards
  - Standardized title spec format changed: `100 7 10x10 hh1 20ty` (no `m²`/`T` suffixes)
  - Card titles scale by grid density: `text-sm` (3-wide), `text-base` (2-wide), `text-xl` (1-wide)
  - Listing detail margins: `px-4 sm:px-6` added — no more edge-to-edge text
  - Filter dropdowns in Feed now display in active language (Vietnamese/English) using `FIELD_VALUE_LABELS`
  - Zalo share text uses Vietnamese labels for property/transaction type
  - "Copy văn bản" button label moved to i18n (`copyText` key)
  - Gemini system prompt improved with explicit field extraction rules for `address_raw`, `legal_status`, `access_road`, `structure_type`
  - Mock parser improved: extracts legal status, access road, structure type, assembles `address_raw`

* **Architecture/DB Changes:** None — no migrations, no schema changes

* **Challenges Resolved:**
  - FeedFilters was importing English-only constants (`PROPERTY_TYPES`, `LISTING_STATUSES`, etc.) — replaced with `FIELD_VALUE_LABELS` using a `toOptions(field)` helper that reads the active lang
  - Zalo share text was building English property labels — fixed by calling `getFieldValueLabel("property_type", ..., "vi")`
  - TypeScript: all changes compile clean (`npx tsc --noEmit` exit code 0)

### Files Touched
- `web/src/app/dashboard/feed/page.tsx` — REA-30: onViewMessages fallback
- `web/src/app/dashboard/listings/new/page.tsx` — REA-28: removed follow-up question UI + state
- `web/src/app/dashboard/listings/[id]/view/page.tsx` — REA-29, REA-31, REA-16: title, share text, margins
- `web/src/components/ui/ListingCard.tsx` — REA-29: responsive font scaling
- `web/src/components/feed/FeedFilters.tsx` — REA-15: translated filter options
- `web/src/lib/constants.ts` — REA-29: `generateTitleStandardized()` format change
- `web/src/lib/i18n.ts` — REA-31: `copyText` key added
- `web/src/app/api/ai/parse-listing/route.ts` — REA-11: system prompt + mock parser improvements
- `docs/SCOPE.md` — all 8 tasks marked complete
- `docs/CHANGELOG.md` — Session 21 entry
