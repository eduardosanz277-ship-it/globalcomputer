-- =============================================
-- Pedidos completados en Stripe (sitio)
-- =============================================

CREATE TABLE IF NOT EXISTS public.store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  stripe_session_id text,
  status text NOT NULL DEFAULT 'confirmada'
    CHECK (status IN ('confirmada', 'procesando', 'enviando', 'completada')),
  total_amount decimal(12,2) NOT NULL CHECK (total_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_orders_user_id ON public.store_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON public.store_orders(status);

CREATE TABLE IF NOT EXISTS public.store_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_order_id uuid NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  unit_price decimal(12,2) NOT NULL CHECK (unit_price >= 0),
  total_price decimal(12,2) NOT NULL CHECK (total_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_order_items_store_order_id ON public.store_order_items(store_order_id);

DROP TRIGGER IF EXISTS set_updated_at_store_orders ON public.store_orders;
CREATE TRIGGER set_updated_at_store_orders
  BEFORE UPDATE ON public.store_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
