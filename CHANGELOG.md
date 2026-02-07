# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **ProMemo web app** (Next.js 16, React 19, TypeScript, Tailwind v4) at port 8888
  - Agent signup/login with bcrypt + JWT auth
  - Listing CRUD with freestyle text input and structured database view
  - Feed with 18 filter parameters, sorting, and pagination
  - Agent-to-agent messaging with conversation threads, 5s polling
  - Responsive mobile layout with hamburger menu
- Database migration 004: 19 feature columns, auth on agents, status/archived/agent_id on parsed_listings, conversations+messages tables
- 19 new parser extractors: legal_status, bathrooms, structure_type, direction, depth, corner_lot, price_per_m2, negotiable, rental_income, elevator, nearby_amenities, investment_use_case, outdoor_features, special_rooms, feng_shui, total_construction_area, land_characteristics, traffic_connectivity, building_type
- 81 new parser tests (171 total across 31 test classes)
- Docker Compose `web` service for ProMemo (port 8888)
- 11 API routes: auth (4), listings (3+archive), feed, conversations, messages, parse stub
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
- `init_db.sql` — added agents, location reference tables, access_road/furnished columns
- `parse-listings` flow — synced inline parser with all improvements
- `parse_listings.py` — includes access_road and furnished in INSERT
- `.env.example` — added pgAdmin config variables
- `ingest-csv` flow now orchestrates both ingestion and parsing (replaces
  full-pipeline). Uses Docker runner with networkMode for DB access.
- Removed custom JSON log-writing from all flows; rely on Kestra built-in
  execution logging (Logs tab captures print() output)
- SQLAlchemy transactions use `engine.begin()` (auto-commit) in all flows

### Removed
- `full-pipeline` flow (merged into `ingest-csv` with `auto_parse` toggle)
- Custom JSON execution log files from flows (redundant with Kestra UI)

## [0.1.0-dev] - 2025-02-04

### Added
- Project initialization with README.md, CLAUDE.md, CHANGELOG.md
- System architecture documentation (docs/ARCHITECTURE.md)
- Python .gitignore
