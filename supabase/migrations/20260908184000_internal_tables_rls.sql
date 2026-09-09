-- Tablas internas del servidor: contador de números de pedido y log de alertas de stock.

ALTER TABLE public.store_order_number_counters ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.store_order_number_counters FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.store_order_number_counters TO service_role;

ALTER TABLE public.low_stock_alert_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.low_stock_alert_logs FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.low_stock_alert_logs TO service_role;
