# Session: Layout Constants, Map Fix, Card Fixes, Auto Logging
**Date:** 2026-03-24

### Summary
Session 27 established a single source of truth for layout dimensions via `layout-constants.ts`, delivered the definitive (4th attempt) map height fix using those constants, applied a batch of 8 listing card visual fixes (status flags, title color, agent full name, archive removal), and updated CLAUDE.md to make session logging automatic while backfilling missing S25/25b/26 logs.

### Technical Details & Fixes
* **Features Delivered:**
  - REA-68: `web/src/lib/layout-constants.ts` created with `TOPBAR_HEIGHT` (56px), `BOTTOMNAV_HEIGHT` (64px), `TOOLBAR_HEIGHT` (48px), `MAP_HEIGHT` (`calc(100vh - 184px)`), `PAGE_PADDING_X`, `PAGE_MAX_WIDTH`
  - REA-70: Map height definitively fixed — feed and listings pages restructure map mode: header/filters/count hidden, toolbar `h-12`, no top padding, `overflow-hidden` wrapper, `LAYOUT.MAP_HEIGHT` used. BottomNav height standardized 60→64px.
  - REA-69: Corner status flag on photo top-left (Blue/Red/Green/Gray per status). Title line 2 fixed to `text-[var(--text-primary)]` (was orange). Archive button removed from My Listings cards. Agent full name (first + last) shown in all card views. Consistent `truncate` on all title lines.
  - REA-76: CLAUDE.md "After Every Session" made AUTOMATIC. Backfilled session logs for S25, S25b, S26.

* **Architecture/DB Changes:**
  - New file: `web/src/lib/layout-constants.ts`
  - listings API now JOINs agents table (adds `owner_first_name`, `owner_last_name`, `owner_phone`, `owner_username`)
  - `Listing` type: added `owner_last_name?: string`
  - feed API: added `a.last_name AS owner_last_name`
  - `AgentChip`: `last_name` field added, `displayName` shows full name

* **Challenges Resolved:**
  - Map height: previous attempts used hardcoded calcs that didn't account for actual overhead. Fixed by restructuring map mode to show only toolbar (48px) above map, removing all other page elements in map mode, then applying exact calc.
  - listings API missing agent name: API was `SELECT parsed_listings.*` with no JOIN. Added agents JOIN so My Listings cards can show agent full name.

### Files Touched
- `web/src/lib/layout-constants.ts` (new)
- `web/src/components/ui/BottomNav.tsx` (height 60→64px)
- `web/src/components/ui/AgentChip.tsx` (last_name added)
- `web/src/components/ui/ListingCard.tsx` (status flag, title color, agent full name, remove status strip)
- `web/src/components/listings/ListingCard.tsx` (same + archive button removed)
- `web/src/app/api/feed/route.ts` (owner_last_name)
- `web/src/app/api/listings/route.ts` (agents JOIN, name fields)
- `web/src/lib/types.ts` (owner_last_name)
- `web/src/app/dashboard/feed/page.tsx` (map mode restructure, LAYOUT.MAP_HEIGHT)
- `web/src/app/dashboard/listings/page.tsx` (map mode restructure, LAYOUT.MAP_HEIGHT)
- `CLAUDE.md` (auto logging, session footer, design rules already present)
- `docs/SCOPE.md` (all 4 tasks marked [x])
- `docs/CHANGELOG.md`
- `docs/code_sessions/` (S25, S25b, S26 backfill + this file)
