-- Migration 008: CRM — Persons (Buyers/Sellers), Deals, Interactions
-- Run: docker exec -i realty-hub-app-postgres-1 psql -U re_nhatrang -d re_nhatrang < src/db/migrations/008_crm_schema.sql

CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('buyer', 'seller')),
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(30),
  zalo VARCHAR(100),
  email VARCHAR(200),
  notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'lead'
    CHECK (status IN ('lead','engaged','considering','viewing','negotiating','closing','won','lost')),
  created_by_agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE persons ADD COLUMN IF NOT EXISTS buyer_criteria JSONB;

CREATE TABLE IF NOT EXISTS person_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES parsed_listings(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('buyer_interest','seller','co_agent')),
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(person_id, listing_id, role)
);

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id INTEGER REFERENCES parsed_listings(id) ON DELETE SET NULL,
  buyer_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  seller_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  stage VARCHAR(30) NOT NULL DEFAULT 'lead'
    CHECK (stage IN ('lead','engaged','considering','viewing','negotiating','closing','won','lost')),
  stage_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  value_vnd BIGINT,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  event_type VARCHAR(40) NOT NULL
    CHECK (event_type IN ('stage_change','note','call','viewing','offer','contract','close','other')),
  from_stage VARCHAR(30),
  to_stage VARCHAR(30),
  notes TEXT,
  created_by_agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS person_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  doc_type VARCHAR(50) DEFAULT 'other',
  original_name VARCHAR(255),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_persons_agent ON persons(created_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_persons_type ON persons(type);
CREATE INDEX IF NOT EXISTS idx_persons_status ON persons(status);
CREATE INDEX IF NOT EXISTS idx_deals_agent ON deals(agent_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deal_events_deal ON deal_events(deal_id);

CREATE TABLE IF NOT EXISTS agent_favorites (
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  favorited_agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (agent_id, favorited_agent_id)
);
