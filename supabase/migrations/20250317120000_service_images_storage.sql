-- =============================================
-- Servicios: imágenes múltiples + Supabase Storage (S3-compatible)
-- Amplía service_images con ruta en bucket e imagen principal.
-- Crea bucket `global_bucket` y políticas (lectura pública, escritura admin).
-- =============================================

-- Columnas para enlazar filas con objetos en Storage (además de la URL pública)
ALTER TABLE public.service_images
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS storage_bucket text NOT NULL DEFAULT 'global_bucket',
  ADD COLUMN IF NOT EXISTS storage_path text;

COMMENT ON COLUMN public.service_images.url IS 'URL pública o firmada para mostrar la imagen (p. ej. de Supabase Storage).';
COMMENT ON COLUMN public.service_images.storage_path IS 'Ruta del objeto dentro del bucket (p. ej. services/<service_id>/<archivo>). Necesaria para borrar/reemplazar vía API.';
COMMENT ON COLUMN public.service_images.storage_bucket IS 'Nombre del bucket de Supabase Storage (por defecto global_bucket).';

-- A lo sumo una imagen principal por servicio
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_images_one_primary_per_service
  ON public.service_images (service_id)
  WHERE is_primary = true;

-- Lectura pública del catálogo de servicios (visitantes sin sesión)
DROP POLICY IF EXISTS "services_select" ON public.services;
CREATE POLICY "services_select_public"
  ON public.services FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "service_images_select" ON public.service_images;
CREATE POLICY "service_images_select_public"
  ON public.service_images FOR SELECT
  USING (true);

-- Escritura sigue siendo solo admin (políticas existentes en 20250117100004)
-- Si no existieran, descomenta:
-- CREATE POLICY "services_all_admin" ON public.services FOR ALL USING (public.is_admin());
-- CREATE POLICY "service_images_all_admin" ON public.service_images FOR ALL USING (public.is_admin());

-- ========== Storage: bucket ==========
-- Bucket público para URLs directas; tamaño máx. 5 MB; solo imágenes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'global_bucket',
  'global_bucket',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = COALESCE(EXCLUDED.file_size_limit, storage.buckets.file_size_limit),
  allowed_mime_types = COALESCE(EXCLUDED.allowed_mime_types, storage.buckets.allowed_mime_types);

-- ========== Políticas storage.objects ==========
DROP POLICY IF EXISTS "service_images_public_read" ON storage.objects;
CREATE POLICY "service_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'global_bucket');

DROP POLICY IF EXISTS "service_images_admin_insert" ON storage.objects;
CREATE POLICY "service_images_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'global_bucket'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "service_images_admin_update" ON storage.objects;
CREATE POLICY "service_images_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'global_bucket' AND public.is_admin())
  WITH CHECK (bucket_id = 'global_bucket' AND public.is_admin());

DROP POLICY IF EXISTS "service_images_admin_delete" ON storage.objects;
CREATE POLICY "service_images_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'global_bucket' AND public.is_admin());
