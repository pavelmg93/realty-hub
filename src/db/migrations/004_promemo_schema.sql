-- Migration 004: Realty Hub schema — new features, auth, listing management, messaging
-- For dev environments, prefer: docker compose down -v && docker compose up -d
-- For existing data, run this migration manually.

-- ---------------------------------------------------------------------------
-- A. 19 new feature columns on parsed_listings
-- ---------------------------------------------------------------------------
ALTER TABLE parsed_listings
    ADD COLUMN IF NOT EXISTS legal_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS num_bathrooms SMALLINT,
    ADD COLUMN IF NOT EXISTS structure_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS direction VARCHAR(50),
    ADD COLUMN IF NOT EXISTS depth_m FLOAT,
    ADD COLUMN IF NOT EXISTS corner_lot BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS price_per_m2 BIGINT,
    ADD COLUMN IF NOT EXISTS negotiable BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS rental_income_vnd BIGINT,
    ADD COLUMN IF NOT EXISTS has_elevator BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS nearby_amenities JSONB,
    ADD COLUMN IF NOT EXISTS investment_use_case JSONB,
    ADD COLUMN IF NOT EXISTS outdoor_features JSONB,
    ADD COLUMN IF NOT EXISTS special_rooms JSONB,
    ADD COLUMN IF NOT EXISTS feng_shui VARCHAR(50),
    ADD COLUMN IF NOT EXISTS total_construction_area FLOAT,
    ADD COLUMN IF NOT EXISTS land_characteristics VARCHAR(100),
    ADD COLUMN IF NOT EXISTS traffic_connectivity VARCHAR(100),
    ADD COLUMN IF NOT EXISTS building_type VARCHAR(50);

-- ---------------------------------------------------------------------------
-- B. Web app management columns on parsed_listings
-- ---------------------------------------------------------------------------
ALTER TABLE parsed_listings
    ADD COLUMN IF NOT EXISTS agent_id INTEGER REFERENCES agents(id),
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'for_sale',
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS freestyle_text TEXT;

-- Status constraint
ALTER TABLE parsed_listings
    DROP CONSTRAINT IF EXISTS ck_parsed_listings_status;
ALTER TABLE parsed_listings
    ADD CONSTRAINT ck_parsed_listings_status
    CHECK (status IN ('for_sale', 'in_negotiations', 'pending_closing', 'sold', 'not_for_sale'));

-- ---------------------------------------------------------------------------
-- C. Auth columns on agents
-- ---------------------------------------------------------------------------
ALTER TABLE agents
    ADD COLUMN IF NOT EXISTS username VARCHAR(100),
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Username unique index (partial — only for non-null usernames, so existing
-- agents without usernames don't conflict)
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_username
    ON agents(username) WHERE username IS NOT NULL;

-- ---------------------------------------------------------------------------
-- D. Messaging tables
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

-- ---------------------------------------------------------------------------
-- E. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_parsed_agent ON parsed_listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_parsed_status_col ON parsed_listings(status);
CREATE INDEX IF NOT EXISTS idx_parsed_archived ON parsed_listings(archived_at);
CREATE INDEX IF NOT EXISTS idx_parsed_created ON parsed_listings(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_agent1 ON conversations(agent_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent2 ON conversations(agent_2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_listing ON messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
