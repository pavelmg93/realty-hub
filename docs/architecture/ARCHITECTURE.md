# Architecture — RE Nha Trang

## System Overview

RE Nha Trang is a pipeline-based system with four stages: **Ingestion**, **Parsing**, **Matching**, and **Notification**. Each stage is decoupled via a task queue, allowing independent scaling and fault isolation.

```
+---------------------------+     +---------------------------+
|         Ingestion         |---->|          Parsing          |
|                           |     |                           |
|   Zalo groups             |     |   Vietnamese NLP          |
|   monitoring              |     |   extraction              |
+---------------------------+     +---------------------------+
              |                                |
              v                                v
+---------------------------+     +---------------------------+
|         Matching          |---->|       Notification        |
|                           |     |                           |
|   Score & rank            |     |   Zalo, email,            |
|   against buyers          |     |   webhook                 |
+---------------------------+     +---------------------------+
              |                                |
              +----------------+----------------+
                               |
                               v
                 +---------------------------+
                 |        Data Store         |
                 |                           |
                 |   PostgreSQL + pgvector   |
                 |   Redis (queue + cache)   |
                 +---------------------------+
```

## Components

### 1. Ingestion Service

**Purpose**: Monitor Zalo groups and capture raw listing messages.

**Design considerations**:
- Zalo does not offer a public API for group message access. The ingestion layer must support multiple strategies:
  - **Zalo API** (if available via Zalo OA or authorized access)
  - **Web scraping / automation** (browser-based extraction)
  - **Manual import** (CSV/JSON upload for bootstrapping or fallback)
- Raw messages are stored as-is before parsing, preserving original Vietnamese text and any attached media URLs.

**Data flow**:
- Input: Zalo group messages (text, images, location)
- Output: `RawListing` records in PostgreSQL
- Trigger: Polling interval or webhook (depending on access method)

### 2. Parsing Service

**Purpose**: Extract structured listing data from unstructured Vietnamese messages.

**Approach**:
- Use LLM (e.g., GPT-4, Claude) to extract fields from Vietnamese text
- Fall back to regex/rule-based extraction for common patterns
- Extracted fields:
  - `property_type` — apartment, house, land, villa, etc.
  - `price` — normalized to VND
  - `area` — in square meters
  - `location` — ward (phường), street, district
  - `bedrooms`, `bathrooms`, `floors`
  - `description` — cleaned summary
  - `contact_info` — agent phone/Zalo ID
  - `source_group` — originating Zalo group
  - `posted_at` — timestamp

**Output**: `ParsedListing` records with structured fields + confidence scores.

### 3. Matching Engine

**Purpose**: Match parsed listings to buyer agent requirements.

**Matching strategy**:
- **Rule-based filtering**: Hard constraints (price range, location, property type, minimum area)
- **Scoring**: Weighted scoring across soft preferences
- **Semantic search** (future): Use pgvector embeddings to match listing descriptions against buyer requirement text

**Match flow**:
1. New `ParsedListing` arrives
2. Query all active `BuyerRequirement` records
3. Apply hard filters (eliminate non-matches)
4. Score remaining matches (0–100)
5. Store `Match` records above configurable threshold
6. Trigger notification for high-confidence matches

### 4. Notification Service

**Purpose**: Deliver match alerts to buyer agents.

**Channels**:
- **Zalo** (primary) — via Zalo OA API or direct message
- **Email** — for digest/summary delivery
- **Webhook** — for integration with external systems

**Behavior**:
- Real-time alerts for high-confidence matches (score > threshold)
- Daily digest for lower-confidence matches
- De-duplication to avoid sending the same listing twice

### 5. API Layer (FastAPI)

**Endpoints** (planned):

| Group | Purpose |
|-------|---------|
| `POST /requirements` | Create/update buyer agent requirements |
| `GET /requirements` | List active requirements |
| `GET /matches` | List matches for a requirement |
| `GET /listings` | Browse/search parsed listings |
| `POST /listings/import` | Manual listing import |
| `GET /health` | Service health check |

**Auth**: API key or JWT (TBD based on deployment model).

### 6. Realty Hub Web App (Frontend)

**Purpose**: Web interface for agents to manage listings, browse feeds, and communicate.

