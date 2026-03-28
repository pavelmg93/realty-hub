# CLAUDE.md — Instructions for Claude Code

## What This Project Is

**Realty Hub** (formerly ProMemo) — internal real estate agent platform for Wealth Realty (fidt.vn).
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
  backup-db.sh                <- DB backup (Session 18)
  claude-log.sh               <- Chat export organizer (cron 30min)
docs/
  SCHEMA.md                   <- Canonical DB schema (source of truth)
  CHANGELOG.md                <- What changed
  ARCHITECTURE.md             <- System design
  DEPLOYMENT.md               <- VM deployment guide
  RUNBOOK.md                  <- Production operations (Session 18)
  USAGE.md                    <- How to operate
  ROADMAP-v2.md               <- Feature roadmap
  SCOPE.md                    <- Active sprint and next actions
  SPECIFICATIONS.md           <- Feature specs
  GEMINI_SETUP.md             <- Gemini API setup
  adrs/                       <- Architecture Decision Records (ADR-001 through ADR-003)
  code_sessions/              <- Individual session logs (YYYY-MM-DD-topic.md)
    SESSION_LOG.md            <- Legacy monolithic log (to be split + archived in Session 18)
  chat_exports/               <- Claude Code conversation exports
    {DATE}/                   <- Daily subdirectories (auto by claude-log.sh)
  test_sessions/              <- Individual QA/test logs (YYYY-MM-DD-test-topic.md)
  archive/                    <- Stale/legacy files
README.md
CLAUDE.md                     <- This file
```

---

## Tech Stack

**Web app:**
- Next.js 16, React 19, TypeScript, Tailwind v4
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
docker exec -it realty-hub-app-postgres-1 psql -U re_nhatrang -d re_nhatrang

# Run a migration
docker exec -i realty-hub-app-postgres-1 psql -U re_nhatrang -d re_nhatrang \
  < src/db/migrations/010_avatar_listing_i18n.sql

# After fresh docker compose down -v && up -d, run in order:
# seed_reference_data.sql, then migrations 002 through 011
```

**Credentials:**
- User: `re_nhatrang`
- DB: `re_nhatrang`
- Container: `realty-hub-app-postgres-1`

**Current migration level: 026**

---

## Agent Accounts

No public signup. Admin creates accounts only:

