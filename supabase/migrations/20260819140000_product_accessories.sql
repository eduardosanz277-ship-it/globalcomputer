-- Accesorios de producto.
-- 1) Marca categorías como "de tipo accesorio" (las subcategorías heredan el flag
--    de su categoría padre vía join, no se duplica en `subcategories`).
-- 2) Relación explícita producto -> accesorios (ej. TV -> soporte, TV -> tornillos).
-- 3) Marca + tipo "Genérico" para accesorios sin fabricante específico
--    (brand_id / brand_type_id siguen siendo NOT NULL en products, no se relaja ese constraint).

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_accessory_type boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.product_accessories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  accessory_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, accessory_product_id),
  CHECK (product_id <> accessory_product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_accessories_product_id ON public.product_accessories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_accessories_accessory_product_id ON public.product_accessories(accessory_product_id);

ALTER TABLE public.product_accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_accessories_select" ON public.product_accessories FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_accessories_all_admin" ON public.product_accessories FOR ALL USING (is_admin());

CREATE POLICY "product_accessories_select_anon"
  ON public.product_accessories
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_accessories.product_id
        AND p.active = true
    )
  );

-- Marca/tipo "Genérico" para accesorios sin fabricante específico.
INSERT INTO public.brands (name, name_en, slug, active)
VALUES ('Genérico', 'Generic', 'generico', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brand_types (brand_id, name, name_en, slug, active)
SELECT b.id, 'Accesorios varios', 'Miscellaneous accessories', 'accesorios-varios', true
FROM public.brands b
WHERE b.slug = 'generico'
ON CONFLICT (brand_id, slug) DO NOTHING;
