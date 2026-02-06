# Usage Guide — RE Nha Trang V1

## Prerequisites

- Docker and Docker Compose installed
- Python 3.12+
- uv (installed via `curl -LsSf https://astral.sh/uv/install.sh | sh`)

## Initial Setup (one-time)

```bash
# 1. Clone the repo and enter the directory
cd re-nhatrang

# 2. Copy environment template and adjust if needed
cp .env.example .env

# 3. Create Python virtual environment and install dependencies
uv venv .venv
source .venv/bin/activate
uv pip install -e ".[dev]"

# 4. Start all services
docker compose up -d
```

Wait for all services to be healthy:

```bash
docker compose ps
```

You should see:
- `app-postgres` (port 5432) — application database with pgvector
- `kestra-postgres` (port 5433) — Kestra internal metadata
- `kestra` (ports 8080, 8081) — workflow orchestration UI
- `redis` (port 6379) — cache
- `kestra-restore` — init container (runs once and exits)

The `app-postgres` container automatically runs `src/db/init_db.sql` on first
start, creating the `raw_listings` and `parsed_listings` tables.

## The Pipeline: Step by Step

```
+----------------------------+
|   1. Collect messages      |
|                            |
|   Copy-paste from Zalo     |
|   Save as .txt file        |
+-------------+--------------+
              |
              v
+----------------------------+
|   2. Transform to CSV      |
|                            |
|   Run transform script     |
|   (local, no Docker)       |
+-------------+--------------+
              |
              v
+----------------------------+
|   3. Upload to Kestra      |
|                            |
|   Open UI, trigger flow,   |
|   upload CSV file           |
+-------------+--------------+
              |
              v
+----------------------------+
|   4. View results          |
|                            |
|   Query parsed_listings    |
|   table via psql           |
+----------------------------+
```

### Step 1: Collect Messages from Zalo

Open your Zalo group chat, select the messages you want, and copy-paste them
into a text file. Two formats are supported:

**Format A — Zalo export style** (preferred, if your Zalo client supports it):

```
[10:30 15/01/2025] Nguyen Van A: Ban nha mat tien duong Tran Phu...
[11:45 15/01/2025] Tran Thi B: Cho thue can ho chung cu...
```

**Format B — Raw copy-paste** (just the message text, one per block):

```
Ban nha mat tien duong Tran Phu, phuong Loc Tho, 3 tang, gia 8.5 ty
Cho thue can ho Muong Thanh, 2 phong ngu, 8 trieu/thang
```

Save the file anywhere — a good convention is:

```
data/zalo_export_2025-01-20.txt
```

### Step 2: Transform to CSV

Activate the virtual environment, then run the transform script:

```bash
source .venv/bin/activate

python scripts/transform_zalo_export.py \
    data/zalo_export_2025-01-20.txt \
    data/zalo_export_2025-01-20.csv \
    --group "BDS Nha Trang 24/7"
```

Arguments:
- **arg 1**: input text file path
- **arg 2** (optional): output CSV path. If omitted, creates
  `<input_name>_transformed.csv` in the same directory.
- **--group / -g**: Zalo group name tag (metadata, helps track where listings
  came from)

This produces a CSV with columns:
`source_group, sender_name, message_text, message_date, source`

You can inspect it before uploading:

```bash
# Quick look at the CSV
head -5 data/zalo_export_2025-01-20.csv
```

**Alternatively**, to generate sample data for testing:

```bash
python scripts/seed_sample_data.py
# Creates data/samples/sample_listings.csv with 8 example listings
```

### Step 3: Upload CSV and Run Pipeline via Kestra

Make sure Docker services are running (`docker compose up -d`), then:

1. Open **http://localhost:8080** in your browser (Kestra UI).
2. Navigate to **Flows** in the left sidebar.
3. You will see flows under the `re-nhatrang` namespace:

| Flow | What it does |
|------|--------------|
| `ingest-csv` | Loads CSV into DB, optionally parses (auto_parse=true by default) |
| `parse-listings` | Parses pending raw listings into structured data |
| `demo-file-test` | Diagnostic: upload a CSV and log its contents |

