-- Migration 014: Schema migrations tracking table
-- Allows migrate.sh to skip already-applied migrations safely

CREATE TABLE IF NOT EXISTS schema_migrations (
  version    TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backfill all previously applied migrations
INSERT INTO schema_migrations (version) VALUES
  ('001_init'), ('002'), ('003'), ('004'), ('005'),
  ('006'), ('007'), ('008'), ('009a'), ('009b'), ('010'),
  ('011'), ('012'), ('013')
ON CONFLICT DO NOTHING;
