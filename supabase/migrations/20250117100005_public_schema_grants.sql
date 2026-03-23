-- =============================================
-- Permisos en el esquema public (PostgREST / API)
-- =============================================
-- Si aparece error 42501 "permission denied for schema public" al usar la API
-- (anon / authenticated), suele faltar GRANT USAGE ON SCHEMA public.
-- Ocurre en algunos proyectos PG15+ o con privilegios revocados.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Tablas y secuencias ya existentes (RLS sigue aplicando por fila)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Funciones expuestas (RPC)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
