-- app_config usa esquema key/value; agregar nuevo campo lógico de soporte.
INSERT INTO public.app_config (key, value)
VALUES ('support_address', '"Dirección no configurada"')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.app_config IS
  'Config global: support_email, support_phone, support_address, low_stock_notifications_enabled, low_stock_threshold';
