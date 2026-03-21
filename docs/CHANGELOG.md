# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Session 21 — 2026-03-21 — Bug Fixes + UI Polish for Pilot

#### Fixed
- **REA-30: "View Messages" not clickable in Feed** — `onViewMessages` in FeedPage now navigates to `/dashboard/messages` when no specific conversation ID exists (owner viewing their own listing).
- **REA-28: Remove follow-up questions from AI parse** — Removed confusing interactive question UI from the New Listing form. Parse now silently populates fields. Removed `followUpAnswers` state and `handleFollowUpAnswer` handler. Mock parser no longer returns follow-up questions.
- **REA-31: Zalo share text** — Share text now uses Vietnamese labels (`getFieldValueLabel` with `"vi"`) for property and transaction type — e.g., "Nhà phố" instead of "nha_pho". "Copy văn bản" button moved to `i18n.ts` as `copyText` key (en: "Copy text", vi: "Sao chép văn bản").
- **REA-16: Listing detail margins** — Added `px-4 sm:px-6` to the outer `max-w-4xl mx-auto` container on the listing detail view.

#### Changed
- **REA-29: Standardized title** — `generateTitleStandardized()` now omits `m²` and `T` suffixes (format: `100 7 10x10 hh1 20ty`). Listing detail view header now shows two-line standardized title (address + specs) matching Feed/My Listings cards. ListingCard font scales by grid density: `text-sm` (3-wide), `text-base` (2-wide), `text-xl` (1-wide).
- **REA-15: i18n filter options** — FeedFilters now renders all dropdown options (property type, transaction, status, legal, direction, structure, road access, furnished, building) in the active language using `FIELD_VALUE_LABELS` from `i18n.ts`. Removed English-only constants imports from FeedFilters.
- **REA-11: Gemini parse improvements** — System prompt updated with explicit rules for `address_raw`, `legal_status`, `access_road`, `structure_type` extraction including Vietnamese abbreviations. Mock parser now extracts legal status, access road, structure type, and assembles `address_raw`. `follow_up_questions` set to empty `[]`.
- **REA-17: UX verification** — Confirmed: sonner installed, no `alert()` calls, all three main pages (Feed, My Listings, Messages) have proper empty states with CTAs.

---

### Session 20 — 2026-03-21 — Infra Hardening + Pilot Polish

#### Added
- **REA-25: Docker volume pinning** — Named volumes `realty-hub-pg-data`, `realty-hub-redis-data`, `realty-hub-uploads-data`. Migration 014: `schema_migrations` tracking table + backfill of all 013 prior migrations. `scripts/migrate.sh` — idempotent migration runner that skips already-applied versions.
- **REA-24: Production Dockerfile** — Split into prod (`docker-compose.yml`) and dev (`docker-compose.dev.yml`) compose files. Dockerfile now runs `npm run build && npm start` for production. Dev compose adds bind mounts + overrides CMD to `npm run dev`.
- **REA-17: loading.tsx skeletons** — Next.js route loading files for dashboard, listing detail, feed, messages — instant spinner/skeleton on navigation.
- **REA-27: OPERATIONS.md** — New ops cheatsheet with Docker, DB, VM, deploy, cleanup commands.
- **sonner** — Toast library installed, `<Toaster />` added to root Providers (ready for future `toast.error()` / `toast.success()` usage).

#### Fixed
- **REA-26: Multi-photo upload bug** — When uploading multiple files, `onStagedPhotosChange` was called with a stale closure value causing each file to overwrite the last. Fixed by accumulating into a local array and calling once at the end.
- **REA-11: AI price parsing** — Unified price parsing via `parseVietnamesePrice()` utility in parse route. Both Gemini and mock parser now return `price_short` (e.g., `"3.5 tỷ"`) alongside `price_vnd`.

