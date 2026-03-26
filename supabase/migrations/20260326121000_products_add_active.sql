-- Añade un estado activo/inactivo a los productos.
-- Permite desactivar productos sin eliminarlos.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

