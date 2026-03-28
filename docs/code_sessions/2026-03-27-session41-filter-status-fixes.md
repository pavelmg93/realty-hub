# Session 41: Filter UX + Status Fixes
**Date:** 2026-03-27

### Summary
Fixed all 5 pilot-blocker issues from the SCOPE.md session 41 task list. Major focus was the filter UX overhaul (11 sub-items in REA-112), including a rewritten PriceStepper that supports decimal input, back-button filter state preservation, and orange active-filter indicators. Also cleaned up the edit form status dropdown, removed all ghost back arrows from the app, audited ALL CAPS title rendering, and replaced /dashboard/listings list-route links with My Store equivalents.

### Technical Details & Fixes
* **Features Delivered:**
  - PriceStepper rewritten with local text state (syncs on blur/Enter) to fix decimal input on mobile/desktop
  - Stepper increment changed from 0.01 tỷ to 1.0 tỷ; "tỷ" moved to label text
  - Select-all on focus for easy value replacement
  - Filter panel collapses on Apply click via new `onCollapse` prop
  - Orange border + count badge on Filter button when filters are active (panel closed)
  - Filters + search query preserved in sessionStorage for back-button restoration (Feed + Store)
  - Listing count ("X listings") now visible in map view (Feed + Store)
  - Consistent toolbar spacing in map vs grid mode
  - Edit form status dropdown hides system-only statuses (just_listed, price_increased, price_dropped)
  - Description textarea doubled from 5 to 10 rows
  - All ghost back arrows removed (TopBar, agents page, CRM person page, listing view error state)
  - All `/dashboard/listings` list-route links replaced with `/dashboard/store`; `from=listings` → `from=store`

* **Architecture/DB Changes:** None (no migrations)

* **Challenges Resolved:**
  - PriceStepper controlled input was reformatting on every keystroke, preventing decimal point entry. Fixed by using local uncontrolled text state that only commits to parent on blur/Enter.
  - REA-132 (ALL CAPS titles) — audit showed `generateTitleStandardized()` and `regenerate-titles.sh` already produce numeric-only output with no uppercase. No CSS `uppercase` applied to title elements. Issue was likely stale DB data that gets fixed on next deploy via regenerate-titles.sh.

### Files Touched
- `web/src/components/feed/FeedFilters.tsx` — PriceStepper rewrite, onCollapse prop
- `web/src/app/dashboard/feed/page.tsx` — Filter state persistence, orange indicator, map count, toolbar spacing
- `web/src/app/dashboard/store/page.tsx` — Same filter fixes as feed, listing count added
- `web/src/components/ui/TopBar.tsx` — Removed back button props and ChevronLeft
- `web/src/app/dashboard/layout.tsx` — Removed back/backHref from getTopBarNav, removed useSearchParams
- `web/src/app/dashboard/agents/[id]/page.tsx` — Removed back arrow button
- `web/src/app/dashboard/crm/person/[id]/page.tsx` — Removed back arrow button
- `web/src/app/dashboard/listings/[id]/view/page.tsx` — Removed "Go back" button from error state
- `web/src/components/listings/DatabaseView.tsx` — Filtered system-only statuses from dropdown
- `web/src/components/listings/ListingForm.tsx` — Description rows 5→10, /dashboard/listings→/dashboard/store
- `web/src/app/dashboard/listings/[id]/edit/page.tsx` — Links updated to /dashboard/store
- `web/src/components/listings/ListingCard.tsx` — from=listings→from=store
- `web/src/app/dashboard/crm/person/[id]/page.tsx` — from=listings→from=store
- `web/src/app/dashboard/listings/page.tsx` — from=listings→from=store
- `web/src/components/ui/BottomNav.tsx` — Removed fromParam === "listings" check
- `web/src/lib/i18n.ts` — Added "(tỷ)" to price filter labels
- `docs/SCOPE.md` — Marked all 5 tasks complete
