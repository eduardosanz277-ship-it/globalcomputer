-- =============================================
-- Ajusta el nombre del parámetro para la RPC de reservas
-- =============================================

DROP FUNCTION IF EXISTS public.cart_reservation_active_quantity(uuid);

CREATE FUNCTION public.cart_reservation_active_quantity(product_id uuid)
RETURNS integer LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(qty), 0)::integer
  FROM public.cart_reservations
  WHERE product_id = $1 AND expires_at > now();
$$;

COMMENT ON FUNCTION public.cart_reservation_active_quantity(uuid) IS
  'Cantidad reservada activa (no expirada) para cada producto - RPC compatible.';
