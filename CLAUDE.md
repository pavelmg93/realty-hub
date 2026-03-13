# CLAUDE.md — Instructions for Claude Code

## Project Overview

This is **ProMemo** — the Wealth Realty internal real estate agent platform by fidt.vn.
It is also the broader **RE Nha Trang** data pipeline project. Both live in this repo.

**ProMemo** (primary active development):
- Next.js 15 web app for agents: listings, feed, messaging, CRM
- Located in `web/`
- Accessed at http://localhost:8888 (Docker) or http://localhost:3000 (local dev)

**Pipeline** (set aside for Demo, active for MVP):
- Python 3.12 Vietnamese parser, Playwright scraper
- Kestra orchestration (commented out in docker-compose for Demo)
- Located in `src/`

## Tech Stack

**Web app (ProMemo):**
- Next.js 15, React 19, TypeScript, Tailwind v4
- PostgreSQL via raw pg Pool (no ORM)
- bcrypt + JWT in httpOnly cookie (login only — NO public signup)
- react-leaflet + Leaflet for maps (OSM/Nominatim)

**Pipeline:**
- Python 3.12+, PostgreSQL (pgvector), Redis
- Kestra for orchestration (disabled for Demo)
- Regex/rule-based Vietnamese parser (V1)
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

# Web app available at:
# http://localhost:8888  (via Docker port mapping 8888→3000)
# http://localhost:3000  (when running `npm run dev` locally, outside Docker)

# Stop services
docker compose down

# Transform a Zalo export to CSV
python scripts/transform_zalo_export.py data/my_export.txt -g "Group Name"

# Generate sample data for testing
python scripts/seed_sample_data.py

# Create a new agent account (NO public signup — admin only)
./scripts/create_agent.sh <username> <first_name> <password> [phone] [email]
# Example: ./scripts/create_agent.sh dean "Duy (Dean) Pham" demo123 0868331111 dean@fidt.vn

# Run migrations (after docker compose down -v && up -d)
docker exec -i re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang \
  < src/db/seed_reference_data.sql
docker exec -i re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang \
  < src/db/migrations/002_add_listing_hash_and_message_date.sql
# ... through 007 and 008 (CRM schema)

# Python pipeline (set aside for Demo)
source .venv/bin/activate
pytest tests/ -v
python -m src.scraping.cli --site batdongsannhatrang --agent-phone 0901953889
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

**Latest web app session: #12 — 2026-03-07 — Agent & Person Profiles, Message Property Bar, CRM Filters**
**Latest pipeline session: #9b — 2026-02-14 — Web Scraping Bug Fixes**
**Planning session: 2026-03 — Demo roadmap, GCP infra, CURSOR.md created**

Recommendations:
- **Session 12**: Agent profile at `/dashboard/agents/[id]`; person profile at `/dashboard/crm/person/[id]`; CRM agents filterable by All / Favorite / Active; favorites via `/api/crm/favorites`; message thread shows associated property bar when conversation has listing_id. Stitch mockups in `stitch_property_details_view/`.
- **Migration 007** adds `source_url`, `source_listing_id` to raw_listings; `road_width_m`, `num_frontages`, `distance_to_beach_m` to parsed_listings.
- After `docker compose down -v && up -d`, run migrations 002-007 and seed_reference_data.sql.
- Create agent before scraping: `./scripts/create_agent.sh chauloan "Chau Loan" bdsntorg 0901953889`
- Run scraper: `python -m src.scraping.cli --site batdongsannhatrang --agent-phone 0901953889 --max-listings 5`
- Scraper dependencies: `uv pip install -e ".[scraping]"` + `playwright install chromium`
- Photos stored in `./uploads/listings/<parsed_id>/` with content-hashed filenames.
- Scraper overlays structured JSON from site on top of Vietnamese parser results.
- Re-running scraper skips already-imported URLs (unique index on source_url).
- `uv` installed at `~/.local/bin/uv`; venv at `.venv/`.
- Docker container name: `re-nhatrang-app-postgres-1` (not `renhatrang-postgres`).
- DB credentials: user=re_nhatrang, db=re_nhatrang (underscores, not plain).

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