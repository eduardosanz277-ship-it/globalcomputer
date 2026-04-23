-- =============================================
-- FAQ: rename legacy Spanish columns and add English content
-- =============================================

ALTER TABLE public.faqs
  RENAME COLUMN IF EXISTS pregunta TO question;

ALTER TABLE public.faqs
  RENAME COLUMN IF EXISTS respuesta TO answer;

ALTER TABLE public.faqs
  RENAME COLUMN IF EXISTS activo TO active;

ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS question_en text,
  ADD COLUMN IF NOT EXISTS answer_en text;

UPDATE public.faqs
SET
  question_en = COALESCE(NULLIF(question_en, ''), question),
  answer_en = COALESCE(NULLIF(answer_en, ''), answer);

ALTER TABLE public.faqs
  ALTER COLUMN question_en SET NOT NULL,
  ALTER COLUMN answer_en SET NOT NULL;
