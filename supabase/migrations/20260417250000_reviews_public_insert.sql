-- Permitir reseñas de producto sin autenticación (invitados).
-- Mantiene comportamiento actual para usuarios autenticados.

ALTER TABLE public.reviews
  ALTER COLUMN user_id DROP NOT NULL;

-- Asegurar permisos mínimos para rol anon en reviews.
GRANT SELECT, INSERT ON public.reviews TO anon;

-- Reemplazar políticas de SELECT/INSERT por versión pública.
DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;

CREATE POLICY "reviews_select_public"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "reviews_insert_public"
  ON public.reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL) OR
    (auth.uid() = user_id)
  );
