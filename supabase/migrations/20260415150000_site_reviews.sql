-- =============================================
-- Reseñas públicas del sitio
-- =============================================

CREATE TABLE IF NOT EXISTS public.site_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_reviews_user_id ON public.site_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_site_reviews_created_at ON public.site_reviews(created_at DESC);

DROP TRIGGER IF EXISTS set_updated_at_site_reviews ON public.site_reviews;
CREATE TRIGGER set_updated_at_site_reviews
  BEFORE UPDATE ON public.site_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "site_reviews_select_public" ON public.site_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "site_reviews_insert_any" ON public.site_reviews
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' OR auth.role() = 'anonymous'
  );

CREATE POLICY "site_reviews_update_owner" ON public.site_reviews
  FOR UPDATE USING (
    user_id IS NOT NULL AND auth.uid() = user_id
  );

CREATE POLICY "site_reviews_delete_owner" ON public.site_reviews
  FOR DELETE USING (
    user_id IS NOT NULL AND auth.uid() = user_id
  );

CREATE POLICY "site_reviews_admin" ON public.site_reviews
  FOR ALL USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'ADMIN'
  ));
