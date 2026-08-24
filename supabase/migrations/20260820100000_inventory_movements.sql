-- =============================================
-- Inventory tracking: movements table + order inventory_status column.
-- Movements record every stock change (sales, returns, adjustments).
-- inventory_status on store_orders tracks whether inventory was processed
-- after a confirmed Stripe payment.
-- =============================================

-- Historical log of every stock change per product.
-- quantity < 0 = outgoing (sale, loss), quantity > 0 = incoming (return, restock).
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid        NOT NULL
    REFERENCES public.products (id) ON DELETE RESTRICT,
  store_order_id uuid
    REFERENCES public.store_orders (id) ON DELETE RESTRICT,
  quantity       int         NOT NULL,
  type           text        NOT NULL
    CHECK (type IN ('sale', 'return', 'adjustment')),
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),

  -- One 'sale' movement per order+product prevents duplicate stock deductions.
  -- A future 'return' is allowed separately on the same order+product.
  CONSTRAINT inventory_movements_order_product_type_unique
    UNIQUE (store_order_id, product_id, type)
);

COMMENT ON TABLE public.inventory_movements IS
  'Historical log of every product stock change. quantity < 0 = outgoing, > 0 = incoming.';
COMMENT ON COLUMN public.inventory_movements.quantity IS
  'Negative for outgoing movements (sale, loss). Positive for incoming (return, restock).';
COMMENT ON COLUMN public.inventory_movements.type IS
  'Movement category: sale = webhook-confirmed deduction after Stripe payment, return = future cancellation/refund restock, adjustment = manual admin correction.';
COMMENT ON CONSTRAINT inventory_movements_order_product_type_unique
  ON public.inventory_movements IS
  'Prevents the same movement type from being recorded twice for the same order+product pair (idempotency guard at DB level).';

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id
  ON public.inventory_movements (product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_store_order_id
  ON public.inventory_movements (store_order_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at
  ON public.inventory_movements (created_at DESC);

-- -------------------------------------------------------
-- Safety constraint: stock can never be negative.
-- Verified: no existing rows have stock < 0 before applying this migration.
-- Prevents accidental manual updates or future bugs from creating negative stock.
-- Wrapped in a DO block so the migration is idempotent (re-runnable).
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.products'::regclass
      AND conname  = 'products_stock_non_negative'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);
  END IF;
END;
$$;

COMMENT ON CONSTRAINT products_stock_non_negative ON public.products IS
  'Stock cannot be negative. The process_order_inventory RPC enforces this logically; this constraint is the DB-level safety net.';

-- -------------------------------------------------------
-- Track inventory processing state on each store order.
-- null      = not yet processed (initial state)
-- processed = stock successfully deducted for all items
-- conflict  = payment confirmed but at least one item had insufficient stock
-- -------------------------------------------------------
ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS inventory_status text
  CHECK (
    inventory_status IS NULL OR
    inventory_status IN ('processed', 'conflict')
  );

COMMENT ON COLUMN public.store_orders.inventory_status IS
  'Inventory processing outcome: null = not attempted yet, processed = stock deducted, conflict = insufficient stock after payment confirmed (requires admin review).';

-- Backfill: mark existing confirmed/paid Stripe orders as inventory-exempt.
-- These orders were created before inventory tracking existed; their stock
-- was never deducted via this system. Marking them "processed" ensures
-- their confirmation emails are not accidentally blocked by the new check.
-- Note: no inventory_movements records exist for these historical orders.
UPDATE public.store_orders
SET inventory_status = 'processed'
WHERE stripe_session_id IS NOT NULL
  AND inventory_status IS NULL
  AND status IN ('confirmed', 'processing', 'shipping', 'completed');

-- -------------------------------------------------------
-- Permissions
-- -------------------------------------------------------
-- Service role: full access for server-side operations via RPC and admin client.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_movements TO service_role;

-- Authenticated admins can read movements for reporting.
GRANT SELECT ON public.inventory_movements TO authenticated;

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_movements_select_admin" ON public.inventory_movements;
CREATE POLICY "inventory_movements_select_admin"
  ON public.inventory_movements
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'ADMIN'
    )
  );