**For normal use, run `ingest-csv`:**

4. Click **ingest-csv** then click **New Execution** (or the play button).
5. Upload your CSV file in the `csv_file` input field.
6. Leave `auto_parse` checked (default: true) to automatically parse after ingestion.
7. Click **Execute**.
8. Watch the execution log in the **Logs** tab. When done, you will see output like:
   ```
   Ingested 15 listings with batch_id=abc123
   Parse complete: 13 parsed, 2 failed, 15 total
   ```

### Step 4: View Results

Connect to the application database and query:

```bash
# Connect via psql (password: see your .env file)
psql -h localhost -p 5432 -U re_nhatrang -d re_nhatrang
```

Useful queries:

```sql
-- Count all raw listings
SELECT status, COUNT(*) FROM raw_listings GROUP BY status;

-- View latest parsed listings
SELECT property_type, transaction_type, price_vnd, area_m2,
       ward, street, confidence
FROM parsed_listings
ORDER BY parsed_at DESC
LIMIT 20;

-- Find listings in a specific ward
SELECT * FROM parsed_listings WHERE ward = 'Loc Tho';

-- Find houses for sale under 5 billion VND
SELECT * FROM parsed_listings
WHERE property_type = 'nha'
  AND transaction_type = 'ban'
  AND price_vnd < 5000000000;

-- Check parsing failures
SELECT rl.message_text, pl.parse_errors, pl.confidence
FROM parsed_listings pl
JOIN raw_listings rl ON rl.id = pl.raw_listing_id
WHERE pl.confidence < 0.4;
```

## Quick Reference

### Property Types

| Code | Vietnamese | English |
|------|-----------|---------|
| `nha` | nha, nha pho, nha mat tien | House |
| `dat` | dat, dat nen, lo dat | Land |
| `can_ho` | can ho, chung cu | Apartment |
| `phong_tro` | phong tro, nha tro | Room for rent |
| `biet_thu` | biet thu | Villa |
| `khach_san` | khach san | Hotel |
| `mat_bang` | mat bang | Commercial space |

### Transaction Types

| Code | Vietnamese | English |
|------|-----------|---------|
| `ban` | ban, can ban, ban gap | For sale |
| `cho_thue` | cho thue, can thue | For rent |

### Price Units

| Unit | Multiplier | Example |
|------|-----------|---------|
| ty / ti | x 1,000,000,000 | "3.5 ty" = 3.5 billion VND |
| trieu / tr | x 1,000,000 | "350 trieu" = 350 million VND |
| t | x 1,000,000,000 | "3.5t" = 3.5 billion VND |

## Development

### Running Tests

```bash
source .venv/bin/activate
pytest tests/ -v
```

### Linting

```bash
ruff check src/ tests/
ruff format src/ tests/
```

### Stopping Services

```bash
docker compose down        # Stop containers, keep data
docker compose down -v     # Stop containers AND delete all data volumes
```

## Execution Logs

All execution logging is handled by Kestra's built-in system:

- **Executions tab** in the Kestra UI (localhost:8080) shows execution history,
  status, duration, and task details.
- **Logs tab** on each execution shows all `print()` output from script tasks
  (row counts, success rates, error messages).

This data lives in the `kestra-pg-data` Docker volume and survives
`docker compose down`. It is only lost with `docker compose down -v`
(use backup/restore to preserve it across volume wipes).

## Kestra Database Backup and Restore

To preserve Kestra execution history across volume wipes:

### Manual backup

```bash
# Create a backup (while services are running)
./scripts/backup_kestra_db.sh

# Backups go to logs/kestra/backups/kestra_YYYY-MM-DD_HHMMSS.sql.gz
# Old backups beyond KESTRA_BACKUP_DAYS (default 30) are auto-pruned
```

### Automatic restore on startup

When you `docker compose up`, an init container (`kestra-restore`) checks
if the Kestra database is empty. If it is AND a backup exists within the
retention window, it automatically restores the latest backup. You will see
this in the logs:

```
kestra-restore  | Kestra restore: restoring from /backups/kestra_2026-02-05_143000.sql.gz ...
kestra-restore  | Kestra restore: completed successfully.
```

