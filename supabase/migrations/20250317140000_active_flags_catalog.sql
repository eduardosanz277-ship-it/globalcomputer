-- =============================================
-- Campo `active` en catálogo: marcas, tipos por marca,
-- características generales y específicas.
-- Por defecto true; usar false para ocultar sin borrar.
-- Requiere migración previa que renombre product_types → brand_types.
-- =============================================

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE public.brand_types
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE public.product_characteristics_general
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE public.product_characteristics_specific
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.brands.active IS 'Si false, la marca no se muestra en catálogo (soft-disable).';
COMMENT ON COLUMN public.brand_types.active IS 'Si false, el tipo no se muestra para esa marca.';
COMMENT ON COLUMN public.product_characteristics_general.active IS 'Si false, la característica general no se ofrece al configurar productos.';
COMMENT ON COLUMN public.product_characteristics_specific.active IS 'Si false, el valor específico no se ofrece.';
