-- =============================================
-- app_config: toggle explícito para alertas de stock bajo
-- - low_stock_notifications_enabled: activa/desactiva estas alertas
-- - low_stock_threshold: límite (solo relevante si el toggle está activo)
-- Copia valor desde notifications_enabled (si existía) y elimina esa clave.
-- =============================================

INSERT INTO public.app_config (key, value)
VALUES (
  'low_stock_notifications_enabled',
  COALESCE(
    (SELECT value FROM public.app_config WHERE key = 'notifications_enabled'),
    'true'::jsonb
  )
)
ON CONFLICT (key) DO NOTHING;

DELETE FROM public.app_config WHERE key = 'notifications_enabled';

COMMENT ON TABLE public.app_config IS
  'Config global: support_email, support_phone, low_stock_notifications_enabled, low_stock_threshold';
