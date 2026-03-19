## Session 11 — 2026-03-07 — Demo: Filters, Full Listing, Messages, CRM, Roadmap

### Summary

Implemented missing demo functionality: filters and sort aligned to listing schema on Feed and My Listings; Agent filter on Feed; full listing page actions (Message agent, Share private link, Archive, Create post scaffold); My Listings grid 1/2/3 and map toggle with same filters as Feed; Messages grouped by Property / by Agent with collapsible sections; CRM Sellers and Buyers CRUD plus Deals funnel view; architecture roadmap (Demo vs MVP vs Production). AI listing assist left as scaffold (Gemini free tier for MVP).

### Changes Made

- **Feed**: Added `agent_id` to filters; FeedFilters accept optional `agents` list; Feed page fetches agents and passes to filters. Feed API already supported schema filters and price_vnd/area_m2 sort.
- **Listings API**: GET extended with same filter set as feed (property_type, status, price_min/max, area_min/max, num_bedrooms_min, booleans) and sort options `price_vnd`, `area_m2`.
- **My Listings page**: FeedFilterValues + FeedFilters (no agents), GridToggle (1/2/3), map toggle; fetches from `/api/listings` with filter params. ListingCard receives `isOwner` and shows orange left border + Inquiries link.
- **Full listing view**: Top action bar with Message agent (!isOwner), Share private link (copy URL), Edit and Archive (owner), Create post dropdown (scaffold: Zalo, TikTok, LinkedIn, Instagram, Facebook, BDS.vn).
- **Messages**: Replaced flat list with By Property / By Agent toggles; collapsible groups; property header links to listing view, agent header to CRM Agents; conversation rows open thread.
- **CRM**: New tab Deals with funnel columns (Cold Lead → … → Closed-Won/Lost); PATCH deal stage. Sellers and Buyers tabs: list + Add form (name, phone, email, status, notes for buyers); POST/GET /api/persons, GET/PATCH /api/deals. Constants: DEAL_STAGES for labels.
- **API**: Added `/api/persons` (GET by type/status, POST), `/api/persons/[id]` (GET, PATCH, DELETE), `/api/deals` (GET, POST), `/api/deals/[id]` (GET, PATCH). All scoped by current agent.
- **New listing page**: Short demo note that AI assist (transcribe, prefill, geo, duplicate check) is scaffolded for MVP.
- **Docs**: ARCHITECTURE.md — Roadmap section (Demo / MVP / Production). USAGE.md — Demo Accounts: create 3 users via create_agent.sh; My Listings, Feed, Messages, CRM sections updated.

### Recommendations for Next Session

- Run migration 008 if not already applied: `docker exec -i re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang < src/db/migrations/008_crm_schema.sql`
- Create demo users with `./scripts/create_agent.sh` for dean, sarah, minh (see USAGE.md).
- For MVP: implement AI prefill (Gemini free tier), notifications, auto-posting scaffold, re-enable Kestra.
