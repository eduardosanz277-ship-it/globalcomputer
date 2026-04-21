-- Añade slug a productos para URLs públicas
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.products
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

ALTER TABLE IF EXISTS public.products
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique
  ON public.products (slug);