**Tech**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4.
**Auth**: Login-only with bcrypt + JWT (httpOnly cookie "realtyhub_token").
  No public signup — accounts created via scripts/create_agent.sh.
**Version**: Next.js 15 (App Router)
**Database**: Raw pg Pool with SQL (no ORM, avoids migration conflicts).
**Features (implemented)**:
- Agent signup/login with JWT auth
- Listing CRUD with freestyle text input and structured database view
- Feed with 18 filter parameters, sorting, and pagination
- Agent-to-agent messaging with conversation threads
- Responsive mobile layout

**URL**: `http://localhost:8888` (Docker) | `http://localhost:3000` (local dev, npm run dev)

## Data Model

### Implemented (V1)

```
Agent
|-- id (serial)
|-- name (string)
|-- phone (string)
|-- zalo_id (string)
|-- email (string)
|-- notes (text)
|-- username (string, unique)
|-- password_hash (string)
|-- first_name (string)
|-- last_name (string)
+-- created_at (timestamp)

RawListing
|-- id (serial)
|-- source (string)             # zalo_manual, api, etc.
|-- source_group (string)       # Zalo group name/ID
|-- sender_name (string)
|-- message_text (text)         # Original Vietnamese message
|-- message_date (timestamp)
|-- ingested_at (timestamp)
|-- batch_id (string)
|-- status (enum)               # pending, parsed, failed, skipped
+-- agent_id (FK -> Agent)

ParsedListing
|-- id (serial)
|-- raw_listing_id (FK)
|-- listing_hash (char32)       # MD5 dedup key
|-- message_date (timestamp)
|-- property_type (string)      # nha, dat, can_ho, biet_thu, etc.
|-- transaction_type (string)   # ban, cho_thue
|-- price_raw (string)
|-- price_vnd (bigint)
|-- area_m2 (float)
|-- address_raw (string)
|-- ward (string)
|-- street (string)
|-- district (string)
|-- num_bedrooms (smallint)
|-- num_floors (smallint)
|-- frontage_m (float)
|-- access_road (string)        # mat_duong, hem_oto, hem_thong, etc.
|-- furnished (string)          # full, co_ban, khong
|-- description (text)
|-- confidence (float)          # 0.0-1.0
|-- parsed_at (timestamp)
|-- parse_errors (text)
|-- legal_status (string)       # so_hong, so_do, hoan_cong, tho_cu
|-- num_bathrooms (smallint)
|-- structure_type (string)     # me_duc, gac_lung, tret_lau, cap_4
|-- direction (string)          # dong, tay, nam, bac, etc.
|-- depth_m (float)
|-- corner_lot (boolean)
|-- price_per_m2 (bigint)
|-- negotiable (boolean)
|-- rental_income_vnd (bigint)
|-- has_elevator (boolean)
|-- nearby_amenities (jsonb)
|-- investment_use_case (jsonb)
|-- outdoor_features (jsonb)
|-- special_rooms (jsonb)
|-- feng_shui (string)
|-- total_construction_area (float)
|-- land_characteristics (string)
|-- traffic_connectivity (string)
|-- building_type (string)
|-- agent_id (FK -> Agent)      # listing owner
|-- status (string)             # for_sale, in_negotiations, etc.
|-- archived_at (timestamp)
|-- freestyle_text (text)
+-- updated_at (timestamp)

Conversation
|-- id (serial)
|-- agent_1_id (FK -> Agent)    # ordered pair: agent_1_id < agent_2_id
|-- agent_2_id (FK -> Agent)
|-- created_at (timestamp)
+-- updated_at (timestamp)

Message
|-- id (serial)
|-- conversation_id (FK -> Conversation)
|-- sender_id (FK -> Agent)
|-- body (text)
|-- listing_id (FK -> ParsedListing, nullable)
|-- created_at (timestamp)
+-- read_at (timestamp)

NhaTrangWard (reference)
|-- id (serial)
|-- name (string)               # Vietnamese with diacritics
|-- name_ascii (string)         # ASCII for fuzzy matching
|-- ward_type (enum)            # phuong, xa
+-- osm_relation_id (bigint)

NhaTrangStreet (reference)
|-- id (serial)
|-- name (string)
|-- name_ascii (string)
+-- osm_way_id (bigint)
```

