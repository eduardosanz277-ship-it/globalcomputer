-- site_reviews se creó después de los GRANT globales: hay que otorgar permisos explícitos.
-- Además: habilitar RLS y corregir el rol ('anon' en Supabase, no 'anonymous').

ALTER TABLE public.site_reviews ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_reviews TO authenticated;
GRANT SELECT, INSERT ON public.site_reviews TO anon;
GRANT ALL ON public.site_reviews TO service_role;

DROP POLICY IF EXISTS "site_reviews_insert_any" ON public.site_reviews;
CREATE POLICY "site_reviews_insert_any" ON public.site_reviews
  FOR INSERT
  WITH CHECK (
    (auth.role())::text = 'authenticated'
    OR (auth.role())::text = 'anon'
  );

DROP POLICY IF EXISTS "site_reviews_select_public" ON public.site_reviews;
CREATE POLICY "site_reviews_select_public" ON public.site_reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);
