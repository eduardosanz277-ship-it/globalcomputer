-- =============================================
-- FAQ: rename legacy Spanish columns and add English content
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'faqs'
      AND column_name = 'pregunta'
  ) THEN
    EXECUTE 'ALTER TABLE public.faqs RENAME COLUMN pregunta TO question';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'faqs'
      AND column_name = 'respuesta'
  ) THEN
    EXECUTE 'ALTER TABLE public.faqs RENAME COLUMN respuesta TO answer';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'faqs'
      AND column_name = 'activo'
  ) THEN
    EXECUTE 'ALTER TABLE public.faqs RENAME COLUMN activo TO active';
  END IF;
END $$;

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
