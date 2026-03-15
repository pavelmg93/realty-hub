-- Migration 009: Conversations without listing (general thread) + archive threads
-- Run: docker exec -i re-nhatrang-app-postgres-1 psql -U re_nhatrang -d re_nhatrang < src/db/migrations/009_conversations_optional_listing_archive.sql

-- Allow conversation without a listing (general agent-to-agent thread)
ALTER TABLE conversations ALTER COLUMN listing_id DROP NOT NULL;

-- One general thread per pair: treat NULL listing_id as equal in unique constraint (PostgreSQL 15+)
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS uq_conversations_listing;
ALTER TABLE conversations ADD CONSTRAINT uq_conversations_listing
  UNIQUE NULLS NOT DISTINCT (agent_1_id, agent_2_id, listing_id);

-- Archive threads (soft hide)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived_by_agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL;
