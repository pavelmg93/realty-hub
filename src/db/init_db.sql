-- Initialize the application database schema
-- This file is auto-run by PostgreSQL on first container start

CREATE EXTENSION IF NOT EXISTS vector;

-- Raw ingested data, exactly as received
CREATE TABLE IF NOT EXISTS raw_listings (
    id              SERIAL PRIMARY KEY,
    source          VARCHAR(50) NOT NULL DEFAULT 'zalo_manual',
    source_group    VARCHAR(255),
    sender_name     VARCHAR(255),
    message_text    TEXT NOT NULL,
    message_date    TIMESTAMP,
    ingested_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    batch_id        VARCHAR(100),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','parsed','failed','skipped'))
);

-- Structured data extracted from raw listings
CREATE TABLE IF NOT EXISTS parsed_listings (
    id              SERIAL PRIMARY KEY,
    raw_listing_id  INTEGER REFERENCES raw_listings(id),
    property_type   VARCHAR(50),
    transaction_type VARCHAR(20),
    price_raw       VARCHAR(100),
    price_vnd       BIGINT,
    area_m2         FLOAT,
    address_raw     VARCHAR(500),
    ward            VARCHAR(100),
    street          VARCHAR(255),
    district        VARCHAR(100),
    num_bedrooms    SMALLINT,
    num_floors      SMALLINT,
    frontage_m      FLOAT,
    description     TEXT,
    confidence      FLOAT DEFAULT 0.0,
    parsed_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    parse_errors    TEXT
);

CREATE INDEX IF NOT EXISTS idx_parsed_price ON parsed_listings(price_vnd);
CREATE INDEX IF NOT EXISTS idx_parsed_ward ON parsed_listings(ward);
CREATE INDEX IF NOT EXISTS idx_parsed_type ON parsed_listings(property_type);
CREATE INDEX IF NOT EXISTS idx_raw_status ON raw_listings(status);
