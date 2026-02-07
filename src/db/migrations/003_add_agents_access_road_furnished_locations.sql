-- Migration 003: Add agents, access_road, furnished, location reference tables
-- For dev environments, prefer: docker compose down -v && docker compose up -d
-- For existing data, run this migration manually.

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    zalo_id         VARCHAR(100),
    email           VARCHAR(255),
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add agent_id to raw_listings
ALTER TABLE raw_listings
    ADD COLUMN IF NOT EXISTS agent_id INTEGER REFERENCES agents(id);

CREATE INDEX IF NOT EXISTS idx_raw_agent ON raw_listings(agent_id);

-- Add new columns to parsed_listings
ALTER TABLE parsed_listings
    ADD COLUMN IF NOT EXISTS access_road VARCHAR(255),
    ADD COLUMN IF NOT EXISTS furnished VARCHAR(50);

-- Location reference tables
CREATE TABLE IF NOT EXISTS nha_trang_wards (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    name_ascii      VARCHAR(100) NOT NULL,
    ward_type       VARCHAR(20) NOT NULL DEFAULT 'phuong'
                    CHECK (ward_type IN ('phuong', 'xa')),
    osm_relation_id BIGINT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ward_name ON nha_trang_wards(name);
CREATE INDEX IF NOT EXISTS idx_ward_name_ascii ON nha_trang_wards(name_ascii);

CREATE TABLE IF NOT EXISTS nha_trang_streets (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    name_ascii      VARCHAR(255) NOT NULL,
    osm_way_id      BIGINT
);

CREATE INDEX IF NOT EXISTS idx_street_name ON nha_trang_streets(name);
CREATE INDEX IF NOT EXISTS idx_street_name_ascii ON nha_trang_streets(name_ascii);
