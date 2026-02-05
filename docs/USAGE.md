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

Wait for all 4 services to be healthy:

```bash
docker compose ps
```

You should see:
- `app-postgres` (port 5432) — application database with pgvector
- `kestra-postgres` (port 5433) — Kestra internal metadata
- `kestra` (ports 8080, 8081) — workflow orchestration UI
- `redis` (port 6379) — cache

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
3. You will see three flows under the `re-nhatrang` namespace:

| Flow | What it does |
|------|--------------|
| `ingest-csv` | Loads CSV into `raw_listings` table only |
| `parse-listings` | Parses pending raw listings into structured data |
| `full-pipeline` | Does both: ingest + parse in one step |

**For normal use, run `full-pipeline`:**

4. Click **full-pipeline** then click **New Execution** (or the play button).
5. Upload your CSV file in the `csv_file` input field.
6. Click **Execute**.
7. Watch the execution log. When done, you will see output like:
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

Every Kestra flow execution automatically writes a JSON summary to
`logs/kestra/`. These persist in the repo regardless of Docker volume state.

### Viewing logs from the command line

```bash
# Show all execution logs (newest first)
python scripts/show_execution_log.py

# Show last 5 executions
python scripts/show_execution_log.py --last 5

# Filter by flow name
python scripts/show_execution_log.py --flow ingest
python scripts/show_execution_log.py --flow parse

# Only show executions that had parse failures
python scripts/show_execution_log.py --failures
```

### Log contents

Each JSON file contains:

**Ingest logs** — rows ingested, source groups seen, empty message warnings.

**Parse logs** — total/parsed/failed counts, success rate, and up to 5 sample
failures with text previews and error details (useful for improving the parser).

### Kestra UI execution history

The Kestra UI at localhost:8080 also shows execution history. This data lives
in the `kestra-pg-data` Docker volume and survives `docker compose down`.
It is only lost with `docker compose down -v`.

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

## File Organization

```
data/                              <-- Your raw exports and CSVs
  samples/                         <-- Pre-made sample data
    sample_zalo_messages.txt
    sample_listings.csv
  zalo_export_YYYY-MM-DD.txt       <-- Your raw Zalo exports
  zalo_export_YYYY-MM-DD.csv       <-- Transformed CSVs
logs/
  kestra/                          <-- Auto-generated execution logs
    YYYY-MM-DD_flow-name_execid.json
    backups/                       <-- Kestra DB backups
      kestra_YYYY-MM-DD_HHMMSS.sql.gz
docs/
  TESTING_LOG.md                   <-- Your manual testing observations
  SESSION_LOG.md                   <-- Coding session history
```

## Troubleshooting

**Kestra UI not loading at localhost:8080**
- Check that all containers are running: `docker compose ps`
- Kestra takes 30-60 seconds to start; check logs: `docker compose logs kestra`

**Flows not visible in Kestra UI**
- Flows are loaded from `kestra/flows/` volume mount
- Restart Kestra if you added new flow files: `docker compose restart kestra`

**Database connection refused**
- Verify `app-postgres` is healthy: `docker compose ps`
- Check port 5432 is not used by another Postgres instance

**Parser extracting wrong values**
- Check the raw text in `raw_listings.message_text`
- Look at `parsed_listings.parse_errors` for specific issues
- The parser relies on Vietnamese keywords; heavily abbreviated or
  non-standard text may not parse well (confidence will be low)
