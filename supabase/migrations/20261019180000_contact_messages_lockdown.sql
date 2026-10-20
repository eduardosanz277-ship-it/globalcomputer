-- El formulario de contacto solo inserta vía API (service role).
-- Idempotente: se puede reejecutar si la tabla o los privilegios ya están aplicados.

DO $$
BEGIN
  IF to_regclass('public.contact_messages') IS NOT NULL THEN
    DROP POLICY IF EXISTS "contact_messages_insert_public" ON public.contact_messages;
    REVOKE INSERT ON public.contact_messages FROM anon, authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO service_role;
  END IF;
END $$;

-- Límite de frecuencia por IP y email (solo servidor).
CREATE TABLE IF NOT EXISTS public.contact_request_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('ip', 'email')),
  key_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_request_submissions_lookup
  ON public.contact_request_submissions (scope, key_hash, created_at DESC);

DO $$
BEGIN
  IF to_regclass('public.contact_request_submissions') IS NOT NULL THEN
    ALTER TABLE public.contact_request_submissions ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.contact_request_submissions FROM anon, authenticated;
    GRANT SELECT, INSERT, DELETE ON public.contact_request_submissions TO service_role;
  END IF;
END $$;
