-- Snapshot del SKU en la línea de pedido (histórico, como product_name).
ALTER TABLE public.store_order_items
  ADD COLUMN IF NOT EXISTS product_sku text;

UPDATE public.store_order_items soi
SET product_sku = NULLIF(TRIM(p.sku), '')
FROM public.products p
WHERE p.id = soi.product_id
  AND (soi.product_sku IS NULL OR TRIM(soi.product_sku) = '');
