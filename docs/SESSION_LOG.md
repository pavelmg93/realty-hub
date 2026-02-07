# Session Log

Detailed record of each coding session. Updated after every completed
successful session. **Newest sessions first.**

---

## Session 5 — 2026-02-07 — ProMemo Web App: Full Frontend Implementation

### Summary

Built the complete ProMemo frontend: all page components for listings management,
feed browsing, and agent messaging. Added Docker Compose integration and updated
all documentation. The web app is now fully functional with signup/login, listing
CRUD (freestyle + database view), feed with 18 filters, and real-time messaging.

### Features Delivered

- **My Listings page** (`/dashboard/listings`): Active/archived tabs, sorting,
  grid layout with ListingCard components
- **Listing editor**: Dual-mode form (Freestyle Message + Database View tabs)
  - FreestyleEditor: textarea for Vietnamese text, "Parse Text" button
  - DatabaseView: structured form with all fields grouped by category
    (Classification, Price & Area, Location, Dimensions, Structure & Features,
    Extra Details, Description)
- **Create/Edit pages**: `/dashboard/listings/new` and `[id]/edit`
- **Feed page** (`/dashboard/feed`): All active listings from all agents
  - FeedFilters: 18 filter parameters (10 exact match, 5 range, 3 boolean)
  - FeedCard: owner info, Message/Messages buttons, feature badges
  - Pagination with page count
- **Messages page** (`/dashboard/messages`): Conversation list with unread counts
- **Conversation page** (`/dashboard/messages/[id]`): Message thread with
  auto-scroll, 5-second polling, chat bubble layout (own=right, other=left)
- **Docker Compose**: `web` service with volume mounts for hot reload
- Updated ARCHITECTURE.md, USAGE.md, CHANGELOG.md

### Architecture Decisions

- **No TypeScript parser yet**: Parse route remains a stub. The freestyle editor
  sends text to `/api/parse` which returns description only. Full TS parser port
  deferred to Phase 4 (separate session). Agents can still manually fill in all
  fields via Database View tab.
- **Polling for messages**: 5-second interval polling via setInterval. Acceptable
  for V1 with few users. WebSocket upgrade planned for V2 if needed.
- **Feed filters apply on button click**: Filters are collected in state, then
  applied when user clicks "Apply". Sort changes also trigger re-fetch. This
  avoids excessive API calls while filter params are being adjusted.
- **Conversation get-or-create**: "Message" button on feed cards POST to
  `/api/conversations` which uses INSERT ON CONFLICT DO NOTHING for idempotent
  creation. Always returns the existing or new conversation.

### Challenges

- **White text on white background**: First manual test revealed the app was
  nearly invisible. Root cause: Next.js default `globals.css` includes
  `@media (prefers-color-scheme: dark)` which changes body text to light color
  when OS uses dark mode, but all component backgrounds are hardcoded white.
  Fix: removed dark mode media query, forced `color-scheme: light`, added
  explicit dark text color on form elements.

### Recommendations

- Run `cd web && npm run dev` for local development (hot reload, port 8888).
- Use `docker compose up -d` to run ProMemo inside Docker alongside other services.
- The parse route is a stub — agents must use Database View for structured data
  until the TS parser port is complete.
- Seed reference data after fresh DB: `docker exec ... psql -f seed_reference_data.sql`

### Test Results

- Next.js build: 0 errors, all 17 routes compiled successfully
- Python tests: 171 passed (unchanged, no new Python code)

### Files Created

New frontend files:
- `web/src/app/dashboard/listings/page.tsx` — My Listings page
- `web/src/app/dashboard/listings/new/page.tsx` — Create listing
- `web/src/app/dashboard/listings/[id]/edit/page.tsx` — Edit listing
- `web/src/app/dashboard/feed/page.tsx` — Feed page
- `web/src/app/dashboard/messages/page.tsx` — Messages page
- `web/src/app/dashboard/messages/[conversationId]/page.tsx` — Conversation
- `web/src/components/listings/ListingForm.tsx` — Dual-mode form
- `web/src/components/listings/FreestyleEditor.tsx` — Freestyle textarea
- `web/src/components/listings/DatabaseView.tsx` — Structured form fields
- `web/src/components/feed/FeedCard.tsx` — Feed listing card
- `web/src/components/feed/FeedFilters.tsx` — Filter panel
- `web/src/components/messages/ConversationList.tsx` — Conversation list
- `web/src/components/messages/MessageThread.tsx` — Message bubbles
- `web/src/components/messages/MessageInput.tsx` — Message input
- `web/Dockerfile` — Dev container for Docker Compose

