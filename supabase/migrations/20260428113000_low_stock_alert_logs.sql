-- Log de última alerta de stock bajo enviada por producto.
-- Se usa para cooldown de 24h entre correos.

CREATE TABLE IF NOT EXISTS public.low_stock_alert_logs (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  last_sent_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at_low_stock_alert_logs ON public.low_stock_alert_logs;
CREATE TRIGGER set_updated_at_low_stock_alert_logs
  BEFORE UPDATE ON public.low_stock_alert_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.low_stock_alert_logs TO service_role;
