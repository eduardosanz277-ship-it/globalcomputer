-- =============================================
-- Estructura inicial: perfiles, direcciones, config, marcas, categorías
-- Roles: CLIENT, BUSINESS, ADMIN
-- =============================================

-- Extensión para UUIDs (por si no está)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Perfiles (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('CLIENT', 'BUSINESS', 'ADMIN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfil de usuario; rol: CLIENT, BUSINESS, ADMIN';

-- Direcciones de usuario (múltiples por perfil)
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text,
  street text NOT NULL,
  city text NOT NULL,
  state text,
  postal_code text,
  country text NOT NULL DEFAULT 'España',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- Configuración general de la app (soporte, notificaciones, umbral stock bajo)
CREATE TABLE IF NOT EXISTS public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.app_config IS 'Config global: support_email, support_phone, notifications, low_stock_threshold';

-- Valores por defecto de configuración
INSERT INTO public.app_config (key, value) VALUES
  ('support_email', '"soporte@ejemplo.com"'),
  ('support_phone', '"+34000000000"'),
  ('notifications_enabled', 'true'),
  ('low_stock_threshold', '5')
ON CONFLICT (key) DO NOTHING;

-- Marcas de productos
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Categorías generales
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Categorías específicas (opcional: pueden depender de categoría general)
CREATE TABLE IF NOT EXISTS public.category_specific (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_category_specific_category_id ON public.category_specific(category_id);

-- Función para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at (idempotentes)
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_addresses ON public.addresses;
CREATE TRIGGER set_updated_at_addresses BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_app_config ON public.app_config;
CREATE TRIGGER set_updated_at_app_config BEFORE UPDATE ON public.app_config FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_brands ON public.brands;
CREATE TRIGGER set_updated_at_brands BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_categories ON public.categories;
CREATE TRIGGER set_updated_at_categories BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_category_specific ON public.category_specific;
CREATE TRIGGER set_updated_at_category_specific BEFORE UPDATE ON public.category_specific FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
