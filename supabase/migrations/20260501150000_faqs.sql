-- =============================================
-- Preguntas frecuentes (FAQ)
-- =============================================

CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pregunta text NOT NULL,
  respuesta text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faqs_activo ON public.faqs(activo);
CREATE INDEX IF NOT EXISTS idx_faqs_created_at ON public.faqs(created_at DESC);

DROP TRIGGER IF EXISTS set_updated_at_faqs ON public.faqs;
CREATE TRIGGER set_updated_at_faqs
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.faqs TO authenticated;
GRANT SELECT ON public.faqs TO anon;
GRANT ALL ON public.faqs TO service_role;

DROP POLICY IF EXISTS "faqs_select_public_active" ON public.faqs;
CREATE POLICY "faqs_select_public_active" ON public.faqs
  FOR SELECT
  TO anon, authenticated
  USING (activo = true);
