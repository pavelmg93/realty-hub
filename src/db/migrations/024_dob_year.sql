-- Migration 024: Add dob_year to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS dob_year smallint;
