-- Productos ya no usan categorías: quita columnas en products y elimina tablas de catálogo de categorías.
-- Orden: primero columnas en products (libera FKs), luego tablas dependientes.

ALTER TABLE public.products
  DROP COLUMN IF EXISTS category_specific_id,
  DROP COLUMN IF EXISTS category_id;

DROP TABLE IF EXISTS public.category_specific CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