### Planned (V1.1+)

```
BuyerRequirement
|-- id (UUID)
|-- agent_id (FK)
|-- property_types (enum[])
|-- price_min_vnd (bigint)
|-- price_max_vnd (bigint)
|-- area_min_sqm (decimal)
|-- locations (string[])        # Target wards/streets
|-- min_bedrooms (int)
|-- notes (text)
|-- active (boolean)
+-- created_at (timestamp)

Match
|-- id (UUID)
|-- listing_id (FK)
|-- requirement_id (FK)
|-- score (float)               # 0-100 match score
|-- notified (boolean)
|-- notified_at (timestamp)
+-- matched_at (timestamp)
```

## Infrastructure

### Docker Compose Environment (V1 Current State)

```
+=========================================================================+
|   Host (WSL2 / Linux)                                                   |
|                                                                         |
|   ./kestra/flows/  ./logs/kestra/  /var/run/docker.sock  /tmp/kestra-wd |
+=========================================================================+
        |                |                  |                   |
        | (bind mount)   | (bind mount)     | (socket mount)   | (shared)
        v                v                  v                   v
+-----------------------------------------------------------------------+
|   Docker Compose Network: re-nhatrang_re-nhatrang                     |
|                                                                       |
|  +----------------------------+    +----------------------------+     |
|  |         kestra             |    |      kestra-postgres       |     |
|  |                            |    |                            |     |
|  |   DEMO: disabled           |    |   DEMO: disabled           |     |
|  |   Kestra server            |    |   PostgreSQL 16            |     |
|  |   (runs as root)           |--->|   Kestra metadata DB       |     |
|  |   Port: 8080 (UI)          |    |   Port: 5433 (host)        |     |
|  |   Port: 8081 (API)         |    |                            |     |
|  |                            |    |   Vol: kestra-pg-data      |     |
|  |   Vol: kestra-data         |    +----------------------------+     |
|  |   Vol: /app/flows (bind)   |                                       |
|  |   Vol: docker.sock (bind)  |    +----------------------------+     |
|  |   Vol: /tmp/kestra-wd      |    |      app-postgres          |     |
|  +-------------+--------------+    |                            |     |
|                |                   |   PostgreSQL 16 + pgvector |     |
|                | spawns            |   Application data DB      |<-   |
|                v                   |   Port: 5432 (host)        | |   |
|  +----------------------------+    |                            | |   |
|  |   Task Container           |    |   Vol: app-pg-data         | |   |
|  |   (ephemeral)              |--->|   Init: init_db.sql        | |   |
|  |                            |    +----------------------------+ |   |
|  |   python:3.12-slim         |                                   |   |
|  |   networkMode:             |    +----------------------------+ |   |
|  |    re-nhatrang_re-nhatrang |    |         redis              | |   |
|  |                            |    |                            | |   |
|  |   Runs: pip install +      |    |   Redis 7 Alpine           | |   |
|  |         inline Python      |    |   Port: 6379 (host)        | |   |
|  |   Shares: /tmp/kestra-wd   |    |                            | |   |
|  +----------------------------+    |   Vol: redis-data          | |   |
|                                    +----------------------------+ |   |
|                                                                   |   |
|  +----------------------------+    +----------------------------+ |   |
|  |     kestra-restore         |    |         pgadmin            | |   |
|  |     (init container)       |    |                            | |   |
|  |                            |    |   pgAdmin 4 web UI         | |   |
|  |   Restores Kestra DB       |    |   Port: 5050 (host)        |--   |
|  |   from backup on fresh     |    |                            | |   |
|  |   startup, then exits      |--->|   Connects to app-postgres | |   |
|  +----------------------------+    |   Auto-configured server   | |   |
|                                    +----------------------------+ |   |
|                                                                   |   |
|  +----------------------------+                                   |   |
|  |           web              |                                   |   |
|  |                            |                                   |   |
|  |   Next.js 16 (Realty Hub)  |                                   |   |
|  |   Port: 8888 (host)        |-----> (app-postgres) -------------|   |
|  |                            |                                       |
|  |   Agent listings, feed,    |                                       |
|  |   messaging UI             |                                       |
|  +----------------------------+                                       |
+-----------------------------------------------------------------------+
```

