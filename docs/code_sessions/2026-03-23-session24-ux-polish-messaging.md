# Session: UX Polish + Messaging Redesign
**Date:** 2026-03-23

### Summary
Session 24 was a comprehensive UI/UX polish pass across the entire app. All 10 items from the sprint scope were completed: avatar rendering, title format fixes, listing detail page overhaul (linearized from tab-based to single scroll), embedded messaging in listing detail, toolbar unification, filter chip removal, map mobile fixes, conversation sticky headers, viewport zoom disable. Three parallel sub-agents were used to speed up execution across non-conflicting file groups.

### Technical Details & Fixes

* **Features Delivered:**
  - **REA-41 (Avatars):** All APIs (`/api/agents`, `/api/listings/[id]`, `/api/conversations/[id]`, `/api/conversations`) now return `avatar_url`/`owner_avatar_url`/`other_agent_avatar_url`. `AgentChip` renders `<img>` with initials fallback. `ListingCard` passes avatar to chip.
  - **REA-42 (Title format):** `generateTitleStandardized()` now puts price before commission (new format: `100 7 10 10 20ty hh1`). Migration `016_fix_title_order.sql` created to fix existing rows via `regexp_replace`.
  - **REA-43 (Title font):** `title_standardized` in listing detail is now `text-2xl sm:text-3xl font-bold`, the most prominent element above photos.
  - **REA-44 (Deduplicate/layout):** Listing detail page completely linearized — removed tab system (Details/Photos/Documents/Map tabs). Now a single scroll: title → carousel → price card → specs → description → legal/features → map → documents → agent info → messages.
  - **REA-45 (Map mobile):** FeedMap sets `touchAction: "pan-y"` and `scrollWheelZoom: false`. Map height normalized to `calc(100vh - 200px)` in both Feed and My Listings.
  - **REA-46 (Filter chips):** Removed All/Active/Under Contract/Sold/Archived tab chips from My Listings. Status filtering moves to the FeedFilters panel. Added search input to My Listings.
  - **REA-47 (Toolbar unify):** Both Feed and My Listings now have identical single-row toolbar: Search (flex-1) + Filter btn + GridToggle (grid mode) + Map toggle btn. Removed 3-column grid option — only 1 and 2 cols now.
  - **REA-48 (Sticky conversation):** Conversation thread page restructured — agent header and property bar are now `sticky`, messages area is `flex-1 overflow-y-auto min-h-0`, input is `flex-none`. MessageThread component no longer owns scroll.
  - **REA-49 (Embedded messages):** Listing detail now has a full `#messages` section at bottom. Case A (non-owner): single thread or "start conversation" input that creates a conversation + sends first message. Case B (owner): collapsible accordion of all inquiry threads with inline reply. Feed buttons now route to `/dashboard/listings/[id]/view?from=feed#messages`.
  - **REA-50 (No zoom):** `export const viewport` added to `app/layout.tsx` with `maximumScale: 1, userScalable: false` (Next.js 15 pattern).

* **Architecture/DB Changes:**
  - New migration: `src/db/migrations/016_fix_title_order.sql` — run on production VM
  - `/api/listings` GET now supports `q` ILIKE search (for My Listings search bar)
  - 5 new i18n keys: `messagesAboutListing`, `noInquiriesYet`, `askAboutListing`, `typeFirstMessage`, `typeReply`

* **Challenges Resolved:**
  - Docker not available in WSL shell — migration file created but must be run manually on VM
  - `newMessage` state in view page is declared+written but not read — acceptable (no TS error, just minor lint)

### Files Touched
- `web/src/app/layout.tsx` — viewport meta
- `web/src/app/api/agents/route.ts` — avatar_url in list
- `web/src/app/api/listings/route.ts` — q search support
- `web/src/app/api/listings/[id]/route.ts` — owner_avatar_url
- `web/src/app/api/conversations/route.ts` — other_agent_avatar_url
- `web/src/app/api/conversations/[id]/route.ts` — other_agent_avatar_url
- `web/src/app/dashboard/feed/page.tsx` — unified toolbar, message routing
- `web/src/app/dashboard/listings/page.tsx` — remove tabs, unified toolbar, search
- `web/src/app/dashboard/listings/[id]/view/page.tsx` — full rewrite: linearized layout, embedded messages
- `web/src/app/dashboard/messages/[conversationId]/page.tsx` — sticky headers
- `web/src/components/ui/AgentChip.tsx` — avatar_url support
- `web/src/components/ui/ListingCard.tsx` — pass avatar_url
- `web/src/components/ui/GridToggle.tsx` — remove 3-col option
- `web/src/components/map/FeedMap.tsx` — touchAction, scrollWheelZoom
- `web/src/components/messages/MessageThread.tsx` — remove own scroll container
- `web/src/lib/constants.ts` — title format fix (price before commission)
- `web/src/lib/types.ts` — owner_avatar_url on Listing
- `web/src/lib/i18n.ts` — 5 new keys
- `src/db/migrations/016_fix_title_order.sql` — new migration
