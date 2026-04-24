-- =============================================
-- Services: add English description
-- =============================================

ALTER TABLE IF EXISTS public.services
  ADD COLUMN IF NOT EXISTS description_en text;

UPDATE public.services
SET description_en = COALESCE(description_en, description)
WHERE description_en IS NULL;
