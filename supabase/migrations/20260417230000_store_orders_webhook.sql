-- =============================================
-- Extiende pedidos con datos de Stripe y log de eventos
-- =============================================

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS amount_subtotal decimal(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_tax decimal(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_shipping decimal(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_amount_total decimal(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_payment_status text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent text;

CREATE INDEX IF NOT EXISTS idx_store_orders_stripe_session_id ON public.store_orders(stripe_session_id);

CREATE TABLE IF NOT EXISTS public.store_order_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_order_id uuid NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  stripe_event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_order_id, stripe_event_id)
);

CREATE INDEX IF NOT EXISTS idx_store_order_webhook_events_stripe_event_id ON public.store_order_webhook_events(stripe_event_id);

DROP TRIGGER IF EXISTS set_updated_at_store_orders ON public.store_orders;
CREATE TRIGGER set_updated_at_store_orders
  BEFORE UPDATE ON public.store_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
