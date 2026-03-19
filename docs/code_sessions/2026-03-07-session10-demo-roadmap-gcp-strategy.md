## Session 10 — 2026-03-07 — Demo Roadmap, GCP Strategy, CURSOR.md

### Summary

Planning session via Claude.ai (web). Defined the Demo build target, resolved infra 
choices, added EN/VN language switching, and generated CURSOR.md for Cursor IDE.

### Key Decisions Made

- **Platform rename**: "RE Nha Trang" → "ProMemo" (internal only, fidt.vn / Wealth Realty)
- **Demo scope**: UI polish + full CRM (persons, deals kanban). AI features scaffolded only.
- **Kestra**: Commented out in docker-compose for Demo. Re-enable for MVP.
- **Infra**: GCP (Cloud Run + Cloud SQL + GCS) instead of Railway. GCP credits available.
- **BigQuery**: Post-MVP analytics layer only. Not for live app (use Cloud SQL for OLTP).
- **DuckDB**: Local analytics tool only. Not relevant to web app.
- **Language switcher**: EN ↔ VN toggle (LanguageContext + flat i18n.ts). 
  Per-listing translate button calls Google Cloud Translation API (scaffolded).
- **Auth**: Confirmed login-only. No public signup. create_agent.sh is the only path.
- **Port clarification**: Web runs on 3000 internally, mapped to 8888 in Docker Compose.

### Files Created

- `CURSOR.md` — Cursor IDE instructions for Demo build
- `src/db/migrations/008_crm_schema.sql` — persons, deals, deal_events tables (planned)
- Updated `scripts/seed_demo_users.sh` — creates dean, sarah, minh

### Recommendations for Next Session

- Open repo in Cursor, run Section 2.1 (comment out Kestra) first
- Run migration 008 before building CRM screens
- create_agent.sh port may need updating (see DOC_FIXES.md)
- Port for `npm run dev` is 3000 (not 8888 — that's Docker only)
