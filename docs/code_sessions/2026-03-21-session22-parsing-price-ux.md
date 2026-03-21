# Session: Parsing Pipeline + Price UX
**Date:** 2026-03-21

### Summary
Session 22 focused on three main improvements ahead of the pilot: reviving the Python regex parser as a first layer in the parse pipeline, simplifying price input by hiding raw VND numbers from forms, and hardening the AI parser's address disambiguation logic. All 6 SCOPE tasks completed (REA-34, REA-32, REA-33, REA-11, REA-16, REA-15).

### Technical Details & Fixes

* **Features Delivered:**
  - **REA-32: Two-layer parse pipeline** — `POST /api/ai/parse-listing` now runs Python parser + Gemini in parallel. Python result takes priority for numeric fields; Gemini fills address, property type, description. `Promise.all()` for zero latency overhead.
  - **REA-34: Price UX** — Removed `price_vnd` number input from all forms. Only `price_raw` text field shown (accepts `6.2 tỷ`, `800tr` etc). `price_vnd` auto-computed on blur, kept in DB. Existing listings pre-populate `price_raw` from `price_vnd` via `vndToShortString()`.
  - **REA-33: Nha Trang streets** — Migration 013 adds ~70 streets. Full street list injected into Gemini system prompt for disambiguation context.
  - **REA-11: Address disambiguation** — Gemini prompt now explicitly states: "đường rộng" = road width, NOT a street name → `road_width_m`. Mock parser now skips road descriptor words (rộng, hẹp, lớn, etc.) after "đường".
  - **REA-16: Mobile polish** — Photo grid changed to `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`.
  - **REA-15: i18n gaps** — Added 7 new keys (parseFailed, requestFailed, uploadFailed, deleteFailed, saveFailed, noMessagesThread, noConversationsYet) in both `en` and `vi`. Updated MessageThread, ConversationList, PhotoUploader, DocumentManager, ListingForm, New Listing page.

* **Architecture/DB Changes:**
  - `docker-compose.yml`: Added `./src:/src:ro` volume to web service — Python parser code now accessible at `/src` inside Docker container.
  - Migration 013 (`src/db/migrations/013_more_nha_trang_streets.sql`): ~70 new Nha Trang streets.

* **Challenges Resolved:**
  - Python parser runs as subprocess from Node.js. Path resolution uses `path.resolve(process.cwd(), "..")`: works in dev (`/realty-hub/web/../src`) and in Docker (`/app/../src = /src`) when `src/` is mounted at `/src`.
  - Python `property_type` enum differs from DB enum ("nha" vs "nha_rieng") — `PYTHON_PROP_TYPE_MAP` handles the translation; Python only fills `property_type` when Gemini returns null.

### Files Touched
- `web/src/app/api/ai/parse-listing/route.ts` — Two-layer pipeline, address disambiguation, street list in prompt, mock parser fix
- `web/src/components/listings/DatabaseView.tsx` — Removed `price_vnd` input and `handlePriceVndBlur`
- `web/src/components/listings/ListingForm.tsx` — Added `vndToShortString()`, pre-populate `price_raw` for existing listings, i18n `saveFailed`
- `web/src/lib/i18n.ts` — 7 new keys, updated price placeholder
- `web/src/components/messages/MessageThread.tsx` — i18n `noMessagesThread`
- `web/src/components/messages/ConversationList.tsx` — i18n `noConversationsYet`
- `web/src/components/photos/PhotoUploader.tsx` — Mobile grid fix, i18n errors
- `web/src/components/documents/DocumentManager.tsx` — i18n errors
- `web/src/app/dashboard/listings/new/page.tsx` — Show `price_short` badge, i18n errors
- `docker-compose.yml` — Mount `./src:/src:ro`
- `src/db/migrations/013_more_nha_trang_streets.sql` — New migration (created)
- `docs/CHANGELOG.md`, `docs/SCOPE.md`, `CLAUDE.md` — Updated
