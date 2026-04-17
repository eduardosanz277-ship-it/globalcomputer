-- Agrega campos de merchandising, especificaciones y métrica de visualizaciones a products.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS specifications text,
  ADD COLUMN IF NOT EXISTS views int;
