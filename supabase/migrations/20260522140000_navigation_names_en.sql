-- Agrega campo de nombre en inglés para la navegación
ALTER TABLE IF EXISTS public.product_characteristics_general
  ADD COLUMN IF NOT EXISTS name_en text;

ALTER TABLE IF EXISTS public.product_characteristics_specific
  ADD COLUMN IF NOT EXISTS name_en text;

ALTER TABLE IF EXISTS public.brands
  ADD COLUMN IF NOT EXISTS name_en text;

ALTER TABLE IF EXISTS public.brand_types
  ADD COLUMN IF NOT EXISTS name_en text;

ALTER TABLE IF EXISTS public.services
  ADD COLUMN IF NOT EXISTS name_en text;

ALTER TABLE IF EXISTS public.subcategories
  ADD COLUMN IF NOT EXISTS name_en text;

ALTER TABLE IF EXISTS public.product_characteristics_general
  ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE IF EXISTS public.product_characteristics_specific
  ALTER COLUMN updated_at SET DEFAULT now();
