-- Asegura la columna y normaliza los slugs para categorías existentes
ALTER TABLE IF EXISTS public.categories
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.categories
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

ALTER TABLE IF EXISTS public.categories
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug_unique_not_deleted
  ON public.categories (slug)
  WHERE deleted_at IS NULL;
