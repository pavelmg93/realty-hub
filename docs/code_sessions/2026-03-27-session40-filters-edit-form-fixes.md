# Session 40: Filters + Edit Form Fixes
**Date:** 2026-03-27

### Summary
Implemented 6 fixes from REA-111 covering the price filter UX, edit form field ordering, auto-status on price changes, and listing count flicker. The freestyle text price inputs were replaced with a tỷ (billion VND) stepper with 0.01 precision and +/- buttons. The edit form now shows listing status in the Classification section and legal status in Extras. The PUT route auto-detects price increases/decreases and sets status accordingly.

### Technical Details & Fixes
* **Features Delivered:**
  - Price filter replaced with tỷ stepper (PriceStepper component) — up/down buttons, 0.01 tỷ precision, decimal inputMode for mobile
  - Edit form: status moved to Classification row (3rd column), legal status moved to Extras section
  - All 7 listing statuses available in edit form dropdown (was already correct in constants)
  - Server-side auto-set `price_increased`/`price_dropped` when price changes on edit save (only if user didn't manually change status)
  - Listing count line always rendered with stable min-height; shows "— listings" placeholder during loading to prevent layout shift
* **Architecture/DB Changes:** None — all changes are UI and API route logic
* **Challenges Resolved:** Ensured legal_status only appears in Extras for edit mode (not duplicated in new listing form where it stays in Classification)

### Files Touched
- `web/src/components/feed/FeedFilters.tsx` — PriceStepper component, replaced freestyle price inputs
- `web/src/components/listings/DatabaseView.tsx` — moved status to Classification (edit), legal_status to DatabaseExtras (edit)
- `web/src/components/listings/ListingForm.tsx` — pass isEdit to DatabaseExtras
- `web/src/app/api/listings/[id]/route.ts` — auto price_increased/price_dropped logic in PUT
- `web/src/app/dashboard/feed/page.tsx` — stable-height listing count with loading placeholder
- `docs/SCOPE.md` — marked REA-111 complete
