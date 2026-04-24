-- =============================================
-- Products: add English content fields
-- =============================================

ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS specifications_en text;

UPDATE public.products
SET
  name_en = COALESCE(name_en, name),
  description_en = COALESCE(description_en, description),
  specifications_en = COALESCE(specifications_en, specifications)
WHERE
  name_en IS NULL
  OR description_en IS NULL
  OR specifications_en IS NULL;
