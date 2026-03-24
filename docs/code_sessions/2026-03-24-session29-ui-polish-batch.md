# Session: UI Polish Batch (S29)
**Date:** 2026-03-24

### Summary
Full polish pass across cards, listing detail, forms, and messages. Completed 9 Linear issues: REA-86 (CLAUDE.md cleanup), REA-85 (feed header + logo), REA-80 (map stacking context, third attempt), REA-83 (card/view cleanup), REA-84 (icon-only message buttons + agent info), REA-82 (edit page margins), REA-71 (messages auto-expand bug), REA-72 (form fixes batch), REA-15 (i18n pass). TypeScript clean throughout.

### Technical Details & Fixes
* **Features Delivered:**
  - FIDT logo now visually centered (left/right spacers balanced)
  - Feed header spacing consistent in grid and map mode
  - Status flags on listing detail view overlay photo carousel (matching card style)
  - No listing IDs (#7, #6) visible anywhere in UI
  - Message buttons are icon-only across all card types
  - Agent info bar shown above message thread for non-owner view of others' listings
  - Commission section: no more orange "→ hh1" preview; label now translated
  - STREET + WARD merged into ADDRESS section in form
  - Status field hidden from New Listing, visible only in Edit
  - New Ward dropdown with 22 new administrative wards
  - P/m² calculated on edit form load (no longer requires field interaction)
  - All DatabaseExtras dropdowns (direction, furnished, access road, structure type) fully bilingual
  - Status flags in My Listings now follow language selector
  - Messages accordion auto-expand immediately shows messages (no "No messages yet" flash)

* **Architecture/DB Changes:**
  - `DatabaseView` gains `isEdit?: boolean` prop to conditionally render Status section
  - New ward options hardcoded in UI as `NEW_WARD_OPTIONS` (no DB migration needed for dropdown)
  - AI parser: both JS regex fallback and `PYTHON_PROP_TYPE_MAP` now map `nha → nha_pho`
  - CSS `isolation: isolate` on listing detail map wrapper creates stacking context (REA-80 fix)

* **Challenges Resolved:**
  - REA-80 (map overlap) was reopened — previous `z-0` fix insufficient. Root cause: Leaflet creates elements with z-index 400–1000 internally. Using CSS `isolate` creates a new stacking context so those internal z-indices cannot escape the container and overlap the fixed header.
  - REA-71 (messages showing "No messages yet"): auto-expand `setExpandedConvId` fired without fetching messages. Fixed by calling `fetchConversationMessages(firstId)` in the same `.then()` callback.

### Files Touched
- `CLAUDE.md` — end-of-session flow, deployment section, removed session footer
- `web/src/lib/i18n.ts` — added 7 new keys (both en/vi)
- `web/src/components/ui/TopBar.tsx` — left spacer `w-10` → `min-w-[5rem]`
- `web/src/app/dashboard/feed/page.tsx` — `py-4` conditional → always `pt-4`
- `web/src/app/dashboard/listings/[id]/edit/page.tsx` — loading/error state padding, removed `#{id}` from title
- `web/src/app/dashboard/listings/[id]/view/page.tsx` — StatusFlag component, photo carousel flag, removed badge+ID from header, `isolate` on map, auto-expand messages fix, agent info bar
- `web/src/components/ui/ListingCard.tsx` — removed StatusBadge+ID from 1-wide, icon-only message buttons
- `web/src/components/listings/ListingCard.tsx` — removed `#{id}` from 1-wide, StatusFlag uses i18n
- `web/src/components/feed/FeedCard.tsx` — icon-only message button, photo count i18n
- `web/src/components/listings/DatabaseView.tsx` — commission label/preview, ADDRESS section, status conditional, ward dropdown, P/m² fix, dropdown translations
- `web/src/components/listings/ListingForm.tsx` — pass `isEdit` to DatabaseView, P/m² in listingToInput
- `web/src/components/messages/ConversationList.tsx` — `"Agent"` fallback → `t("agent")`
- `web/src/components/feed/FeedFilters.tsx` — removed hardcoded `"Favorites Only"` fallback
- `web/src/app/api/ai/parse-listing/route.ts` — `nha_rieng` → `nha_pho` in two places
- `docs/SCOPE.md` — all tasks marked `[x]`
- `docs/CHANGELOG.md` — session 29 entry
