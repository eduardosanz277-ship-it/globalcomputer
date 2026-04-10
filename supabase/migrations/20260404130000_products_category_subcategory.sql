-- Producto asociado a categoría O a subcategoría (exactamente una de las dos).

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.subcategories (id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products (subcategory_id);

ALTER TABLE public.products
  ADD CONSTRAINT products_category_xor_subcategory CHECK (
    (category_id IS NOT NULL AND subcategory_id IS NULL)
    OR (category_id IS NULL AND subcategory_id IS NOT NULL)
  ) NOT VALID;
