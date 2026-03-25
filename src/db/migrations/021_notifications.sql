-- Migration 021: In-app notification system
-- Stores notifications for agents (new messages, new listings in area, etc.)

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,  -- 'new_message', 'new_listing', 'price_change', 'listing_favorited'
  title VARCHAR(500) NOT NULL,
  body TEXT,
  link VARCHAR(500),  -- URL to navigate to when clicked
  reference_id INTEGER,  -- optional: listing_id, conversation_id, etc.
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_agent_unread
  ON notifications (agent_id, is_read, created_at DESC)
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_agent_created
  ON notifications (agent_id, created_at DESC);

-- Track migration
INSERT INTO schema_migrations (version, description)
VALUES ('021_notifications', 'In-app notification system')
ON CONFLICT DO NOTHING;