```bash
./scripts/create_agent.sh <username> <first_name> <last_name> <password> [phone] [email]

# Pilot accounts:
./scripts/create_agent.sh pavel "Pavel" "Garanin" pilot123 0868763267 pavel@fidt.vn
./scripts/create_agent.sh dean "Duy" "Pham" pilot123 0868331111 dean@fidt.vn
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

## Deployment

`deploy-vm.sh update` runs seed + migrate.sh + regenerate-titles.sh automatically.
NEVER suggest running migrations manually — deploy handles it.

**Claude Code does NOT push or deploy.** It commits locally and recommends a commit message.
User handles the full deploy chain: `git push` → SSH to VM → `git pull && ./scripts/deploy-vm.sh update`

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
| `pavel` | `pilot123` |
| `dean` | `pilot123` |

---

## Session Kickoff & Scope Management

When we begin a new task, or if I ask "what should we do next":
1. **Read `docs/SCOPE.md`** — it contains the session task list with Linear issue IDs.
2. **For each task, read the full spec from Linear:** Run `get_issue REA-XX` via Linear MCP to get the complete description, acceptance criteria, and comments. SCOPE.md only has one-line titles — the detail lives in Linear.
3. Focus ONLY on items listed in the current session section of SCOPE.md.
4. Do not suggest or write code for Backlog items unless explicitly told to.
5. When we complete a task, mark it `[x]` in SCOPE.md AND move the Linear issue to Done.

---

## Development Workflow

Two loops. Linear is the spec, files are the handoff.

### Planning (Claude.ai)
1. Review last session's deploy + test results
2. Create/update Linear issues with full specs (descriptions, acceptance criteria, comments)
3. Update `docs/SCOPE.md` with session task list (issue IDs + one-line titles only)
4. Create ADRs for architectural decisions → `docs/adrs/`
5. Commit planning artifacts to `main`

### Execution (Claude Code session)
1. Read `CLAUDE.md` (how) and `docs/SCOPE.md` (what)
2. **For each task: `get_issue REA-XX` via Linear MCP — read the FULL spec before coding**
3. Execute tasks top-down from SCOPE.md
4. Mark completed tasks with `[x]` in SCOPE.md
5. Move completed Linear issues to Done

### After Every Session (AUTOMATIC — do not wait for user to ask)
1. Create a code session log in `docs/code_sessions/YYYY-MM-DD-sessionNN-brief-topic.md` using the Code Session Template
2. Update `docs/CHANGELOG.md` with session changes
3. Mark completed tasks in `docs/SCOPE.md` with `[x]`
4. Run `cd web && npx tsc --noEmit` — confirm clean
5. `git add -A` and recommend commit message: `Session NN: <brief summary>`
6. Stop. User handles: `/export` → `git commit` → `git push` → VM deploy

### Rules
- If it's not in SCOPE.md, it doesn't exist for this session
- Linear issues are the source of truth for specs — SCOPE.md is just the checklist
- ADRs are read-only during execution — do not modify them
- CHANGELOG.md updated at end of session

## Branching Strategy

- **`main`** = production + daily work. Always deployable. Runs on GCP VM. Claude Code commits here.
- **Feature branches** (`feature/<n>`) = only for risky multi-session refactors. Branch off `main`, merge back when stable.

Daily workflow:
1. Claude Code works on `main`
2. After validated: deploy via `ssh VM && git pull && ./scripts/deploy-vm.sh update`

## Project Management

- **Linear** (linear.app/realty-hub): Client-facing board, issue tracking. Team: Realty Hub, prefix: REA.
- **SCOPE.md**: Session-level task contract for Claude Code (source of truth for daily work).
- Linear issues contain the FULL specs — always read them via MCP before coding.

## Linear MCP

Claude Code has access to Linear via MCP (cloud integration, no local setup needed).

**Available tools:** list_issues, get_issue, save_issue, save_comment, list_issue_statuses, list_issue_labels

**Workflow:**
- Before coding any task, run `get_issue REA-XX` to read the full spec
- After completing a task, move the issue to Done: `save_issue(id: "REA-XX", state: "Done")`
- If you discover a bug during execution, create a new issue: `save_issue(title: "...", team: "Realty Hub", ...)`
- Read comments on issues — they often contain root cause analysis and implementation hints

**Team:** Realty Hub | **Prefix:** REA

## ADRs (Architecture Decision Records)

- ADRs are HISTORICAL records. Never edit a past ADR — write a new one that supersedes it.
- Do NOT read ADRs during normal execution sessions. SCOPE.md and CLAUDE.md are the execution docs.
- Only read ADRs when making a NEW architectural decision and needing prior context.
- When reading ADRs, read newest-to-oldest (highest number first).
- ADR filename: `YYYY-MM-DD-ADR-###-short-title.md` in `docs/adrs/`

## Design Rules

- **Layout constants:** Import from `web/src/lib/layout-constants.ts` — no hardcoded pixel values for topbar, bottomnav, map height, or page padding.
- **Page padding:** Always `px-4 sm:px-6` on content containers.
- **Bottom nav:** Always `fixed bottom-0`, height from LAYOUT constant, z-50. Must be visible on ALL pages at ALL times.
- **Map height:** Always uses `LAYOUT.MAP_HEIGHT` — must fit between topbar and bottomnav.
- **Two-line title (ADR-005):** Line 1 = `listing.street`. Line 2 = `listing.title_standardized || generateTitleStandardized(listing)`. Both lines SAME size/weight/color. No `address_raw`, no ward, no fallback concatenation.
- **Dark theme only** — no light mode variants needed.
- **Suspense boundary (Next.js 16):** Any component using `useSearchParams()` must be wrapped in `<Suspense>`. This applies to `layout.tsx`, `crm/page.tsx`, `view/page.tsx`, and `messages/new/page.tsx`. Failing to wrap causes a build error.
- **Script permissions:** All new `.sh` files must have execute permission: `git update-index --chmod=+x scripts/new-script.sh`

## Script Permissions

- All new `.sh` files must have their executable bit set in git: `git update-index --chmod=+x scripts/<name>.sh`
- Never create a `.sh` file without immediately running the above command.

---

## Logging Workflows (Session & Testing)

At the end of every session (automatically, without being asked), you must:
1. Review the git diffs, files we modified, and the terminal history of our current conversation.
2. Create a new markdown file in `docs/code_sessions/` named `YYYY-MM-DD-sessionNN-brief-topic.md`.
3. Use the **Code Session Template** below. Do not ask for permission — just create it.

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

## Chat Exports

Saved in `docs/chat_exports/`. Use `/export` (built-in, 0 tokens) to save a raw transcript to the project root. `scripts/claude-log.sh` (runs every 30 min via cron) moves it to `docs/chat_exports/{DATE}/` and appends to a daily markdown summary.

**Deployment: Google Cloud VM — see `docs/DEPLOYMENT.md` for full guide**
**Sprint: Stabilization — see `docs/SCOPE.md`**
**Linear: https://linear.app/realty-hub**