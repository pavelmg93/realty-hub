# Session: 42z — Card Layout, Filter Reorg, DOB Year
**Date:** 2026-03-28

### Summary
Ad-hoc session (not in SCOPE.md, no Linear sync). Four tasks: restructured listing card info blocks to show phone number on a separate line below agent name, added comma-decimal support to price filter inputs, added DOB Year field to agent profile with display on listing cards via AgentChip, and reorganized the filter panel — removed min bathrooms/max area/status, promoted Property Type + Transaction Type to top, grouped extras in compact two-row layout.

### Technical Details & Fixes
* **Features Delivered:**
  - Phone number + icon displayed below agent avatar/name on both 1-wide and 2-wide listing cards (ui/ListingCard + listings/ListingCard)
  - Price filter inputs accept both '.' and ',' as decimal separators; comma normalized to period on blur/Enter
  - DOB Year field on profile page (auto-saves on blur via PUT /api/agents/me); year appended to agent name on listing cards via AgentChip
  - Filter panel reorganized: Property Type + Transaction Type at top, min beds + min area row, extras in two rows of 4 columns, checkboxes in flex-wrap row
* **Architecture/DB Changes:**
  - Migration 024: `ALTER TABLE agents ADD COLUMN IF NOT EXISTS dob_year smallint`
  - `owner_dob_year` added to feed, listings, and listing detail API SQL queries
  - PUT handler added to /api/agents/me for profile field updates
* **Challenges Resolved:**
  - Removed unused `statusOptions` variable after status filter removal to keep tsc clean

### Files Touched
- `web/src/components/ui/ListingCard.tsx` — two-row agent info block (1-wide + 2-wide)
- `web/src/components/listings/ListingCard.tsx` — same layout change for owner cards
- `web/src/components/ui/AgentChip.tsx` — dob_year display in name
- `web/src/components/feed/FeedFilters.tsx` — comma decimal, filter reorg, removed unused statusOptions
- `web/src/app/dashboard/profile/page.tsx` — DOB Year input section
- `web/src/app/api/agents/me/route.ts` — PUT handler, dob_year in SELECT
- `web/src/app/api/feed/route.ts` — owner_dob_year in SQL
- `web/src/app/api/listings/route.ts` — owner_dob_year in SQL
- `web/src/app/api/listings/[id]/route.ts` — owner_dob_year in SQL
- `web/src/lib/types.ts` — owner_dob_year field
- `web/src/lib/i18n.ts` — price label "(tỷ)" suffix
- `src/db/migrations/024_dob_year.sql` — new migration
- `docs/SCHEMA.md` — dob_year column
- `CLAUDE.md` — migration level 017→024
