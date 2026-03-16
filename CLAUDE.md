# CLAUDE.md — Instructions for Claude Code

## What This Project Is

**ProMemo** — internal real estate agent platform for Wealth Realty (fidt.vn).
Agents share listings, message each other, manage CRM contacts and deals.

This repo also contains a Python pipeline (parser, scraper) — **currently set aside for Demo phase, but available and should not be broken**.

Active development focus is **the web app** (`web/`).

---

## Repo Structure

```text
web/                          <- Next.js app (primary active work)
src/                          <- Python pipeline + DB migrations
  db/
    init_db.sql               <- Initial schema
    seed_reference_data.sql   <- Nha Trang wards + streets
    migrations/               <- 002 through 011, run in order
  scraping/                   <- Playwright scraper (inactive for Demo)
  parsing/                    <- Vietnamese regex parser
scripts/
  create_agent.sh             <- Admin account creation
  deploy-vm.sh               <- GCP VM deployment (one-command)
docs/
  SCHEMA.md                   <- Canonical DB schema (source of truth)
  CHANGELOG.md                <- What changed
  ARCHITECTURE.md             <- System design
  USAGE.md                    <- How to operate
  ROADMAP-v2.md               <- Feature roadmap
  SCOPE.md                    <- Active sprint and next actions
  SPECIFICATIONS.md           <- Feature specs
  GEMINI_SETUP.md             <- Gemini API setup
  adrs/                       <- Architecture Decision Records
  code_sessions/              <- Individual session logs (YYYY-MM-DD-topic.md)
  test_sessions/              <- Individual QA/test logs (YYYY-MM-DD-test-topic.md)
  archive/                    <- Old agent instruction files
README.md
CLAUDE.md                     <- This file
```

---

## Tech Stack

**Web app:**
- Next.js 15, React 19, TypeScript, Tailwind v4
- PostgreSQL via raw `pg` Pool — **no ORM**
- bcrypt + JWT in httpOnly cookie — login only, **no public signup**
- react-leaflet + Leaflet for maps (OSM / Nominatim)
- Gemini API for AI listing parse (`GEMINI_API_KEY` in `.env`)

**Python pipeline (available, not active for Demo):**
- Python 3.12+, PostgreSQL, Redis
- Kestra orchestration (disabled in docker-compose for Demo)
- Regex/rule-based Vietnamese parser
- `uv` for Python dependency management (at `~/.local/bin/uv`)
- venv at `.venv/`

---

## Running the App

```bash
# Start all services
docker compose up -d

# Ports:
# Web app:  http://localhost:8888  (Docker maps 8888->3000 inside container)
# pgAdmin:  http://localhost:5050
# Postgres: 5432
# Redis:    6379

# Note: npm run dev (outside Docker) runs on port 3000

# View logs
docker compose logs web -f --tail=50

# Rebuild web container (only needed after Dockerfile changes)
docker compose build web && docker compose up -d

# TypeScript check — always run from web/ directory
cd web && npx tsc --noEmit
```

---

## Database

**Schema source of truth: `docs/SCHEMA.md`**

```bash
# Connect
docker exec -it re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang

# Run a migration
docker exec -i re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang \
  < src/db/migrations/010_avatar_listing_i18n.sql

# After fresh docker compose down -v && up -d, run in order:
# seed_reference_data.sql, then migrations 002 through 011
```

**Credentials:**
- User: `re_nhatrang`
- DB: `re_nhatrang`
- Container: `re-nhatrang-app-postgres-1`

**Current migration level: 012**

---

## Agent Accounts

No public signup. Admin creates accounts only:

```bash
./scripts/create_agent.sh <username> <display_name> <password> [phone] [email]

# Demo accounts:
./scripts/create_agent.sh pavel "Pavel" demo123
./scripts/create_agent.sh dean "Duy (Dean) Pham" demo123 0868331111 dean@fidt.vn
```

---

## Python Pipeline Commands

```bash
# Activate venv
source .venv/bin/activate

# Run parser tests
pytest tests/ -v

# Lint / format
ruff check src/ tests/
ruff format src/ tests/

# Run scraper (when active)
python -m src.scraping.cli --site batdongsannhatrang --agent-phone 0901953889 --max-listings 5

# Scraper dependencies (first time)
uv pip install -e ".[scraping]"
playwright install chromium
```

---

## Key Conventions

**Database:**
- Raw SQL only via `pg` Pool in `web/src/lib/db.ts` — no ORM ever
- `price_vnd`, `price_per_m2`, `rental_income_vnd` are BIGINT — node-postgres returns them as **strings**. Always coerce: `parseInt(row.price_vnd) || null`
- `persons`, `deals`, `deal_events`, `person_listings` use **UUID** PKs
- `agents`, `parsed_listings`, `conversations`, `messages` use **integer** PKs
- When creating a `conversations` row, `agent_1_id` must always be the lower integer (enforced by CHECK constraint)

