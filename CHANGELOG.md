# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Gemini AI Copilot integration in Kestra UI (Gemini 2.5 Flash)
- Docker runner configuration for all Kestra script tasks (python:3.12-slim)
- Bidirectional flow sync script (`scripts/kestra_flow_sync.sh`)
- `demo-file-test` diagnostic flow for quick FILE upload sanity checks
- `auto_parse` toggle on `ingest-csv` flow (default: true)
- Infrastructure diagram in ARCHITECTURE.md

### Changed
- `docker-compose.yml` — Kestra runs as root (Docker socket access), shared
  temp dir, explicit network config, Gemini API key passthrough
- `ingest-csv` flow now orchestrates both ingestion and parsing (replaces
  full-pipeline). Uses Docker runner with networkMode for DB access.
- `parse-listings` flow uses Docker runner with networkMode for DB access
- Removed custom JSON log-writing from all flows; rely on Kestra built-in
  execution logging (Logs tab captures print() output)
- SQLAlchemy transactions use `engine.begin()` (auto-commit) in all flows

### Removed
- `full-pipeline` flow (merged into `ingest-csv` with `auto_parse` toggle)
- Custom JSON execution log files from flows (redundant with Kestra UI)

## [0.1.0-dev] - 2025-02-04

### Added
- Project initialization with README.md, CLAUDE.md, CHANGELOG.md
- System architecture documentation (docs/ARCHITECTURE.md)
- Python .gitignore
