-- `product_accessories` se creó sin los GRANT de tabla explícitos (los GRANT masivos de
-- 2025 solo cubrieron las tablas que existían en ese momento). Sin esto, RLS nunca llega
-- a evaluarse: Postgres rechaza antes con 42501 (permission denied) para anon/authenticated
-- e incluso para service_role.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_accessories TO authenticated, service_role;
GRANT SELECT ON public.product_accessories TO anon;
