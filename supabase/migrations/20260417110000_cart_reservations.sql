-- =============================================
-- Reservas de stock por carrito (para evitar sobreguardar stock bloqueado)
-- =============================================

CREATE TABLE IF NOT EXISTS public.cart_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_token text NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  qty int NOT NULL CHECK (qty >= 0),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_token, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_reservations_cart_token ON public.cart_reservations(cart_token);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_product_id ON public.cart_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_expires_at ON public.cart_reservations(expires_at);

DROP TRIGGER IF EXISTS set_updated_at_cart_reservations ON public.cart_reservations;
CREATE TRIGGER set_updated_at_cart_reservations
  BEFORE UPDATE ON public.cart_reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.cart_reservations IS 'Stock reservado por carrito (token) con expiración para bloquear inventario.';

CREATE OR REPLACE FUNCTION public.cart_reservation_active_quantity(p_product_id uuid)
RETURNS integer LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(qty), 0)::integer
  FROM public.cart_reservations
  WHERE product_id = p_product_id AND expires_at > now();
$$;

COMMENT ON FUNCTION public.cart_reservation_active_quantity(uuid) IS 'Cantidad reservada activa (no expirada) para cada producto.';

ALTER TABLE public.cart_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_reservations_public" ON public.cart_reservations
  FOR ALL USING (auth.role() IN ('authenticated', 'anonymous'));
