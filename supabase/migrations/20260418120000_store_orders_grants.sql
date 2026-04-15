-- =============================================
-- Permisos API (PostgREST) para tablas de pedidos del sitio
-- =============================================
-- Las tablas creadas después de 20250117100005 no reciben automáticamente
-- GRANT SELECT,INSERT,UPDATE,DELETE a authenticated; sin esto la API
-- devuelve 42501 "permission denied for table store_orders".

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_orders TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_order_items TO authenticated, service_role;