Modified:
- `docker-compose.yml` — added `web` service
- `.env.example` — added WEB_PORT, JWT_SECRET
- `docs/ARCHITECTURE.md` — ProMemo section, data model, Docker diagram
- `docs/USAGE.md` — ProMemo usage guide, file organization
- `CHANGELOG.md` — ProMemo features in [Unreleased]

---

## Session 4 — 2026-02-07 — Parser Improvements, pgAdmin, Agents, and Location Data

### Summary

Addressed all parser gaps found from first real data test (An Cu Dean listings).
Added pgAdmin for database browsing, improved Vietnamese parser with smart
property type classification, default transaction types, road access and
furnishing extraction. Created agents table, Nha Trang location reference
tables (28 wards, 60 streets), and seeded Dean as first agent.

### Features Delivered

- pgAdmin 4 web UI (port 5050) with auto-configured app database connection
- Smart property type: title-first priority, "bán đất tặng nhà" compound override
- Default transaction_type to "ban" when listing has property info but no verb
- `access_road` extraction: mat_duong, hem_oto, hem_thong, hem_rong, hem_nho, hem
- `furnished` extraction: full, co_ban, khong
- `agents` table with Dean (Duy) seeded, all listings associated
- `nha_trang_wards` reference: 28 entries (20 phường + 8 xã, pre/post-merger)
- `nha_trang_streets` reference: 60 major streets + streets from listing data
- Comprehensive ward list in parser (was 19, now 28)
- Database migration 003 for existing databases
- Seed script for reference data and first agent
- 20 new tests (90 total, all passing)

### Architecture Decisions

- **Scoring-based property type extraction**: When both "đất" and "nhà" appear
  in a listing, check the title (first line) to determine the primary type.
  Compound patterns like "bán đất tặng nhà" are pre-checked as overrides.
  This fixes the main misclassification issue from real data.
- **Default to "ban" for listings with property info**: In Vietnamese RE,
  listings with price/area/type but no explicit "bán" or "cho thuê" are almost
  always for sale. Rentals consistently use "cho thuê". This eliminated all 12
  previously-null transaction types.
- **Access road as categorical, not free text**: Road access patterns map to
  a fixed set of categories (mat_duong > hem_oto > hem_thong > hem_rong >
  hem_nho > hem) ordered by accessibility. This enables future filtering and
  scoring (e.g., car-accessible properties score higher for families).
- **Both pre- and post-merger ward names**: Nha Trang merged several wards in
  Nov 2024. We store both old and new names since listings may reference either.
- **pgAdmin over psql**: Added pgAdmin to docker-compose for visual database
  browsing. More accessible for the user than docker exec + psql.

### Challenges

- Property type misclassification: "BÁN ĐẤT TẶNG NHÀ" was classified as "nhà"
  because "nhà" keywords appeared first in the map iteration order. Fixed with
  scoring + title priority approach.
- pgAdmin `.local` email domain rejected by newer pgAdmin versions. Changed to
  `@renhatrang.dev`.

### Recommendations

- After schema changes, prefer `docker compose down -v && up -d` for dev.
  Use migration SQL only for data you want to preserve.
- Run `src/db/seed_reference_data.sql` after fresh database creation to
  populate wards, streets, and agent data.
- When adding new listing sources, create an agent record first, then set
  `agent_id` during ingestion for proper attribution.
- The property feature list (emoji-prefixed lines) contains patterns for:
  legal status, amenities, direction/orientation, distance to beach, distance
  to market. User to decide which become schema fields.

### Test Results

- 90 passed, 0 failed (was 70 before this session)
- Ruff lint: all checks passed
- Re-parse results: 37/37 parsed (0 failed), avg confidence 0.903
  - Before: avg confidence 0.835, 12 null transaction types, 12 misclassified
  - After: avg confidence 0.903, 0 null transaction types, 0 misclassified

### Files Created/Modified

