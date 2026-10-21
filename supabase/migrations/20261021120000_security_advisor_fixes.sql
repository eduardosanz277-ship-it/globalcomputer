-- Correcciones del Security Advisor de Supabase.

-- ========== 0011: search_path fijo en funciones ==========
ALTER FUNCTION public.set_updated_at_timestamp() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.current_user_role() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.cart_reservation_active_quantity(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.store_orders_guard_stripe_status() SET search_path = public;

-- ========== 0028/0029: SECURITY DEFINER expuestas vía RPC ==========
-- Funciones de trigger: no necesitan EXECUTE para dispararse.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.allocate_store_order_number() FROM PUBLIC, anon, authenticated;

-- Se mantienen a propósito:
--   is_admin(), current_user_role(): usadas en políticas RLS (anon/authenticated necesitan EXECUTE).
--   business_login_block_reason(text): se consulta antes del login (anon).

-- ========== 0025: bucket público con listado ==========
-- Las URLs públicas no requieren política SELECT; solo admins la necesitan (upload con upsert).
DROP POLICY IF EXISTS "service_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "service_images_admin_select" ON storage.objects;
CREATE POLICY "service_images_admin_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'global_bucket' AND public.is_admin());
