-- Agrega nombre en inglés para categorías
ALTER TABLE IF EXISTS public.categories
  ADD COLUMN IF NOT EXISTS name_en text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_en_unique_not_deleted
  ON public.categories (name_en)
  WHERE deleted_at IS NULL AND name_en IS NOT NULL;

ALTER TABLE public.categories
  ALTER COLUMN updated_at SET DEFAULT now();
