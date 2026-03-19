## Session 9 — 2026-02-13 — Web Scraping Pipeline (batdongsannhatrang.org)

### Summary
Built a Playwright-based web scraping pipeline for ingesting Vietnamese real estate listings from batdongsannhatrang.org. Added 3 new parser extractors (road width, frontage count, beach distance), created a reusable scraper framework with base class + site-specific implementation, and CLI entry point.

### Changes Made

#### Database Migration 007
- `raw_listings`: Added `source_url VARCHAR(500)` with unique index, `source_listing_id VARCHAR(100)` for provenance tracking
- `parsed_listings`: Added `road_width_m DOUBLE PRECISION`, `num_frontages SMALLINT`, `distance_to_beach_m DOUBLE PRECISION`

#### Vietnamese Parser Enhancements
- `extract_road_width(text)`: Parses "duong rong 20m", "lo 12m" -> float
- `extract_num_frontages(text)`: Parses "2 mat tien", "hai mat tien" -> int
- `extract_distance_to_beach(text)`: Parses "cach bien 300m" -> float
- Added 3 fields to `ParsedListing` dataclass + wired into `parse_listing()`

#### Scraping Module (`src/scraping/`)
- `base_scraper.py`: Abstract `BaseScraper` with `ScrapedListing` dataclass. Handles DB insertion (raw + parsed), photo downloading, dedup by source_url, Playwright lifecycle.
- `batdongsannhatrang.py`: Site-specific scraper. Discovers listings from category pages + pagination. Extracts embedded `languageText.jsonProductIndex` JSON for structured data, description text, and photos.
- `photo_downloader.py`: Async httpx photo downloader with content-hashed filenames for dedup.
- `cli.py`: Click CLI entry point: `python -m src.scraping.cli --site batdongsannhatrang --agent-phone 0901953889`
- `__main__.py`: Module runner support.

#### Dependencies
- Added `[project.optional-dependencies] scraping` with `playwright>=1.40`, `httpx>=0.27`
- Installed Chromium headless shell via `playwright install chromium`

#### Web App Updates
- Validation schema: Added `road_width_m`, `num_frontages`, `distance_to_beach_m` to Zod listingSchema
- POST/PUT API routes: Added 3 new columns to INSERT/UPDATE statements
- Feed API: Added `num_frontages_min` and `distance_to_beach_max` filter params

#### Documentation
- `SPECIFICATIONS.md`: Added "Data Acquisition" section with architecture diagram, scraper how-to, dedup strategy
- Updated `CLAUDE.md` and `SESSION_LOG.md`

#### Bug Fixes (Session 9b — 2026-02-14)
- Photo extraction: Fixed `[data-img]` selector grabbing ALL images on page (40-60 per listing), now filters by `product/{listing_id}_` URL pattern — yields 1-2 photos per listing (correct)
- Photo dedup: Fixed duplicate registration when same photo URL appears in both `data-img` and `src` attributes (post-JS lazy load)
- Photo URL encoding: Added `urllib.parse.quote()` for filenames with spaces (e.g., `chauloan88 (0).png`)
- Street extraction: Rejected false-positive matches where "duong rong 20m" (road width) was captured as street name
- CLI DB URL: Fixed default credentials to match Docker Compose config

### Key Recommendations
- **Migration 007** must be run before scraper: `docker exec -i re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang < src/db/migrations/007_scraping_fields.sql`
- Create agent Chau Loan before scraping: `./scripts/create_agent.sh chauloan "Chau Loan" bdsntorg 0901953889`
- Run scraper: `python -m src.scraping.cli --site batdongsannhatrang --agent-phone 0901953889 --max-listings 5`
- Use `--no-headless` flag for debugging to see the browser
- Photos are stored in `./uploads/listings/<parsed_id>/` with content-hashed filenames
- The scraper overlays structured JSON data from the site on top of parser results (site data wins for price, area, direction)
- Re-running the scraper safely skips already-imported URLs (unique index on source_url)
- Docker container name: `re-nhatrang-app-postgres-1` (not `renhatrang-postgres`)
- DB credentials: user=re_nhatrang, password=change_me_in_production, db=re_nhatrang
