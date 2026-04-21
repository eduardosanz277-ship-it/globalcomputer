-- Añade slug a subcategorías para URLs públicas
ALTER TABLE IF EXISTS public.subcategories
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.subcategories
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

ALTER TABLE public.subcategories
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subcategories_slug_unique_not_deleted
  ON public.subcategories (category_id, slug)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS set_updated_at_subcategories ON public.subcategories;
CREATE TRIGGER set_updated_at_subcategories
  BEFORE UPDATE ON public.subcategories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