If the database already has data, it skips the restore silently.

### Recommended workflow

```bash
# Before a destructive reset
./scripts/backup_kestra_db.sh

# Now safe to wipe
docker compose down -v

# Next startup auto-restores
docker compose up -d
# kestra-restore container runs, restores backup, then exits
```

### Controlling retention

Set `KESTRA_BACKUP_DAYS` in your `.env` file (default: 30). Only backups
within this window are considered for restore or kept during pruning.

## Testing Documentation

Record your observations from test runs in `docs/TESTING_LOG.md`. This is
for human-authored notes: edge cases, parser gaps, Zalo message patterns
you notice. See the template at the top of that file.

## Kestra Flow Sync

Flow YAML files live in `kestra/flows/` and are loaded on Kestra startup.
To sync changes between host files and the Kestra DB:

```bash
# Push host files to Kestra (overwrites DB, deletes flows not on host)
KESTRA_USER='user@email.com:password' ./scripts/kestra_flow_sync.sh push

# Pull flows from Kestra DB to host files
KESTRA_USER='user@email.com:password' ./scripts/kestra_flow_sync.sh pull
```

Set `KESTRA_USER` in your `.env` file to avoid typing it each time.

**Note**: Editing flows in the Kestra UI does NOT sync back to host files.
Always push after editing files locally. Always pull after editing in the UI.

## File Organization

```
data/                              <-- Your raw exports and CSVs
  samples/                         <-- Pre-made sample data
    sample_zalo_messages.txt
    sample_listings.csv
  zalo_export_YYYY-MM-DD.txt       <-- Your raw Zalo exports
  zalo_export_YYYY-MM-DD.csv       <-- Transformed CSVs
kestra/
  flows/                           <-- Kestra flow definitions
    re-nhatrang.ingest-csv.yml
    re-nhatrang.parse-listings.yml
    re-nhatrang.demo-file-test.yml
logs/
  kestra/
    backups/                       <-- Kestra DB backups
      kestra_YYYY-MM-DD_HHMMSS.sql.gz
scripts/
  kestra_flow_sync.sh             <-- Push/pull flows to/from Kestra
  backup_kestra_db.sh             <-- Manual Kestra DB backup
  restore_kestra_db.sh            <-- Auto-restore (used by init container)
  transform_zalo_export.py        <-- Zalo text -> CSV transformer
  seed_sample_data.py             <-- Generate sample test data
docs/
  TESTING_LOG.md                   <-- Your manual testing observations
  SESSION_LOG.md                   <-- Coding session history
  ARCHITECTURE.md                  <-- System design and diagrams
  USAGE.md                         <-- This file
```

## Troubleshooting

**Kestra UI not loading at localhost:8080**
- Check that all containers are running: `docker compose ps`
- Kestra takes 30-60 seconds to start; check logs: `docker compose logs kestra`

**Flows not visible in Kestra UI**
- Flows are loaded from `kestra/flows/` on startup via `--flow-path`
- After editing flow files, push them: `KESTRA_USER=... ./scripts/kestra_flow_sync.sh push`
- Or restart Kestra: `docker compose restart kestra`

**"could not translate host name app-postgres"**
- Task containers need `networkMode: re-nhatrang_re-nhatrang` in their
  taskRunner config to reach compose services. Check the flow YAML.

**"Illegal state: refCnt: 0, decrement: 1"**
- Usually a storage permissions issue, not a FILE lifecycle bug.
- Ensure Kestra runs as `user: "root"` in docker-compose.yml.

**Database connection refused**
- Verify `app-postgres` is healthy: `docker compose ps`
- Check port 5432 is not used by another Postgres instance

**Parser extracting wrong values**
- Check the raw text in `raw_listings.message_text`
- Look at `parsed_listings.parse_errors` for specific issues
- The parser relies on Vietnamese keywords; heavily abbreviated or
  non-standard text may not parse well (confidence will be low)

**Stale flows in Kestra after deleting files**
- Deleting flow files from host does NOT remove them from Kestra's DB.
- Use `./scripts/kestra_flow_sync.sh push` (includes `--delete` flag).
