-- =============================================
-- Carrito y pedidos (carts, cart_items, orders, order_items)
-- =============================================

-- Carrito: un carrito por usuario (user_id)
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);

-- Ítems del carrito
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity int NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- Estados de pedido
-- pending, paid, processing, shipped, delivered, cancelled

-- Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  total decimal(12,2) NOT NULL CHECK (total >= 0),
  stripe_payment_id text,
  shipping_address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Líneas de pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity int NOT NULL CHECK (quantity > 0),
  unit_price decimal(12,2) NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Triggers updated_at
DROP TRIGGER IF EXISTS set_updated_at_carts ON public.carts;
CREATE TRIGGER set_updated_at_carts BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_cart_items ON public.cart_items;
CREATE TRIGGER set_updated_at_cart_items BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_orders ON public.orders;
CREATE TRIGGER set_updated_at_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
