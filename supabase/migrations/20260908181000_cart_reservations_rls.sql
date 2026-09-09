-- Reservas de carrito: tabla interna solo accesible desde el servidor (service_role).
ALTER TABLE public.cart_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_reservations_public" ON public.cart_reservations;

REVOKE ALL ON public.cart_reservations FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_reservations TO service_role;

REVOKE ALL ON FUNCTION public.cart_reservation_active_quantity(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cart_reservation_active_quantity(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cart_reservation_active_quantity(uuid) TO service_role;
