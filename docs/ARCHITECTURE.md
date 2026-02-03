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

### 6. Agent Dashboard (Frontend)

**Purpose**: Web interface for buyer agents to manage their requirements and view matches.

**Planned features**:
- Requirement CRUD (location, price range, property type, size)
- Match feed with listing details
- Listing search and browse
- Notification preferences

**Tech**: TBD — likely a lightweight framework (React, Vue, or server-rendered).

## Data Model

### Core Entities

```
RawListing
|-- id (UUID)
|-- source_group (string)       # Zalo group name/ID
|-- raw_text (text)             # Original Vietnamese message
|-- media_urls (jsonb)          # Attached images/files
|-- captured_at (timestamp)
+-- processed (boolean)

ParsedListing
|-- id (UUID)
|-- raw_listing_id (FK)
|-- property_type (enum)
|-- price_vnd (bigint)
|-- area_sqm (decimal)
|-- location_ward (string)
|-- location_street (string)
|-- bedrooms (int)
|-- bathrooms (int)
|-- floors (int)
|-- description (text)
|-- contact_phone (string)
|-- confidence_score (float)    # Parsing confidence
|-- embedding (vector)          # pgvector for semantic search
+-- parsed_at (timestamp)

BuyerRequirement
|-- id (UUID)
|-- agent_id (FK)
|-- property_types (enum[])
|-- price_min_vnd (bigint)
|-- price_max_vnd (bigint)
|-- area_min_sqm (decimal)
|-- locations (string[])        # Target wards/streets
|-- min_bedrooms (int)
|-- notes (text)                # Free-text preferences
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

Agent
|-- id (UUID)
|-- name (string)
|-- phone (string)
|-- zalo_id (string)
|-- email (string)
+-- role (enum)                 # buyer_agent, seller_agent, both
```

## Infrastructure

### Local Development
- Docker Compose with: PostgreSQL (+ pgvector extension), Redis, API server
- Hot-reload via `uvicorn --reload`

### Production (future)
- Containerized deployment
- Managed PostgreSQL with pgvector
- Redis for task queue and caching
- Background workers for ingestion, parsing, matching pipelines

## Key Design Decisions

1. **Pipeline decoupling via Celery/Redis** — Each stage can fail independently without blocking others. Raw data is preserved even if parsing fails.
2. **LLM + rules hybrid for parsing** — LLM handles the diversity of Vietnamese listing formats; rules handle common structured patterns cheaply.
3. **pgvector for future semantic search** — Allows matching on meaning, not just exact field values (e.g., "near the beach" matching listings in coastal wards).
4. **Multi-strategy ingestion** — Zalo access is uncertain, so the system supports API, scraping, and manual import from day one.