New files:
- `config/pgadmin-servers.json` — pgAdmin auto-configured server
- `src/db/seed_reference_data.sql` — reference data and agent seed
- `src/db/migrations/003_add_agents_access_road_furnished_locations.sql`

Modified:
- `docker-compose.yml` — added pgAdmin service
- `src/db/init_db.sql` — added agents, location reference tables, new columns
- `src/parsing/vietnamese_parser.py` — property type scoring, default txn type,
  access_road, furnished, comprehensive ward list
- `src/parsing/parse_listings.py` — includes new columns in INSERT
- `kestra/flows/re-nhatrang.parse-listings.yml` — synced inline parser
- `tests/test_vietnamese_parser.py` — 20 new tests
- `.env.example` — added pgAdmin variables
- `docs/ARCHITECTURE.md` — updated data model, added pgAdmin to diagrams
- `docs/USAGE.md` — added pgAdmin docs, updated Step 4, troubleshooting
- `CHANGELOG.md` — updated [Unreleased] section
- `CLAUDE.md` — updated session reference

---

## Session 3 — 2026-02-06 — Kestra Docker Runner and AI Copilot

### Summary

Configured Gemini AI Copilot in Kestra, then spent an extended debugging
session resolving a chain of Kestra Docker runner issues: storage permissions,
Docker socket access, Python version mismatch, container networking, and
log persistence. Ended with a fully working ingest + parse pipeline using
Docker runner task containers on the correct network.

### Features Delivered

- Gemini 2.5 Flash AI Copilot active in Kestra UI
- Docker runner properly configured for all script tasks (python:3.12-slim)
- Task containers connected to compose network (can reach app-postgres)
- Bidirectional flow sync script (`scripts/kestra_flow_sync.sh`)
- `full-pipeline` flow merged into `ingest-csv` with `auto_parse` toggle
- `demo-file-test` diagnostic flow for quick sanity checks
- Removed custom JSON log-writing from flows (rely on Kestra built-in logging)

### Architecture Decisions

- **Docker runner over Process runner**: Process runner uses Kestra container's
  Python 3.10 and can't pip install (permission denied). Docker runner spawns
  isolated containers with `python:3.12-slim`, proper root access, and clean
  dependency installation. Trade-off: ~15-30s overhead per task for container
  pull/start. Acceptable for manual-trigger V1 workflows.
- **Run Kestra as root**: Official Kestra Docker Compose approach. Required for
  Docker socket access (spawning task containers). The alternative (rootless)
  requires Podman, which adds complexity.
- **Explicit networkMode on task runner**: Docker runner containers default to
  Docker's bridge network, isolated from compose services. Must set
  `networkMode: re-nhatrang_re-nhatrang` to reach app-postgres and redis.
- **Remove custom JSON logs**: Docker runner task containers don't inherit
  the Kestra container's volume mounts, so writing to `/app/logs/kestra/`
  from inside a task container does nothing. Kestra's built-in execution
  logging (Executions tab + Logs tab showing print() output) is sufficient.
- **Merge full-pipeline into ingest-csv**: Eliminated a separate orchestrator
  flow. `ingest-csv` now has `auto_parse` boolean (default true) that
  conditionally triggers parse-listings as a subflow. Simpler, fewer flows,
  and avoids FILE-across-subflow complexity.

### Challenges

- **refCnt: 0 red herring**: The "Illegal state: refCnt: 0, decrement: 1"
  error consumed most of the session. Multiple AI tools (Claude Code, ChatGPT,
  Kestra AI Copilot) analyzed it as a FILE reference lifecycle issue. Actual
  cause: storage volume permissions. Running as root fixed it instantly.
  Lesson: always check the basics (permissions, network, runner config)
  before investigating framework internals.
- **Five cascading Docker runner issues**: After fixing permissions, each fix
  revealed the next problem — no Docker socket, then pip permission denied,
  then wrong Python version, then network isolation. Each required a different
  piece of docker-compose or flow YAML configuration.
- **Flow sync gap**: Changes made in Kestra UI don't sync back to host files.
  Deleting flow files from host doesn't remove them from Kestra's DB.
  Solved with the push/pull sync script using Kestra CLI.

### Recommendations