#### Changed
- **REA-23: CLAUDE.md** — Branching Strategy updated. Session counter → 20. Demo passwords updated to `pilot123`.
- **create_agent.sh** — New signature: `<username> <first_name> <last_name> <password> [phone] [email]`. Updated in CLAUDE.md, RUNBOOK.md, DEPLOYMENT.md, USAGE.md.
- **deploy-vm.sh** — Migration loop replaced by `./scripts/migrate.sh` call. Pilot account commands updated.
- **REA-16: UI margins** — Feed and My Listings pages: `px-4 sm:px-6 py-4 max-w-3xl mx-auto`. Messages page: `px-4 sm:px-6 py-4`.

---

### Session 19 — 2026-03-19 — Feature Sprint (Photos, Search, Share, UX)

#### Added
- **REA-9: Photo validation + HEIC + thumbnails** — 10MB limit, HEIC→JPEG conversion via `sharp`, 400px thumbnail generation (`thumb_<file>`). DELETE endpoint now removes files from disk. Client-side validation feedback in PhotoUploader.
- **REA-10: Primary photo selection** — Star icon in PhotoUploader to set primary. `is_primary` + `thumb_path` columns on `listing_photos` (migration 013). Feed and My Listings prefer `is_primary=TRUE` photo. First uploaded photo auto-set as primary.
- **REA-11: Gemini Vietnamese prompts** — Rewrote system prompt entirely in Vietnamese. Handles abbreviated prices, compass directions, nở hậu, multiple contacts. 30s timeout with 1 retry before regex fallback.
- **REA-13: Feed full-text search** — Migration 013: `unaccent` extension, `search_vector` tsvector + GIN index. API: `?q=<term>` prefix matching. Feed UI: search bar with 300ms debounce, result count, clear button.
- **REA-14: Share card v1** — "Create Post" generates real Vietnamese text. Zalo / Facebook format toggle. One-click copy to clipboard.
- **REA-15: i18n** — Added 10 missing keys (searchListings, shareText, setPrimary, photo errors, empty states) en+vi.
- **REA-17: Skeletons + empty states** — Skeleton loaders on Feed (4 cards), My Listings (4 cards), Messages (3 rows). Empty states with CTAs.
- **Migration 013** — `listing_photos.is_primary`, `listing_photos.thumb_path`, `parsed_listings.search_vector` (tsvector + GIN), `unaccent` extension.

#### Changed
- **Upload route** — 20MB → 10MB limit. Photos auto-converted to JPEG + thumbnail via `sharp`. HEIC/HEIF supported.
- **CLAUDE.md** — Branching updated to `main` as daily branch. Session counter → 19. CLAUDE-UPDATES.md deleted.
- **SCHEMA.md** — `listing_photos` table updated.

---

### Session 18 — 2026-03-19 — Infrastructure Hardening, Branching, RUNBOOK

#### Added
- **`develop` branch** — created and pushed to origin. All session work on `develop`.
- **`scripts/backup-db.sh`** — pg_dump to `backups/YYYY-MM-DD-HHMMSS.sql.gz`. 7-day retention, prunes older backups. `backups/` dir added with `.gitkeep`.
- **`docs/RUNBOOK.md`** — production operations: create agent accounts, backup/restore DB, restart services, view logs, apply migrations, deploy updates, health checks, common issues.
- **`DOMAIN=realtyhub.xeldon.com`** to `.env.example`.
- **Branching strategy + Development Workflow** sections added to `CLAUDE.md`.
- **Project Management / Linear** reference added to `CLAUDE.md`.
- **`backups/*.sql.gz` and `backups/cron.log`** added to `.gitignore`.
- **Session files 6–13** split from `SESSION_LOG.md` into individual `code_sessions/` files.

#### Changed
- **Project renamed** — ProMemo → Realty Hub (formerly ProMemo) in `CLAUDE.md`, `.env.example`.
- **`CLAUDE.md` session counter** bumped to 18.
- **`SESSION_LOG.md`** moved to `docs/archive/`.
- **Repo structure** map in `CLAUDE.md` updated (RUNBOOK, adrs, SESSION_LOG, archive, scripts entries).

#### Verified
- **Cloudflare HTTPS** (REA-5): No hardcoded `http://localhost` URLs in source. JWT cookie `secure: process.env.NODE_ENV === "production"` works correctly with Cloudflare Flexible SSL. `X-Forwarded-Proto` handled by Next.js automatically.
- **Gemini API key** config correct — `.env` defines `ENV_GEMINI_API_KEY`, docker-compose maps it to container `GEMINI_API_KEY`. No mismatch.

