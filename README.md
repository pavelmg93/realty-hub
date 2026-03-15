# ProMemo — Wealth Realty Agent Platform

Internal real estate agent platform for [Wealth Realty / FIDT](https://fidt.vn/wealth-realty/).
Agents share listings, message each other, and manage buyers, sellers, and deals.

> **Private repo — internal use only.**

---

## What It Does

- **Feed** — browse all active listings from all agents, with filters, map view, and grid/list toggle
- **My Listings** — manage your own listings (create, edit, archive, photos, documents)
- **Messaging** — per-listing conversation threads between agents
- **CRM** — manage buyers, sellers, and deal pipeline (kanban funnel)
- **AI Listing Entry** — paste Vietnamese listing text, AI extracts structured fields via Gemini
- **Maps** — OpenStreetMap/Leaflet with geocoding via Nominatim

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind v4 |
| Database | PostgreSQL 16 + pgvector (raw `pg` pool, no ORM) |
| Auth | bcrypt + JWT in httpOnly cookie |
| Maps | react-leaflet + OpenStreetMap + Nominatim |
| AI | Gemini API (free tier, `GEMINI_API_KEY`) |
| Infra | Docker Compose, Google Cloud VM |
| Pipeline | Python 3.12, Kestra (disabled for demo) |

---

## Quick Start

```bash
# 1. Clone and enter
git clone https://github.com/pavelmg93/re-nhatrang.git
cd re-nhatrang

# 2. Copy env template
cp .env.example .env
# Edit .env — set JWT_SECRET and optionally GEMINI_API_KEY

# 3. Start all services
docker compose up -d

# 4. Create your first agent account
./scripts/create_agent.sh <username> "<display name>" <password> [phone] [email]

# 5. Open the app
open http://localhost:8888
```

### Services

| Service | URL | Notes |
|---|---|---|
| ProMemo web app | http://localhost:8888 | Main application |
| pgAdmin | http://localhost:5050 | Database browser |
| PostgreSQL | port 5432 | App database |
| Redis | port 6379 | Cache |

> Running `npm run dev` outside Docker uses port 3000 instead of 8888.

---

## Project Structure

```
web/                    Next.js app (ProMemo)
  src/
    app/                Pages and API routes (App Router)
      dashboard/        Auth-protected screens
        feed/           Listing feed
        listings/       My Listings CRUD
        messages/       Messaging / Inquiries
        crm/            CRM — Agents, Buyers, Sellers, Deals
        profile/        My Profile
      api/              API routes
    components/         Shared React components
    lib/                DB pool, auth, types, constants, i18n
src/                    Python pipeline (inactive for Demo)
  db/
    init_db.sql         Initial schema
    migrations/         002–010, run in order
  parsing/              Vietnamese regex parser
  scraping/             Playwright scraper
scripts/
  create_agent.sh       Admin account creation (no public signup)
docs/
  SCHEMA.md             Canonical database schema
  ARCHITECTURE.md       System design
  ROADMAP-v2.md         Feature roadmap
  SESSION_LOG.md        Development history
  USAGE.md              Operations guide
stitch_property_details_view/   UI mockups (design reference)
```

---

## Database

Schema reference: [`docs/SCHEMA.md`](docs/SCHEMA.md)

Current migration level: **010**

```bash
# Connect to database
docker exec -it re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang

# After a fresh docker compose down -v && up -d:
docker exec -i re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang \
  < src/db/seed_reference_data.sql
# Then run migrations 002 through 010 in order
```

---

## Agent Accounts

No public signup. Admin creates accounts via script:

```bash
./scripts/create_agent.sh <username> "<display name>" <password> [phone] [email]
```

Demo accounts (password: `demo123`): `pavel`, `dean`

---

## Development

```bash
# TypeScript check (run from web/)
cd web && npx tsc --noEmit

# Local dev server (port 3000)
cd web && npm run dev

# Python parser tests
source .venv/bin/activate
pytest tests/ -v

# Lint
ruff check src/ tests/
```

---

## Deployment

Deployed on **Google Cloud VM** via Docker Compose.

```bash
# On VM: pull latest and restart
git pull
docker compose up -d

# If Dockerfile changed:
docker compose build web && docker compose up -d
```

---

## What Is Disabled (Demo Phase)

| Component | Status |
|---|---|
| Kestra orchestration | Commented out in docker-compose |
| Zalo ingestion pipeline | Future — do not modify |
| Web scraping (Playwright) | Future — do not enable |

---

## License

Private — All rights reserved. FIDT / Wealth Realty.
