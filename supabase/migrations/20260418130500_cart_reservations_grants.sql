-- =============================================
-- Permisos API para `cart_reservations`
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_reservations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_reservations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_reservations TO service_role;
