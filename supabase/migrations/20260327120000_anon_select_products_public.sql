-- Catálogo público: productos e imágenes visibles sin sesión (solo activos).

CREATE POLICY "products_select_anon"
  ON public.products
  FOR SELECT
  TO anon
  USING (active = true);

-- Imágenes solo de productos activos (evita filtrar filas huérfanas en tienda).
CREATE POLICY "product_images_select_anon"
  ON public.product_images
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_id
        AND p.active = true
    )
  );