---

### Session 15 — 2026-03-16 — UI Polish, Gemini Integration, i18n Fix

#### Added
- **Gemini AI parse** — `/api/ai/parse-listing` now uses Gemini 1.5 Flash with mock regex fallback. Installed `@google/generative-ai`. Returns `ai_used: bool`.
- **i18n: FIELD_VALUE_LABELS** — bilingual (en/vi) labels for all dropdown field values (property_type, transaction_type, status, furnished, legal_status, direction, access_road, structure_type, building_type). `getFieldValueLabel()` helper function.
- **My Listings card photos** — `GET /api/listings` now returns `primary_photo` and `photo_count` subqueries. Card shows photo thumbnail with count badge.
- **Feed visibility rules** — Sold/not_for_sale listings hidden from feed unless favorited by current agent.
- **Photo upload at listing creation** — PhotoUploader staging mode: uploads to disk during form fill, registers with listing after creation. `StagedPhoto` type added.
- **Document upload at listing creation** — DocumentManager staging mode: same pattern. `StagedDocument` type added. Category picker + notes field available during creation.

#### Changed
- **Card two-line headline** — Both ListingCard (My Listings) and FeedCard (ui/ListingCard) now display: Line 1 = address_raw, Line 2 = specs (area/floors/dims/commission/price).
- **generateTitleStandardized()** — Updated formula: `<area>m² <floors>T <frontage>x<depth> <commission> <price>`. Address is no longer part of title_standardized.
- **My Listings card** — Entire card is now clickable (wrapped in `<Link>`). Removed standalone "View" button. Edit/Inquiries/Archive use stopPropagation.
- **StatusBadge** — Positioned top-left of card photo area. Hidden for `for_sale` (default status).
- **Status enum reduced to 7** — Removed `in_negotiations` and `pending_closing`. Migration 012 applied (rows migrated, CHECK constraint updated).
- **FeedCard feature tags** — Now use bilingual `getFieldValueLabel()` instead of English-only constants.
- **ListingForm** — Removed dead FreestyleEditor + "Parse Text" button (called non-existent `/api/parse`). Replaced with simple description textarea.
- **My Listings page** — Removed duplicate GridToggle and Map button from tab bar.

#### Fixed
- **Nested `<a>` hydration error** — Inner Link tags in ListingCard replaced with `<button>` + `router.push()`.
- **Messages "Loading..." hang** — Conversation [id] API queried non-existent `archived_at` and `avatar_url` columns causing 500 errors. Removed both; added error handling to fetchConversation.
- **"agent undefined" in thread header** — Race condition: component rendered before fetchConversation completed. Added loading guard.
- **Conversation list missing agent names** — Added `other_agent_first_name` and `other_agent_phone` to conversations list API.
- **PATCH handler SQL error** — Referenced non-existent `archived_by_agent_id` column; replaced with `updated_at = NOW()`.

#### Previous (Session 14)
- Fixed Add/Edit Listing ghost column errors (description_vi/description_en)
- Rebuilt Favorites API as toggle
- Migration 011: dropped old status constraint
- `scripts/deploy-vm.sh` for GCP VM deployment
- Demo accounts password reset

---

### Added
- **ProMemo web app** (Next.js 15, React 19, TypeScript, Tailwind v4) at port 8888
  - Agent login with bcrypt + JWT auth (httpOnly cookie). Account creation via admin script only.
  - Listing CRUD with freestyle text input and structured database view
  - Feed with 18 filter parameters, sorting, and pagination
  - Agent-to-agent messaging with conversation threads, 5s polling
  - Responsive mobile layout with hamburger menu
  - Auto-parse on tab switch: freestyle text auto-parsed when switching to database view
  - Reverse sync: structured fields generate human-readable text when switching to freestyle
  - Per-listing conversations: each listing gets its own message thread
  - FeedCard shows furnished, structure_type, building_type, depth, description preview
