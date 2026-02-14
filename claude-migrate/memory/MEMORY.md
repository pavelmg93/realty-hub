# Project Memory

## ProMemo Implementation Status (Session 9b — 2026-02-14)
- See [promemo_progress.md](promemo_progress.md) for detailed implementation status
- **ALL PHASES DONE** except Phase 4 (TypeScript Parser Port)
- Session 9: Web Scraping Pipeline (batdongsannhatrang.org)
- Session 9b: Photo extraction bug fix, street parser fix, CLI DB credentials fix
- **Migration 007**: source_url/source_listing_id on raw_listings, road_width_m/num_frontages/distance_to_beach_m on parsed_listings
- **72 listings scraped** from batdongsannhatrang.org with 72 photos (1 per listing, correct)

## Kestra Patterns
- See [kestra.md](kestra.md) for detailed notes on Kestra flows and gotchas.

## Vietnamese Parser Patterns
- Property type extraction: use scoring + title-first priority, not first-match
- "ban dat tang nha" = land sale, not house. Needs compound override regex.
- Default transaction_type to "ban" when property info present but no explicit verb
- Vietnamese RE: rentals always say "cho thue"; absence of verb = for sale
- Road access categories ordered by accessibility: mat_duong > hem_oto > hem_thong > hem_rong > hem_nho > hem
- Kestra inline parser must be manually synced with src/parsing/vietnamese_parser.py
- **22 extractors total**: 19 original + road_width_m, num_frontages, distance_to_beach_m (session 9)

## Database Schema Notes
- `init_db.sql` creates tables; `seed_reference_data.sql` populates reference data
- After `docker compose down -v && up -d`, run seed_reference_data.sql + migrations 002-007
- agents table links to raw_listings via agent_id FK
- nha_trang_wards has both pre- and post-Nov 2024 merger names (28 total)
- access_road and furnished are VARCHAR columns on parsed_listings
- **Migration 004** added: 19 feature cols, auth cols on agents, status/archived/agent_id on parsed_listings, conversations+messages tables
- **Migration 005**: conversations per listing, cho_thue->ban fix
- **Migration 006**: latitude/longitude on parsed_listings, listing_photos, listing_documents tables
- **Listing statuses**: for_sale, in_negotiations, pending_closing, sold, not_for_sale
- **conversations** table: ordered pair + listing_id (unique per agent_pair + listing)
- Zod validation: use z.preprocess for BIGINT string coercion (node-postgres returns BIGINT as strings)
- **Document categories**: ownership_cert, floorplan, property_sketch, use_permit, construction_permit, proposal, other

## Docker Compose Services
- pgAdmin at port 5050, email default: admin@renhatrang.dev (`.local` rejected)
- pgAdmin server auto-configured via config/pgadmin-servers.json
- Always use `docker exec` for psql, not host psql (not installed)
- Docker in WSL2: use `docker.exe` (Docker Desktop must be running on Windows)
- **ProMemo web app** at port 8888 (Next.js, in docker-compose as `web` service)
- **uploads-data** volume: mounted at `/app/uploads` in web container

## Next.js Web App (ProMemo)
- Located at `web/` directory
- Port 8888, Next.js 14+ with App Router, TypeScript, Tailwind v4
- Database: raw pg Pool (no ORM) to avoid migration conflicts
- Auth: bcrypt + JWT in httpOnly cookie "promemo_token" (login only, no public signup)
- **15 API routes** at web/src/app/api/ (auth, listings, feed, conversations, upload, files, geocode, photos, documents, parse)
- Dashboard layout with nav, auth guard, mobile menu
- Maps: react-leaflet with dynamic imports (ssr:false), Leaflet CSS from CDN
- Nha Trang center: 12.2388, 109.1967
- File uploads: `/api/upload` (multipart) -> `/app/uploads/` -> served via `/api/files/[...path]`
- Listing detail: `/dashboard/listings/[id]/view` (read-only, tabbed)
- Account creation: `scripts/create_agent.sh <username> <first_name> <password> [phone] [email]`

## Web Scraping Pipeline
- Module: `src/scraping/` with BaseScraper ABC + site-specific scrapers
- CLI: `python -m src.scraping.cli --site batdongsannhatrang --agent-phone 0901953889`
- Dependencies: `uv pip install -e ".[scraping]"` + `playwright install chromium`
- Dedup: unique index on raw_listings.source_url prevents re-imports
- Photos: content-hashed filenames in `./uploads/listings/<parsed_id>/`
- Parser overlay: structured JSON from site wins over regex extraction for price/area/direction
- Docker container name: `re-nhatrang-app-postgres-1` (not `renhatrang-postgres`)
- DB credentials: user=re_nhatrang, db=re_nhatrang (underscores, not plain)

## Testing Data
- 37 listings from An Cu Dean (Dean/Duy, phone 0868331111)
- 14 sample listings with real Nha Trang addresses in `scripts/seed_sample_listings.sql`
- Current parse metrics: avg confidence 0.903, 0 null transaction types
- batdongsannhatrang.org: Agent Chau Loan (0901953889)
