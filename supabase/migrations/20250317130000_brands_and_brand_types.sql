-- =============================================
-- Marcas (brands) y tipos por marca (brand_types)
-- - brands: solo nombre (único).
-- - brand_types: brand_id + nombre (único por marca).
-- Renombra product_types → brand_types y products.product_type_id → brand_type_id.
-- Catálogo legible sin sesión (SELECT público).
-- =============================================

-- Comentarios explícitos en marcas
COMMENT ON TABLE public.brands IS 'Marcas de productos; gestión por nombre.';
COMMENT ON COLUMN public.brands.name IS 'Nombre de la marca (único).';

-- ========== Renombrar product_types → brand_types ==========
DROP POLICY IF EXISTS "product_types_select" ON public.product_types;
DROP POLICY IF EXISTS "product_types_all_admin" ON public.product_types;

ALTER TABLE public.product_types RENAME TO brand_types;

-- Índice asociado al nombre de tabla
ALTER INDEX IF EXISTS idx_product_types_brand_id RENAME TO idx_brand_types_brand_id;

-- Restricción UNIQUE(brand_id, name) suele llamarse product_types_brand_id_name_key
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'product_types_brand_id_name_key'
      AND conrelid = 'public.brand_types'::regclass
  ) THEN
    ALTER TABLE public.brand_types RENAME CONSTRAINT product_types_brand_id_name_key TO brand_types_brand_id_name_key;
  END IF;
END $$;

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at_product_types ON public.brand_types;
CREATE TRIGGER set_updated_at_brand_types
  BEFORE UPDATE ON public.brand_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.brand_types IS 'Tipos de producto por marca (ej. marca X → Zapatillas, Ropa).';
COMMENT ON COLUMN public.brand_types.brand_id IS 'Marca a la que pertenece el tipo.';
COMMENT ON COLUMN public.brand_types.name IS 'Nombre del tipo dentro de la marca (único por brand_id).';

-- ========== Renombrar FK en products ==========
ALTER TABLE public.products RENAME COLUMN product_type_id TO brand_type_id;

ALTER INDEX IF EXISTS idx_products_product_type_id RENAME TO idx_products_brand_type_id;

DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  WHERE con.conrelid = 'public.products'::regclass
    AND con.contype = 'f'
    AND con.confrelid = 'public.brand_types'::regclass
  LIMIT 1;
  IF cname IS NOT NULL AND cname <> 'products_brand_type_id_fkey' THEN
    EXECUTE format('ALTER TABLE public.products RENAME CONSTRAINT %I TO products_brand_type_id_fkey', cname);
  END IF;
END $$;

-- ========== RLS brand_types (lectura pública, escritura admin) ==========
ALTER TABLE public.brand_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_types_select_public" ON public.brand_types;
DROP POLICY IF EXISTS "brand_types_all_admin" ON public.brand_types;

CREATE POLICY "brand_types_select_public"
  ON public.brand_types FOR SELECT
  USING (true);

CREATE POLICY "brand_types_all_admin"
  ON public.brand_types FOR ALL
  USING (public.is_admin());

-- ========== RLS brands: lectura pública ==========
DROP POLICY IF EXISTS "brands_select" ON public.brands;
DROP POLICY IF EXISTS "brands_select_public" ON public.brands;

CREATE POLICY "brands_select_public"
  ON public.brands FOR SELECT
  USING (true);

-- brands_all_admin sigue definida en 20250117100004 (solo admin muta marcas).
