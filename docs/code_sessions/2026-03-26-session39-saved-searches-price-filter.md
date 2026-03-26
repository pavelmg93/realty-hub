# Session 39: CRM + Pricing + Saved Searches
**Date:** 2026-03-26

### Summary
Delivered Vietnamese price notation parsing for filters and the full Saved Searches feature. Price inputs now accept natural Vietnamese formats like "2ty", "400tr", "900trieu" which are converted to VND before SQL queries. Built a complete Saved Searches system with DB tables, API, save modal (with CRM person attachment and quick-create), bookmark buttons on Feed/My Store, and a new "Saved" tab in the CRM page. REA-101 was consolidated as a duplicate of REA-110.

### Technical Details & Fixes
* **Features Delivered:**
  - Vietnamese price notation parser (`parseVietnamesePrice`) supporting tỷ/triệu/tr/ty units with decimal support
  - Price filter inputs changed from number to text with Vietnamese placeholder hints
  - Saved Searches: migration 023 (`saved_searches` + `saved_search_persons` tables)
  - CRUD API routes at `/api/saved-searches` and `/api/saved-searches/[id]`
  - SaveSearchModal component with buyer/seller checklists, quick-create person
  - Bookmark button added to Feed and My Store toolbars
  - "Saved" tab in CRM page with load-to-feed, delete, and person association display
* **Architecture/DB Changes:**
  - Migration 023: `saved_searches` (SERIAL PK, agent_id FK, name, query, filters JSONB) + `saved_search_persons` junction table
  - 11 new i18n keys (en + vi) for saved search UI
* **Challenges Resolved:** None — clean implementation.

### Files Touched
- `web/src/lib/parse-price.ts` (new) — Vietnamese price parser
- `web/src/lib/i18n.ts` — new keys, updated price labels
- `web/src/components/feed/FeedFilters.tsx` — text inputs for price
- `web/src/components/feed/SaveSearchModal.tsx` (new) — save search modal
- `web/src/app/api/feed/route.ts` — Vietnamese price parsing
- `web/src/app/api/listings/route.ts` — Vietnamese price parsing
- `web/src/app/api/saved-searches/route.ts` (new) — GET/POST
- `web/src/app/api/saved-searches/[id]/route.ts` (new) — DELETE/PATCH
- `web/src/app/dashboard/feed/page.tsx` — bookmark button + modal
- `web/src/app/dashboard/store/page.tsx` — bookmark button + modal
- `web/src/app/dashboard/crm/page.tsx` — "Saved" tab
- `src/db/migrations/023_saved_searches.sql` (new)
- `docs/SCOPE.md` — tasks marked done
- `docs/CHANGELOG.md` — session entry
