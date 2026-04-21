-- Añade slug a características generales y específicas
ALTER TABLE IF EXISTS public.product_characteristics_general
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.product_characteristics_general
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

ALTER TABLE IF EXISTS public.product_characteristics_general
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_characteristics_general_slug_unique
  ON public.product_characteristics_general (slug);

ALTER TABLE IF EXISTS public.product_characteristics_specific
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.product_characteristics_specific
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

ALTER TABLE IF EXISTS public.product_characteristics_specific
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_characteristics_specific_slug_unique
  ON public.product_characteristics_specific (general_id, slug);