### User Workflow

```
+----------------------------+     +----------------------------+
|   User (Human)             |     |   Kestra UI                |
|                            |     |   localhost:8080            |
|   1. Copy Zalo messages    |     |                            |
|   2. Run transform script  |---->|   3. Upload CSV            |
|   3. Open Kestra UI        |     |   4. Trigger ingest-csv    |
|   4. Upload CSV file       |     |   5. View execution logs   |
+----------------------------+     +-------------+--------------+
                                                 |
                    +----------------------------+----------------------------+
                    |                            |                            |
                    v                            v                            v
      +-------------------+        +-------------------+        +-------------------+
      |  validate_and_load|        |     parse         |        |   app-postgres    |
      |  (task container) |        |  (subflow task    |        |                   |
      |                   |        |   container)      |        |   raw_listings    |
      |  Reads CSV        |------->|  Reads pending    |------->|   parsed_listings |
      |  Inserts to DB    |        |  Parses Vietnamese|        |                   |
      |  Prints summary   |        |  Updates status   |        |   Browse: pgAdmin |
      +-------------------+        +-------------------+        |   localhost:5050  |
                                                                +-------------------+
```

### Volumes

| Volume | Purpose | Persists across restarts |
|--------|---------|------------------------|
| `kestra-data` | Kestra internal storage (uploaded files) | Yes |
| `kestra-pg-data` | Kestra metadata DB (execution history) | Yes |
| `app-pg-data` | Application data (listings) | Yes |
| `redis-data` | Redis persistence | Yes |
| `./kestra/flows` (bind) | Flow YAML definitions | Yes (in repo) |
| `./logs/kestra` (bind) | Kestra DB backups | Yes (in repo) |
| `/tmp/kestra-wd` (bind) | Shared working dir for task containers | No (temp) |

### Production (future)
- Containerized deployment
- Managed PostgreSQL with pgvector
- Redis for task queue and caching
- Background workers for ingestion, parsing, matching pipelines

## Roadmap: Demo vs MVP vs Production

**Demo (current focus)**  
- **Auth**: Login/logout; three demo users (documented in USAGE.md). No public signup.  
- **Data**: Parsing, scraping, and seeding are **set aside**. Assume three test users manually create listings via the web app.  
- **Features**: Listings (create, edit, archive), Feed and My Listings (filters, sort, map, grid), Full Listing view (message agent, share link, archive, create-post scaffold), Messages (by Property / by Agent), CRM (Sellers, Buyers, Agents, Deals funnel). AI-assisted listing creation (transcribe, prefill, duplicate check) is **scaffolded** for later.  
- **Budget**: Near $0; use free-tier APIs where possible (e.g. Gemini for demo AI).

**MVP (next)**  
- Re-enable Kestra, parsing, and scraping for pipeline.  
- Notifications, auto-posting to socials (Zalo, TikTok, etc.), schedules.  
- Full AI flow: transcribe, prefill, geo from photos, duplicate check, follow-up actions.

**Production**  
- Point 1 (login/logout + three demo users) is production-ready.  
- Add GCP/Cloud SQL for persistence; migrations and runbooks as needed.

## Key Design Decisions

1. **Pipeline decoupling via Kestra** — Each stage (ingest, parse, match) runs as an independent flow. Raw data is preserved even if parsing fails. Kestra provides UI-based triggering and execution monitoring out of the box. Celery/Redis reserved for V1.1+ async processing.
2. **Regex-first parsing (V1), LLM planned (V2)** — V1 uses regex/rule-based extraction for common Vietnamese listing patterns (no external API dependency). LLM augmentation deferred to V2 for handling edge cases.
3. **pgvector for future semantic search** — Allows matching on meaning, not just exact field values (e.g., "near the beach" matching listings in coastal wards).
4. **Multi-strategy ingestion** — Zalo access is uncertain, so the system supports API, scraping, and manual import from day one.
5. **Docker runner for task isolation** — Kestra script tasks run in ephemeral Docker containers (python:3.12-slim) with explicit network access to compose services. This provides clean dependency management and consistent Python versions.
