# ProMemo Implementation Progress

## Completed

### Phase 1: Database Migration (DONE)
- `src/db/migrations/004_promemo_schema.sql` — all 19 feature columns, auth, status, messaging tables
- `src/db/init_db.sql` — updated with complete schema for fresh installs
- `src/db/models.py` — Agent, RawListing, ParsedListing, Conversation, Message models

### Phase 2: Python Parser (DONE)
- `src/parsing/vietnamese_parser.py` — 19 new extract_* functions added (~1130 lines total)
- `src/parsing/parse_listings.py` — INSERT statement updated with all 19 new columns + JSONB serialization
- `tests/test_vietnamese_parser.py` — 171 tests across 31 test classes (all 19 new extractors tested)
- **NOT YET**: Kestra inline parser sync (kestra/flows/re-nhatrang.parse-listings.yml)

### Phase 3: Next.js Scaffold (DONE)
- `web/` — Next.js 16+, TypeScript, Tailwind v4, App Router
- Dependencies: pg, bcryptjs, jsonwebtoken, zod + types
- `web/src/lib/db.ts` — pg Pool singleton
- `web/src/lib/auth.ts` — bcrypt, JWT, cookie helpers
- `web/src/lib/types.ts` — all TypeScript interfaces
- `web/src/lib/constants.ts` — enum labels, formatPrice
- `web/src/lib/validation.ts` — Zod schemas
- `web/src/middleware.ts` — auth guard for /dashboard/*
- `web/src/hooks/useAuth.ts` — auth context + hook
- `web/src/app/providers.tsx` — AuthContext provider
- `web/src/app/layout.tsx` — root layout with providers
- `web/src/app/page.tsx` — login/signup page
- `web/src/app/dashboard/layout.tsx` — navbar, mobile menu, auth guard
- `web/src/app/dashboard/page.tsx` — redirect to /listings

### Phase 5: Auth System (DONE)
- API routes: signup, login, logout, me — all at web/src/app/api/auth/

### All 11 API Routes (DONE)
- auth: signup, login, logout, me
- listings: CRUD, archive
- feed: GET with comprehensive filters
- conversations: list, create/get-or-create
- messages: GET/POST with listing tags
- parse: stub route

### Phase 6: Listing Management (DONE)
- `web/src/components/listings/StatusBadge.tsx`
- `web/src/components/listings/ListingCard.tsx` — with ConfirmButton
- `web/src/components/listings/ListingForm.tsx` — dual-mode form (freestyle + database view tabs)
- `web/src/components/listings/FreestyleEditor.tsx` — freestyle textarea + parse button
- `web/src/components/listings/DatabaseView.tsx` — all fields grouped by category
- `web/src/app/dashboard/listings/page.tsx` — My Listings (active/archived tabs, sort, grid)
- `web/src/app/dashboard/listings/new/page.tsx` — Create listing
- `web/src/app/dashboard/listings/[id]/edit/page.tsx` — Edit listing

### Phase 7: Feed View (DONE)
- `web/src/app/dashboard/feed/page.tsx` — Feed with filters, pagination, message buttons
- `web/src/components/feed/FeedCard.tsx` — owner info, feature badges, message buttons
- `web/src/components/feed/FeedFilters.tsx` — 18 filter params, sort, apply/reset

### Phase 8: Messaging (DONE)
- `web/src/app/dashboard/messages/page.tsx` — conversation list
- `web/src/app/dashboard/messages/[conversationId]/page.tsx` — message thread
- `web/src/components/messages/ConversationList.tsx` — with unread counts
- `web/src/components/messages/MessageThread.tsx` — chat bubbles, auto-scroll
- `web/src/components/messages/MessageInput.tsx` — text input, Enter to send

### Phase 9: Docker + Polish (DONE)
- `web/Dockerfile` — dev container (node:20-alpine)
- `docker-compose.yml` — web service added (port 8888:3000)
- `.env.example` — WEB_PORT, JWT_SECRET added
- `docs/ARCHITECTURE.md` — ProMemo section, data model, Docker diagram
- `docs/USAGE.md` — ProMemo usage guide, file organization
- `CHANGELOG.md` — ProMemo features
- `docs/SESSION_LOG.md` — Session 5

### Session 6 Bug Fixes (DONE)
- **Migration 005**: conversations per listing (listing_id on conversations table)
- Fixed 5 cho_thue → ban misclassified listings
- Zod validation robustness: coerce BIGINT strings→numbers, empty strings→null, nullable status
- Better error display (shows field-level validation details)
- FeedCard: added furnished, structure_type, building_type, depth_m, description preview
- ConversationList: shows listing context (property type, ward, price, area)
- Conversation header: shows listing context
- Conversations now scoped per (agent_pair, listing) — unique combo per listing

## Not Started

### Phase 4: TypeScript Parser Port
- Port all 29 extractors to TS in web/src/parser/
- Add ParseMatch position tracking for bidirectional sync
- Need: web/src/parser/index.ts, types.ts, extractors/*.ts
- This enables the "Parse Text" button to actually work

### Future Improvements
- WebSocket for real-time messaging (replace 5s polling)
- Kestra inline parser sync with 19 new extractors
- Unread message badge in navbar
- Mobile-optimized listing editor
- Performance investigation (dev server vs production build)

## Key Decisions
- No ORM for Next.js — raw pg Pool with SQL to avoid migration conflicts
- Auth: bcrypt + JWT in httpOnly cookie (no NextAuth)
- Parser will be ported to TypeScript for client-side parsing
- Python parser stays for Kestra batch pipeline
- Conversations use ordered pair + listing_id constraint (per-listing threads)
