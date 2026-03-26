# Session 38: UI Redesign — Navigation + View Mode
**Date:** 2026-03-26

### Summary
Redesigned the view mode selector, bottom navigation, and My Store toolbar. The old separate GridToggle + Map button were replaced with a unified 3-state ViewModeToggle (1-wide / 2-wide / Map) with orange highlight. Bottom nav was rearranged to News, My Store, Feed (center), CRM, Profile. Messages were consolidated into CRM as the first tab via a shared MessagesList component. My Store gained a full search + filter + view mode toolbar matching Feed.

### Technical Details & Fixes
* **Features Delivered:**
  - REA-106: New `ViewModeToggle` component replaces `GridToggle` + Map button across Feed, My Store, and Listings pages
  - REA-107: Bottom nav reordered (News, My Store, Feed, CRM, Profile); Messages tab added to CRM as tab index 0; `/dashboard/news` placeholder page created
  - REA-105: My Store now has search bar, filter panel, view mode toggle, and map view on both My Listings and Favorites tabs
* **Architecture/DB Changes:** None (UI-only session)
* **Challenges Resolved:** Extracted `MessagesList` into a shared component to avoid duplicating the full conversations list logic between the standalone messages page and the CRM messages tab

### Files Touched
- `web/src/components/ui/ViewModeToggle.tsx` (new)
- `web/src/components/ui/GridToggle.tsx` (still exists, no longer imported by active pages)
- `web/src/components/ui/BottomNav.tsx` (reordered, new icons)
- `web/src/components/messages/MessagesList.tsx` (new, extracted from messages page)
- `web/src/app/dashboard/feed/page.tsx` (ViewModeToggle integration)
- `web/src/app/dashboard/store/page.tsx` (search, filters, ViewModeToggle, map view)
- `web/src/app/dashboard/listings/page.tsx` (ViewModeToggle integration)
- `web/src/app/dashboard/crm/page.tsx` (Messages tab added)
- `web/src/app/dashboard/messages/page.tsx` (refactored to use MessagesList)
- `web/src/app/dashboard/news/page.tsx` (new placeholder)
- `web/src/lib/i18n.ts` (added news, messages, comingSoon keys)
- `docs/SCOPE.md` (marked S38 tasks done)
