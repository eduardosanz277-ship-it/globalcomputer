-- Añade slug a servicios
ALTER TABLE IF EXISTS public.services
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.services
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

ALTER TABLE IF EXISTS public.services
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_services_slug_unique
  ON public.services (slug);