- Database migration 004: 19 feature columns, auth on agents, status/archived/agent_id on parsed_listings, conversations+messages tables
- Database migration 005: conversations per listing (listing_id column, updated unique constraint), cho_thue→ban data fix
- Parse API (`/api/parse`): calls real Python vietnamese_parser via subprocess (graceful fallback)
- 19 new parser extractors: legal_status, bathrooms, structure_type, direction, depth, corner_lot, price_per_m2, negotiable, rental_income, elevator, nearby_amenities, investment_use_case, outdoor_features, special_rooms, feng_shui, total_construction_area, land_characteristics, traffic_connectivity, building_type
- 81 new parser tests (171 total across 31 test classes)
- Docker Compose `web` service for ProMemo (port 8888)
- 11 API routes: auth (4), listings (3+archive), feed, conversations, messages, parse
- pgAdmin 4 web UI for database browsing (port 5050), auto-configured server
- `agents` table for tracking real estate agents with listing associations
- `nha_trang_wards` and `nha_trang_streets` reference tables (28 wards, 60 streets)
- Seed data script (`src/db/seed_reference_data.sql`) with Nha Trang locations
- `access_road` field: extracts road/alley access type (mat_duong, hem_oto, hem_thong, etc.)
- `furnished` field: extracts furnishing status (full, co_ban, khong)
- Smart property type classification: title-based priority, "bán đất tặng nhà" override
- Default transaction_type to "ban" when listing has property info but no explicit verb
- Comprehensive Nha Trang ward list (28 entries: 20 phường + 8 xã, pre/post-merger)
- Database migration 003 for existing databases
- 20 new tests (90 total): property type priority, default transaction, access road, furnished
- Gemini AI Copilot integration in Kestra UI (Gemini 2.5 Flash)
- Docker runner configuration for all Kestra script tasks (python:3.12-slim)
- Bidirectional flow sync script (`scripts/kestra_flow_sync.sh`)
- `demo-file-test` diagnostic flow for quick FILE upload sanity checks
- `auto_parse` toggle on `ingest-csv` flow (default: true)
- Infrastructure diagram in ARCHITECTURE.md

### Changed
- Parser: property type uses scoring + title priority instead of first-match
- Parser: transaction_type defaults to "ban" when property info present
- `docker-compose.yml` — added pgAdmin service, Kestra runs as root
- `init_db.sql` — added agents, location reference tables, access_road/furnished columns, conversations with listing_id
- `parse-listings` flow — synced inline parser with all improvements
- `parse_listings.py` — includes access_road and furnished in INSERT
- `.env.example` — added pgAdmin config variables
- `ingest-csv` flow now orchestrates both ingestion and parsing (replaces
  full-pipeline). Uses Docker runner with networkMode for DB access.
- Removed custom JSON log-writing from all flows; rely on Kestra built-in
  execution logging (Logs tab captures print() output)
- SQLAlchemy transactions use `engine.begin()` (auto-commit) in all flows
- Validation: z.preprocess coercion for BIGINT strings and empty strings (node-postgres compatibility)
- Conversations: unique constraint now includes listing_id (per-listing threads)
- Feed API: conversation lookup matches on listing_id
- SESSION_LOG.md, TESTING_LOG.md reordered to newest-first

### Fixed
- BIGINT columns (price_vnd, price_per_m2, rental_income_vnd) returned as strings by node-postgres, causing validation failures on listing edit
- Status field not accepting null/empty values on existing listings
- 5 cho_thue listings incorrectly classified (should be ban)
- "Messages" button showing on all listings after messaging one (was per-agent-pair, now per-listing)

### Removed
- `full-pipeline` flow (merged into `ingest-csv` with `auto_parse` toggle)
- Custom JSON execution log files from flows (redundant with Kestra UI)
- Public agent signup (`/api/auth/signup` still exists for script use, UI tab removed)
- Signup tab from login page (Session 8) — login-only, contact admin for account creation

## [0.1.0-dev] - 2025-02-04

### Added
- Project initialization with README.md, CLAUDE.md, CHANGELOG.md
- System architecture documentation (docs/ARCHITECTURE.md)
- Python .gitignore
