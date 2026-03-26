-- Migration 022: Fix immutable_unaccent to use schema-qualified reference
--
-- pg_dump sets search_path to empty during restore, which breaks the
-- unaccent() call inside immutable_unaccent. Using public.unaccent()
-- ensures it works regardless of search_path.

CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent($1);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

INSERT INTO schema_migrations (version, description)
VALUES ('022_fix_immutable_unaccent', 'Schema-qualify unaccent in immutable wrapper for pg_dump compatibility')
ON CONFLICT DO NOTHING;
