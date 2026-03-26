-- Permite que `public.products.brand_type_id` sea NULL cuando la marca no tenga tipos.
-- El formulario ahora acepta `brandTypeId` vacío (se envía como null) y la DB debe reflejarlo.

ALTER TABLE public.products
  ALTER COLUMN brand_type_id DROP NOT NULL;