- Kestra `user: "root"` is mandatory for Docker runner (Docker socket access).
- Always set `networkMode` in task runner config when tasks need DB access.
- Docker network name follows pattern: `{compose-project}_{network-name}`.
- Use `containerImage: python:3.12-slim` on all script tasks.
- Use `engine.begin()` (not `engine.connect()`) for SQLAlchemy transactions.
- Use `runIf` (not `if`) for conditional task execution in Kestra flows.
- Push flows after editing: `KESTRA_USER=... ./scripts/kestra_flow_sync.sh push`
- Kestra's built-in Logs tab captures all `print()` output from script tasks.

### Test Results

- No new unit tests (infrastructure/config session).
- Full pipeline tested via API: ingest-csv (2 rows) + parse-listings both SUCCESS.
- Parser confidence: 1.0 on both test listings (nhà phố sell + căn hộ rent).

### Files Created/Modified

New files:
- `kestra/flows/re-nhatrang.demo-file-test.yml` — diagnostic flow
- `scripts/kestra_flow_sync.sh` — bidirectional flow sync

Modified:
- `docker-compose.yml` — Gemini API key, AI copilot config, Docker socket,
  shared temp dir, `user: "root"`, tmpDir config
- `kestra/flows/re-nhatrang.ingest-csv.yml` — Docker runner, networkMode,
  auto_parse toggle, subflow call, removed custom log writing
- `kestra/flows/re-nhatrang.parse-listings.yml` — Docker runner, networkMode,
  engine.begin(), removed custom log writing
- `.env.example` — added KESTRA_USER and ENV_GEMINI_API_KEY
- `docs/TESTING_LOG.md` — session 3 test observations
- `docs/ARCHITECTURE.md` — added infrastructure diagram
- `docs/USAGE.md` — updated for current flow structure, removed JSON log docs
- `CLAUDE.md` — updated session reference
- `CHANGELOG.md` — added [Unreleased] block

Deleted:
- `kestra/flows/re-nhatrang.full-pipeline.yml` — merged into ingest-csv

---

## Session 2 — 2026-02-05 — Execution Logging and Backup/Restore

### Summary

Added observability infrastructure: automatic execution logging from Kestra
flows, a CLI log viewer, Kestra database backup/restore with auto-rehydration
on startup, and human testing documentation.

### Features Delivered

- `docs/TESTING_LOG.md` — human-authored testing journal with template
- `docs/SESSION_LOG.md` — coding session history (this file)
- `logs/kestra/` — auto-generated JSON execution logs from Kestra flows
- `logs/kestra/backups/` — Kestra Postgres backup storage
- `scripts/show_execution_log.py` — CLI viewer for execution logs
  (supports `--last N`, `--flow`, `--failures` filters)
- `scripts/backup_kestra_db.sh` — on-demand Kestra DB backup with retention pruning
- `scripts/restore_kestra_db.sh` — restore script used by init container
- `kestra-restore` init container in docker-compose — auto-restores latest
  backup into fresh Kestra DB on startup
- Kestra flows now emit JSON summaries with row counts, success rates,
  and sample failure details
- Updated `docs/USAGE.md` with logging, backup, and restore documentation

### Architecture Decisions

- **Dual logging strategy**: Kestra UI retains execution history in its own
  Postgres (volatile — lives in Docker volume). JSON files in `logs/kestra/`
  persist in the repo and survive volume wipes.
- **Init container for restore**: `kestra-restore` runs once on `docker compose up`,
  checks if Kestra DB is empty, restores from latest backup if available,
  then exits. Zero-friction — no manual intervention needed.
- **Backup is manual, restore is automatic**: Backups require explicit
  `./scripts/backup_kestra_db.sh` (intentional — you choose when to snapshot).
  Restore is automatic on fresh DB detection (safe — only runs when DB is empty).
- **Separate human and machine logs**: `docs/TESTING_LOG.md` for observations,
  `logs/kestra/` for machine data. Different audiences, different formats.

### Challenges

- Kestra script tasks run in isolated containers and cannot write directly to
  host filesystem. Solved by mounting `./logs/kestra` as a volume into the
  Kestra container at `/app/logs/kestra`.
- Parse-listings flow needed a second DB connection to query sample failures
  after the main transaction committed.

### Recommendations

