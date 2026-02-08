-- Migration 005: Conversations per listing + fix cho_thue data
-- Conversations are now scoped to a specific listing, not just agent pairs.

-- Fix misclassified transaction types
UPDATE parsed_listings SET transaction_type = 'ban' WHERE transaction_type = 'cho_thue';

-- Clear existing conversations/messages (dev data only)
DELETE FROM messages;
DELETE FROM conversations;

-- Add listing_id to conversations
ALTER TABLE conversations ADD COLUMN listing_id INTEGER NOT NULL REFERENCES parsed_listings(id);

-- Replace the old unique constraint (agent pair only) with agent pair + listing
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS uq_conversations_pair;
ALTER TABLE conversations ADD CONSTRAINT uq_conversations_listing UNIQUE (agent_1_id, agent_2_id, listing_id);

-- Index for looking up conversations by listing
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON conversations(listing_id);
