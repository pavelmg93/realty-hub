# Session: ProMemo Bug Fixes, Auto-Parse, Conversations Per Listing
**Date:** 2026-02-08

## Session 6 — 2026-02-08 — ProMemo Bug Fixes, Auto-Parse, Conversations Per Listing

### Summary
User-driven testing session. Fixed 9 reported issues from manual testing of ProMemo web app. Major changes: conversations are now per-listing (not per-agent-pair), Vietnamese parser connected to web API, auto-parse on tab switch implemented.

### Changes Made

#### Bug Fixes
- **Fixed 5 cho_thue listings** → changed to "ban" (migration 005)
- **Fixed validation error** when editing listings with blank transaction_type. Root cause: BIGINT columns (price_vnd, price_per_m2, rental_income_vnd) returned as strings by node-postgres, rejected by z.number(). Fix: z.preprocess coercion helpers (coerceNum, coerceInt, optStr) in validation.ts
- **Fixed status field** not accepting null — added nullable handling with fallback to "for_sale"
- **Improved error display** — validation errors now show which field failed
- **Fixed turbopack cache** causing stale routes (conversations/[id]/messages returning 404)

#### Conversations Per Listing (Migration 005)
- Added `listing_id INTEGER NOT NULL` to conversations table
- Changed unique constraint from `(agent_1_id, agent_2_id)` to `(agent_1_id, agent_2_id, listing_id)`
- Updated conversations API: POST requires listing_id, GET returns listing context (property_type, ward, price, area)
- Updated feed API: LEFT JOIN matches on listing_id (per-listing conversation lookup)
- Updated feed page: passes listing_id when creating conversation
- ConversationList: shows listing context (property type, ward, price, area)
- Conversation header: shows listing context
- Each listing now gets its own "Message"/"Messages" button independently

#### Auto-Parse on Tab Switch
- **Parse API** (`/api/parse`): No longer a stub. Calls real Python vietnamese_parser via subprocess with stdin piping. Falls back gracefully if Python unavailable.
- **Freestyle → Database View**: Auto-triggers parser when text changed since last parse. Shows "Parsing..." state.
- **Database View → Freestyle**: Generates human-readable text summary from structured fields (formDataToText function).
- Tracks lastParsedText ref to avoid re-parsing unchanged text.
- Tab switches and Save disabled during parsing.

#### FeedCard Improvements
- Added: furnished, structure_type, building_type, depth_m tags
- Added: description preview (2-line clamp)

#### Log Reordering
- SESSION_LOG.md and TESTING_LOG.md both reordered to newest-first convention

### Files Changed
- `web/src/lib/validation.ts` — z.preprocess coercion for BIGINT/empty strings
- `web/src/app/api/parse/route.ts` — Python parser subprocess integration
- `web/src/components/listings/ListingForm.tsx` — auto-parse, formDataToText, switchMode
- `web/src/components/listings/FreestyleEditor.tsx` — async onParse prop
- `web/src/app/api/conversations/route.ts` — listing_id support
- `web/src/app/api/feed/route.ts` — per-listing conversation JOIN
- `web/src/app/dashboard/feed/page.tsx` — pass listing_id on message
- `web/src/components/feed/FeedCard.tsx` — more feature tags, description preview
- `web/src/components/messages/ConversationList.tsx` — listing context display
- `web/src/app/dashboard/messages/[conversationId]/page.tsx` — listing context header
- `web/src/lib/types.ts` — Conversation.listing_id + listing context fields
- `src/db/init_db.sql` — conversations table with listing_id
- `src/db/migrations/005_conversations_per_listing.sql` — migration
- `docs/SESSION_LOG.md`, `docs/TESTING_LOG.md` — newest-first reorder

### Recommendations for Next Session
- Clear `.next` cache (`rm -rf web/.next`) when routes return unexpected 404s — turbopack caches aggressively
- Parse API calls Python subprocess — requires python3 and src/parsing available from web/ parent dir
- Test validation by editing Dean's listings (BIGINT price_vnd values)
- Phase 4 (TypeScript Parser Port) is now less urgent since Python parser works via API
- Performance investigation still pending (dev server vs production build)
- After `docker compose down -v && up -d`, run migrations 002-005 and seed_reference_data.sql
