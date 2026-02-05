# CLAUDE.md — Instructions for Claude Code

## Project Overview

RE Nha Trang is a Real Estate Agent Matching Platform for the Nha Trang market. It ingests listings from Zalo groups, normalizes them, and matches them to buyer agent requirements.

## Tech Stack

- Python 3.12+, PostgreSQL (pgvector), Redis
- Kestra for workflow orchestration (replaces Celery for V1)
- Regex/rule-based Vietnamese text extraction (V1); LLM-based planned for V2
- Docker Compose for local development
- uv for Python dependency management

## Code Conventions

- **Language**: Python. All source code in `src/`, tests in `tests/`.
- **Style**: Follow PEP 8. Use type hints on all function signatures.
- **Formatting**: Use `ruff` for linting and formatting.
- **Imports**: Use absolute imports from `src` package root.
- **Naming**: snake_case for functions/variables, PascalCase for classes, UPPER_SNAKE_CASE for constants.
- **Docstrings**: Google-style docstrings on public functions and classes.

## Project-Specific Context

- The target market is Nha Trang, Vietnam. Listing data is in Vietnamese.
- Zalo is the primary messaging platform used by local agents. Zalo API access may be limited — design ingestion to be adaptable (API, scraping, manual import).
- Currency is VND (Vietnamese Dong). Prices are often stated in billions (tỷ) or millions (triệu).
- Property measurements use square meters (m²).
- Location data references Nha Trang neighborhoods, wards (phường), and streets.

## Architecture

- See `docs/ARCHITECTURE.md` for full system design.
- See `docs/USAGE.md` for how to operate the V1 pipeline.
- V1 pipeline: Manual CSV Ingestion -> Vietnamese Regex Parser -> PostgreSQL.
- Kestra orchestrates ETL flows (manual trigger via UI at localhost:8080).
- Future pipelines: Matching (V1.1), Notification (V2).

## Testing

- Use `pytest` for all tests.
- Test files mirror source structure: `tests/test_<module>.py`.
- Aim for tests on all business logic (parsing, matching, scoring).

## Common Commands

```bash
# Activate virtual environment
source .venv/bin/activate

# Run tests
pytest tests/ -v

# Run linter
ruff check src/ tests/

# Format code
ruff format src/ tests/

# Start development services (Kestra + Postgres + Redis)
docker compose up -d

# Stop services
docker compose down

# Transform a Zalo export to CSV
python scripts/transform_zalo_export.py data/my_export.txt -g "Group Name"

# Generate sample data for testing
python scripts/seed_sample_data.py
```

## Important Warnings

- Never commit `.env` files or API keys. Use `.env.example` for templates.
- Zalo API credentials and LLM API keys are sensitive — always load from environment variables.
- Database migrations should be reviewed before applying to production.

## File Standards
- Always use UTF-8 encoding for all text files
- Use LF line endings (Unix-style), not CRLF

## Session Documentation

After every completed successful coding session, update `docs/SESSION_LOG.md`
with the full session entry. Keep only the latest session's key recommendations
below so this file stays concise. See `docs/SESSION_LOG.md` for complete history.

**Latest session: #2 — 2026-02-05 — Execution Logging and Backup/Restore**

Recommendations:
- Kestra flows must use inline Python scripts (not `from src import ...`) because
  Kestra script tasks run in isolated containers without the project's packages.
- Kestra flows auto-write JSON logs to `logs/kestra/` (mounted volume).
- Run `./scripts/backup_kestra_db.sh` before `docker compose down -v`.
- `kestra-restore` init container auto-restores on fresh DB startup.
- `KESTRA_BACKUP_DAYS` env var controls retention (default: 30 days).
- `uv` installed at `~/.local/bin/uv`; venv at `.venv/`.

## Documentation Style - ASCII Diagrams
- Use pure ASCII only: `+`, `-`, `|`, `>`, `<`, `v`, `^`
- No Unicode box-drawing or arrow characters
- Box width calculation:
  1. Find longest text line in the box
  2. Inner width = max(longest_line + 6, 20)
  3. This ensures minimum 3 chars padding each side
- All boxes in same diagram should use same width for alignment
- Example:
```
+----------------------------+     +----------------------------+
|         Ingestion          |---->|          Parsing           |
|                            |     |                            |
|   Zalo groups              |     |   Vietnamese NLP           |
|   monitoring               |     |   extraction               |
+----------------------------+     +----------------------------+
```