-- =============================================
-- Solicitudes de contacto (formulario público)
-- =============================================

CREATE TABLE IF NOT EXISTS public.contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at
  ON public.contact_requests(created_at DESC);

DROP TRIGGER IF EXISTS set_updated_at_contact_requests ON public.contact_requests;
CREATE TRIGGER set_updated_at_contact_requests
  BEFORE UPDATE ON public.contact_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON public.contact_requests TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_requests TO service_role;

DROP POLICY IF EXISTS "contact_requests_insert_public" ON public.contact_requests;
CREATE POLICY "contact_requests_insert_public" ON public.contact_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
