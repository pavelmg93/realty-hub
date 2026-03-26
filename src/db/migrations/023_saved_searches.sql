-- Migration 023: Saved Searches
-- Adds saved_searches and saved_search_persons tables

CREATE TABLE IF NOT EXISTS saved_searches (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  query TEXT DEFAULT '',
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_search_persons (
  saved_search_id INTEGER NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  PRIMARY KEY (saved_search_id, person_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_agent ON saved_searches(agent_id);
CREATE INDEX IF NOT EXISTS idx_saved_search_persons_search ON saved_search_persons(saved_search_id);
CREATE INDEX IF NOT EXISTS idx_saved_search_persons_person ON saved_search_persons(person_id);
