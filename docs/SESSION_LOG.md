# Session Log

Detailed record of each coding session. Updated after every completed
successful session.

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
