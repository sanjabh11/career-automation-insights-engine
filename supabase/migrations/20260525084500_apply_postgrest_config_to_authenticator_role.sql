-- Apply the PostgREST Data API configuration directly to the authenticator
-- role as documented by Supabase troubleshooting guidance. The prior migration
-- used a database-specific role setting; this global role setting ensures
-- PostgREST can read the override during config reload on existing hosted
-- project wiring.

ALTER ROLE authenticator
  SET pgrst.db_schemas = 'public, graphql_public, storage';

ALTER ROLE authenticator
  SET pgrst.db_extra_search_path = 'public, extensions';

ALTER ROLE authenticator
  SET statement_timeout = '60s';

ALTER ROLE authenticator
  SET lock_timeout = '60s';

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
