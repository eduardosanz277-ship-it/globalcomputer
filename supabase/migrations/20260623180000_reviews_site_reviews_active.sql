-- Columna visible/oculto para reseñas de producto y reseñas del sitio.
-- Por defecto activas.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE public.site_reviews
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
