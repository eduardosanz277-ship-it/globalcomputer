-- PostgREST con SUPABASE_SERVICE_ROLE_KEY usa el rol `service_role`.
-- Sin GRANT sobre tablas, UPDATE/INSERT fallan con 42501 (no es RLS).

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
