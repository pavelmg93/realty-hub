# Session: Card Redesign, Form Overhaul, Title Fix
**Date:** 2026-03-24

### Summary
Session 26 delivered three major UI features: a new Stitch-style horizontal listing card (1-wide), a full listing form rebuild with correct field ordering and commission radio, and a listing detail title fix (both lines same style, no address_raw). Migration 018 added commission_pct, commission_months, and ward_new columns.

### Technical Details & Fixes
* **Features Delivered:**
  - REA-65: 1-wide horizontal card — `ui/ListingCard` (cols===1) and `listings/ListingCard` (cols===1) render Stitch-style horizontal card: photo w-1/3 with status color strip, right panel with StatusBadge + #id, street, title_standardized (orange), ward, agent, phone, heart
  - REA-66: Listing detail title fix — both title lines use identical `text-2xl sm:text-3xl font-bold text-[var(--text-primary)]`. Line 1 source: `listing.street || ""`; `address_raw` reference removed entirely
  - REA-67: Form rebuild — new field order: Description + AI Parse (top) → Property/Tx/Legal → Price/Area/P/m² (auto-calc) → Commission radio → Street → Ward → Map → Frontage/Depth → Beds/Baths → Floors → Photos → Docs → Extras. `address_raw` hidden from UI, `street` is the visible address field
  - REA-67: AI parse moved into `ListingForm` — both Add and Edit pages share the same description textarea + Parse with AI button at top
  - ADR-005 compliance — all `address_raw` references removed from title/line1 across all cards and feed

* **Architecture/DB Changes:**
  - Migration 018: Added `commission_pct NUMERIC`, `commission_months SMALLINT`, `ward_new VARCHAR(100)` to `parsed_listings`. Address consolidation: copies `address_raw` → `street` where street is empty.
  - `generateCommissionDisplay(pct, months)` added to `constants.ts`

* **Challenges Resolved:**
  - Address display inconsistency: `address_raw` vs `street` — resolved by ADR-005 compliance pass across all card components

### Files Touched
- `src/db/migrations/018_commission_ward_new.sql` (new)
- `web/src/components/ui/ListingCard.tsx` (1-wide horizontal layout)
- `web/src/components/listings/ListingCard.tsx` (1-wide horizontal layout)
- `web/src/app/dashboard/listings/[id]/view/page.tsx` (title fix)
- `web/src/components/listings/ListingForm.tsx` (full rebuild + AI parse)
- `web/src/app/dashboard/listings/new/page.tsx` (simplified, delegates to ListingForm)
- `web/src/lib/constants.ts` (`generateCommissionDisplay`)