**i18n:**
- All UI strings go through `t()` from `useLanguage()`
- Keys defined in `web/src/lib/i18n.ts` — add new keys there **before** using them in components
- UI language is Vietnamese (vi) primary, English (en) secondary

**Design:**
- CSS variables defined in `web/src/lib/tokens.ts` and `web/src/app/globals.css`
- Use `var(--orange)`, `var(--bg-surface)`, `var(--text-primary)` etc. — never hardcode colors
- Dark theme only — no light mode variants needed
- Design reference mockups in `stitch_property_details_view/`

**Photos:**
- Stored at `./uploads/listings/<parsed_listing_id>/`
- Content-hashed filenames

**Security:**
- Never commit `.env` — use `.env.example` as template
- Never hardcode API keys — always load from environment variables

**Files:**
- UTF-8 encoding, LF line endings

---

## What Is Disabled (Do Not Enable)

| Component | Notes |
|---|---|
| Kestra orchestration | Commented out in docker-compose — Demo phase only |
| Zalo ingestion pipeline | Future architecture, do not modify |
| Web scraping | Future, do not enable for Demo work |

---

## Demo Users

| Username | Password |
|---|---|
| `pavel` | `demo123` |
| `dean` | `demo123` |

---

## Session Kickoff & Scope Management

When we begin a new task, or if I ask "what should we do next":
1. **Read `docs/SCOPE.md` immediately.**
2. Focus **only** on the items listed under `## 🚀 Next Actions (Immediate execution)`. 
3. Do not suggest or write code for items in the Backlog or Someday/Maybe sections unless I explicitly command you to.
4. When we successfully complete a feature or fix a bug, explicitly remind me to check it off in `docs/SCOPE.md`.

---

## Logging Workflows (Session & Testing)

When I ask you to "log this session" or "generate a code session," you must:
1. Review the git diffs, files we modified, and the terminal history of our current conversation.
2. Create a new markdown file in `docs/code_sessions/` named `YYYY-MM-DD-brief-topic.md`.
3. Use the **Code Session Template** below. Do not ask me for permission to create the file, just draft it and summarize what you did.

When I ask you to "log this test" or "create a test session," you must:
1. Ask me for my manual testing observations if I haven't provided them yet.
2. Create a new markdown file in `docs/test_sessions/` named `YYYY-MM-DD-test-topic.md`.
3. Use the **Test Session Template** below. 

### Code Session Template
```text
# Session: [Brief Title]
**Date:** YYYY-MM-DD

### Summary
[One paragraph explaining the goal and what was actually accomplished. Include any context about infrastructure or deployment if relevant.]

### Technical Details & Fixes
* **Features Delivered:** [Bullet list of user-facing changes]
* **Architecture/DB Changes:** [Note any schema changes, Docker updates, or config shifts]
* **Challenges Resolved:** [Briefly explain any nasty bugs (like ENOENT or Postgres mismatches) and how we fixed them]

### Files Touched
[Generate a concise list of the primary files created or modified]
```

### Test Session Template
```text
# Test Run: [Brief Title]
**Date:** YYYY-MM-DD

### Context
* **What was tested:** [Which flow, data, or UI component]
* **Input source:** [e.g., Sample CSV, manual UI entry, specific Zalo payload]

### Observations
* **What worked:** [List successes]
* **What didn't:** [List errors, UI glitches, or pipeline failures]
* **AI & Parser Gaps:** [Critically important: Note if the LLM hallucinated, if the regex parser missed Vietnamese diacritics, or if Copilot gave bad advice]

### Action Items
- [ ] [Specific thing to fix in the next session]
```

---

## After Every Session

1. **Export chat:** Run `/export` to save a summary to `docs/chat_exports/YYYY-MM-DD-<slug>.md`. Do this proactively when the conversation is getting long, before context compaction hits.
2. **Log it:** Ask me to "generate a code session" so I document the work in `docs/code_sessions/`.
3. **Changelog:** Update `docs/CHANGELOG.md` — what was added/changed/fixed.
4. **Schema:** Update `docs/SCHEMA.md` — if any migrations were applied.
5. **Compile check:** Run `cd web && npx tsc --noEmit` — confirm clean before committing.
6. **Commit:** `git add -A && git commit -m "Session N: <one-line summary>"`

## Chat Exports

Saved in `docs/chat_exports/`. Run `/export` any time — especially:
- When the conversation is getting long (proactively, before compaction)
- After completing a major feature or debugging session
- Before ending a session

The export captures: summary, decisions, files changed, problems solved, pending items, deployment notes.

**Current session number: 17**
**Last completed session: 16 — 2026-03-16 — Photo & Document Staging at Listing Creation**
**Deployment: Google Cloud VM — see `docs/DEPLOYMENT.md` for full guide**