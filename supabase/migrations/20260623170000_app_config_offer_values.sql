-- app_config usa esquema key/value; agregar valores para configuración de ofertas.
INSERT INTO public.app_config (key, value)
VALUES
  ('offer_amount', '0'),
  ('offer_percentage', '0')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.app_config IS
  'Config global: support_email, support_phone, support_address, low_stock_notifications_enabled, low_stock_threshold, offer_amount, offer_percentage';
