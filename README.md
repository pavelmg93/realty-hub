# RE Nha Trang — Real Estate Agent Matching Platform

A platform that connects buyers' agents with sellers' agents in the Nha Trang real estate market through automated listing ingestion from Zalo groups and intelligent matching.

## Problem

Nha Trang's real estate market operates largely through informal Zalo groups where agents post listings. Buyers' agents must manually monitor dozens of groups, parse unstructured Vietnamese text, and cross-reference listings against client requirements. This is slow, error-prone, and leads to missed opportunities.

## Solution

RE Nha Trang automates this workflow:

1. **Ingest** — Monitor Zalo groups and extract listing data from unstructured messages (text, images, location info)
2. **Normalize** — Parse Vietnamese real estate listings into structured data (price, location, property type, area, features)
3. **Match** — Automatically match normalized listings against buyer agent requirements using configurable rules and scoring
4. **Notify** — Alert buyer agents in real-time when matching listings appear

## Key Features

- **Zalo Group Monitoring** — Automated ingestion of listings from configured Zalo groups
- **Vietnamese NLP** — Parse unstructured Vietnamese property descriptions into structured data
- **Intelligent Matching** — Score and rank listings against buyer requirements (location, price range, property type, size)
- **Agent Dashboard** — Web interface for agents to manage requirements, view matches, and track listings
- **Notification System** — Real-time alerts via Zalo, email, or webhook when matches are found

## Tech Stack

- **Language**: Python 3.12+
- **API Framework**: FastAPI
- **Database**: PostgreSQL with pgvector for semantic search
- **Task Queue**: Celery with Redis
- **NLP/Matching**: LLM-based extraction + rule-based scoring
- **Frontend**: TBD
- **Deployment**: Docker Compose

## Project Structure

```
re-nhatrang/
|-- README.md
|-- CLAUDE.md              # Claude Code instructions
|-- CHANGELOG.md           # Change log
|-- docs/
|   +-- ARCHITECTURE.md    # System design
|-- src/
|   |-- ingestion/         # Zalo group monitoring & message extraction
|   |-- parsing/           # Vietnamese NLP & listing normalization
|   |-- matching/          # Matching engine & scoring
|   |-- notifications/     # Alert delivery (Zalo, email, webhook)
|   |-- api/               # FastAPI endpoints
|   |-- models/            # Database models
|   +-- config/            # Configuration & settings
|-- tests/
|-- docker-compose.yml
|-- pyproject.toml
+-- .env.example
```

## Getting Started

> Setup instructions will be added as the project develops.

## License

Private — All rights reserved.
