-- Stabilize Supabase Data API / PostgREST schema-cache loading.
--
-- Context:
--   Production REST/RPC probes returned PGRST002 after recent live closeout
--   migrations. Supabase documents this as a Data API schema-cache build
--   failure, commonly caused by stale exposed-schema configuration. This
--   project also has a broad legacy public schema, so the default 8s
--   authenticator timeout can interrupt cache rebuilds.
--
-- Keep the exposed schema list explicit and limited to schemas that exist in
-- this project, and allow the PostgREST authenticator connection the documented
-- 60s maximum timeout for schema-cache work.

ALTER ROLE authenticator IN DATABASE postgres
  SET pgrst.db_schemas = 'public, graphql_public, storage';

ALTER ROLE authenticator IN DATABASE postgres
  SET pgrst.db_extra_search_path = 'public, extensions';

ALTER ROLE authenticator IN DATABASE postgres
  SET statement_timeout = '60s';

ALTER ROLE authenticator IN DATABASE postgres
  SET lock_timeout = '60s';

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
