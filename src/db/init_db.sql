-- Initialize the application database schema
-- This file is auto-run by PostgreSQL on first container start

CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- Agents — real estate agents who provide listings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    zalo_id         VARCHAR(100),
    email           VARCHAR(255),
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    -- Auth fields (required at app level, nullable for legacy data)
    username        VARCHAR(100),
    password_hash   VARCHAR(255),
    first_name      VARCHAR(100),
    last_name       VARCHAR(100)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_username
    ON agents(username) WHERE username IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Raw ingested data, exactly as received
-- ---------------------------------------------------------------------------
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
                    CHECK (status IN ('pending','parsed','failed','skipped')),
    agent_id        INTEGER REFERENCES agents(id)
);

-- ---------------------------------------------------------------------------
-- Structured data extracted from raw listings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parsed_listings (
    id              SERIAL PRIMARY KEY,
    raw_listing_id  INTEGER REFERENCES raw_listings(id),
    listing_hash    CHAR(32),
    message_date    TIMESTAMP,
    -- Core fields
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
    access_road     VARCHAR(255),
    furnished       VARCHAR(50),
    description     TEXT,
    confidence      FLOAT DEFAULT 0.0,
    parsed_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    parse_errors    TEXT,
    -- 19 new feature columns
    legal_status    VARCHAR(50),
    num_bathrooms   SMALLINT,
    structure_type  VARCHAR(50),
    direction       VARCHAR(50),
    depth_m         FLOAT,
    corner_lot      BOOLEAN DEFAULT FALSE,
    price_per_m2    BIGINT,
    negotiable      BOOLEAN DEFAULT FALSE,
    rental_income_vnd BIGINT,
    has_elevator    BOOLEAN DEFAULT FALSE,
    nearby_amenities JSONB,
    investment_use_case JSONB,
    outdoor_features JSONB,
    special_rooms   JSONB,
    feng_shui       VARCHAR(50),
    total_construction_area FLOAT,
    land_characteristics VARCHAR(100),
    traffic_connectivity VARCHAR(100),
    building_type   VARCHAR(50),
    -- Web app management columns
    agent_id        INTEGER REFERENCES agents(id),
    status          VARCHAR(20) DEFAULT 'for_sale'
                    CHECK (status IN ('for_sale', 'in_negotiations', 'pending_closing', 'sold', 'not_for_sale')),
    archived_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    freestyle_text  TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_parsed_listing_hash ON parsed_listings(listing_hash);
CREATE INDEX IF NOT EXISTS idx_parsed_price ON parsed_listings(price_vnd);
CREATE INDEX IF NOT EXISTS idx_parsed_ward ON parsed_listings(ward);
CREATE INDEX IF NOT EXISTS idx_parsed_type ON parsed_listings(property_type);
CREATE INDEX IF NOT EXISTS idx_raw_status ON raw_listings(status);
CREATE INDEX IF NOT EXISTS idx_raw_agent ON raw_listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_parsed_agent ON parsed_listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_parsed_status_col ON parsed_listings(status);
CREATE INDEX IF NOT EXISTS idx_parsed_archived ON parsed_listings(archived_at);
CREATE INDEX IF NOT EXISTS idx_parsed_created ON parsed_listings(created_at);

-- ---------------------------------------------------------------------------
-- Nha Trang location reference data
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Messaging tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id              SERIAL PRIMARY KEY,
    agent_1_id      INTEGER NOT NULL REFERENCES agents(id),
    agent_2_id      INTEGER NOT NULL REFERENCES agents(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_conversations_ordered CHECK (agent_1_id < agent_2_id),
    CONSTRAINT uq_conversations_pair UNIQUE (agent_1_id, agent_2_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id              SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    sender_id       INTEGER NOT NULL REFERENCES agents(id),
    body            TEXT NOT NULL,
    listing_id      INTEGER REFERENCES parsed_listings(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    read_at         TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_agent1 ON conversations(agent_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent2 ON conversations(agent_2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_listing ON messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
