# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Session 15 — 2026-03-16 — P0 Bug Fixes, Schema Cleanup, Deployment Prep

#### Fixed
- **Critical: Add/Edit Listing server errors** — POST and PUT `/api/listings` referenced `description_vi` and `description_en` columns that don't exist in DB. Removed ghost columns from SQL, validation, types, and form.
- **Favorites API** — Rebuilt as simple POST toggle (no request body needed) + GET status check. Was crashing because old code tried to parse JSON body from empty requests.
- **Status validation** — Added `in_negotiations` and `pending_closing` to Zod enum (were in DB constraint but missing from validation).

#### Changed
- Migration 011 applied: dropped old overlapping `ck_parsed_listings_status` constraint. Single authoritative constraint remains.
- StatusBadge component updated with all 9 status values including `in_negotiations` and `pending_closing`.
- LISTING_STATUSES constant updated with `in_negotiations` and `pending_closing` entries.
- ListingCard favorite toggle simplified to use toggle API (no action body).
- Docker Compose: added GEMINI_API_KEY passthrough to web container.
- Demo accounts (pavel/dean) passwords reset to `demo123`.

#### Added
- `inNegotiations` i18n key (en + vi)
- `scripts/deploy-vm.sh` — one-command deployment to fresh GCP VM (installs Docker, creates .env, runs migrations, creates demo accounts)

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
