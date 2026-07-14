-- Alineación del título y la descripción corta del hero del servicio.

ALTER TABLE IF EXISTS public.services
  ADD COLUMN IF NOT EXISTS text_align text NOT NULL DEFAULT 'left';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'services_text_align_check'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_text_align_check
      CHECK (text_align IN ('left', 'center', 'right'));
  END IF;
END $$;

COMMENT ON COLUMN public.services.text_align IS
  'Horizontal alignment for hero title and short description: left, center, or right.';