- Run `./scripts/backup_kestra_db.sh` before any `docker compose down -v`.
- JSON execution logs are git-tracked (repo is private). Revisit if repo
  goes public — may want to gitignore `logs/kestra/*.json`.
- `KESTRA_BACKUP_DAYS` env var controls both backup pruning and restore
  eligibility window (default: 30 days).

### Test Results

- No new tests in this session (infrastructure/config changes only).
- Existing 57 tests still passing.

### Files Created/Modified

New files:
- `docs/TESTING_LOG.md`
- `docs/SESSION_LOG.md`
- `logs/kestra/.gitkeep`
- `logs/kestra/backups/.gitkeep`
- `scripts/show_execution_log.py`
- `scripts/backup_kestra_db.sh`
- `scripts/restore_kestra_db.sh`

Modified:
- `docker-compose.yml` — added logs volume mount, kestra-restore init container
- `kestra/flows/re-nhatrang.ingest-csv.yml` — added JSON log output step
- `kestra/flows/re-nhatrang.parse-listings.yml` — added JSON log output step
- `.env.example` — added `KESTRA_BACKUP_DAYS`
- `docs/USAGE.md` — added logging, backup, restore, and testing docs sections
- `CLAUDE.md` — updated session documentation, added session 2 recommendations

---

## Session 1 — 2026-02-05 — V1 MVP Implementation

### Summary

Implemented the full V1 MVP: manual CSV ingestion pipeline with Vietnamese
regex-based listing parser, orchestrated by Kestra, backed by PostgreSQL
with pgvector.

### Features Delivered

- Docker Compose environment (Kestra + App Postgres + Kestra Postgres + Redis)
- Zalo text-to-CSV transformer (`src/ingestion/zalo_transformer.py`)
- CSV validator and database loader (`src/ingestion/csv_loader.py`)
- Vietnamese listing parser with regex extraction (`src/parsing/vietnamese_parser.py`)
- Parse orchestration module (`src/parsing/parse_listings.py`)
- 3 Kestra flows: `ingest-csv`, `parse-listings`, `full-pipeline`
- CLI scripts: `transform_zalo_export.py`, `seed_sample_data.py`
- Sample data: 8 example listings in both raw text and CSV format
- 57 tests (all passing)

### Architecture Decisions

- **Kestra over Celery for V1**: Kestra provides a UI for manual CSV upload and
  flow triggering out of the box. Celery would require building a separate
  upload mechanism. Celery/Redis kept in plan for V1.1+ async processing.
- **Separate Postgres instances**: Kestra gets its own Postgres to isolate
  metadata from application data. App Postgres uses pgvector image for
  future embedding support.
- **Inline scripts in Kestra flows**: Kestra script tasks run in isolated
  containers. The parser logic is duplicated inline in the Kestra flow YAML
  rather than importing from `src/`. Trade-off: duplication vs. simplicity.
  Acceptable for V1; revisit when parser logic grows.
- **Regex-based parser**: No LLM dependency for V1. Handles common Vietnamese
  listing patterns. LLM augmentation deferred to V2.

### Challenges

- No official Zalo API for reading group messages. V1 works around this with
  manual copy-paste and text file transformation.
- Vietnamese text has many spelling variants (with/without diacritics,
  abbreviations). Parser handles common variants but not exhaustive.

### Recommendations

- Kestra flows must use inline Python scripts, not project imports.
- Parser confidence score = extracted fields / 5 key fields.
- When adding new Vietnamese keywords to the parser, add both diacritics
  and non-diacritics forms.
- `uv` is the package manager; venv lives at `.venv/`.

### Test Results

- 57 passed, 0 failed
- Ruff lint: all checks passed

### Files Created

26 new files — see git log for full list.

---

<!-- Template for new sessions:

## Session N — YYYY-MM-DD — Brief Title

### Summary

One paragraph: what was the goal and what was accomplished.

### Features Delivered

- Bullet list of user-facing features or capabilities added.

### Architecture Decisions

- Decision made and rationale. Include trade-offs considered.

### Challenges

- Problems encountered and how they were resolved.

### Recommendations

- Tips, gotchas, things to keep in mind for future sessions.

### Test Results

- Pass/fail counts and any notable coverage changes.

### Files Created/Modified

- Summary of structural changes to the codebase.

-->
