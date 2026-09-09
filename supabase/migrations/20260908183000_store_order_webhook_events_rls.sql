-- Eventos Stripe de pedidos: tabla interna solo accesible desde el servidor (service_role).
-- Contiene payload jsonb con datos sensibles de checkout/pago.

ALTER TABLE public.store_order_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.store_order_webhook_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_order_webhook_events TO service_role;
