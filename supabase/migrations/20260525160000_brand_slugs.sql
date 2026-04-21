-- Añade slugs a marcas y tipos de marca
ALTER TABLE IF EXISTS public.brands
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.brands
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

ALTER TABLE IF EXISTS public.brands
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_slug_unique
  ON public.brands (slug);

ALTER TABLE IF EXISTS public.brand_types
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.brand_types
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

ALTER TABLE IF EXISTS public.brand_types
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_types_slug_unique
  ON public.brand_types (brand_id, slug);
