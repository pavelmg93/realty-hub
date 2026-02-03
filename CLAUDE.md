# CLAUDE.md — Instructions for Claude Code

## Project Overview

RE Nha Trang is a Real Estate Agent Matching Platform for the Nha Trang market. It ingests listings from Zalo groups, normalizes them, and matches them to buyer agent requirements.

## Tech Stack

- Python 3.12+, FastAPI, PostgreSQL (pgvector), Celery, Redis
- LLM-based Vietnamese text extraction + rule-based matching
- Docker Compose for local development

## Code Conventions

- **Language**: Python. All source code in `src/`, tests in `tests/`.
- **Style**: Follow PEP 8. Use type hints on all function signatures.
- **Formatting**: Use `ruff` for linting and formatting.
- **Imports**: Use absolute imports from `src` package root.
- **Naming**: snake_case for functions/variables, PascalCase for classes, UPPER_SNAKE_CASE for constants.
- **Docstrings**: Google-style docstrings on public functions and classes.

## Project-Specific Context

- The target market is Nha Trang, Vietnam. Listing data is in Vietnamese.
- Zalo is the primary messaging platform used by local agents. Zalo API access may be limited — design ingestion to be adaptable (API, scraping, manual import).
- Currency is VND (Vietnamese Dong). Prices are often stated in billions (tỷ) or millions (triệu).
- Property measurements use square meters (m²).
- Location data references Nha Trang neighborhoods, wards (phường), and streets.

## Architecture

- See `docs/ARCHITECTURE.md` for full system design.
- The system has four main pipelines: Ingestion → Parsing → Matching → Notification.
- Each pipeline stage is decoupled via message queue (Celery/Redis).

## Testing

- Use `pytest` for all tests.
- Test files mirror source structure: `tests/test_<module>.py`.
- Aim for tests on all business logic (parsing, matching, scoring).

## Common Commands

```bash
# Run tests
pytest

# Run linter
ruff check src/ tests/

# Format code
ruff format src/ tests/

# Start development services
docker compose up -d

# Run API server (development)
uvicorn src.api.main:app --reload
```

## Important Warnings

- Never commit `.env` files or API keys. Use `.env.example` for templates.
- Zalo API credentials and LLM API keys are sensitive — always load from environment variables.
- Database migrations should be reviewed before applying to production.

## File Standards
- Always use UTF-8 encoding for all text files
- Use LF line endings (Unix-style), not CRLF

## Documentation Style - ASCII Diagrams
- Use pure ASCII only: `+`, `-`, `|`, `>`, `<`, `v`, `^`
- No Unicode box-drawing or arrow characters
- Calculate box width: longest text line + 4 chars padding (2 each side)
- Minimum inner width: 20 characters
- Example:
```
+------------------------+     +------------------------+
|       Ingestion        |---->|        Parsing         |
|                        |     |                        |
|  Zalo groups           |     |  Vietnamese NLP        |
|  monitoring            |     |  extraction            |
+------------------------+     +------------------------+
          |                              |
          v                              v
+------------------------+     +------------------------+
|       Database         |     |       Matching         |
|                        |     |                        |
|  PostgreSQL            |     |  Score & rank          |
|  + pgvector            |     |  against buyers        |
+------------------------+     +------------------------+
```