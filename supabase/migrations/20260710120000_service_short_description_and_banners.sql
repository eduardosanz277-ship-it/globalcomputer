-- Descripción corta (hero) + banners por breakpoint en services.

ALTER TABLE IF EXISTS public.services
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS short_description_en text,
  ADD COLUMN IF NOT EXISTS banner_mobile_url text,
  ADD COLUMN IF NOT EXISTS banner_mobile_storage_bucket text,
  ADD COLUMN IF NOT EXISTS banner_mobile_storage_path text,
  ADD COLUMN IF NOT EXISTS banner_tablet_url text,
  ADD COLUMN IF NOT EXISTS banner_tablet_storage_bucket text,
  ADD COLUMN IF NOT EXISTS banner_tablet_storage_path text,
  ADD COLUMN IF NOT EXISTS banner_desktop_url text,
  ADD COLUMN IF NOT EXISTS banner_desktop_storage_bucket text,
  ADD COLUMN IF NOT EXISTS banner_desktop_storage_path text;

COMMENT ON COLUMN public.services.short_description IS
  'Short phrase from the service hero (ES).';
COMMENT ON COLUMN public.services.short_description_en IS
  'Short phrase from the service hero (EN).';
COMMENT ON COLUMN public.services.banner_mobile_url IS
  'Public URL for the mobile service banner.';
COMMENT ON COLUMN public.services.banner_tablet_url IS
  'Public URL for the tablet service banner.';
COMMENT ON COLUMN public.services.banner_desktop_url IS
  'Public URL for the desktop service banner.';
