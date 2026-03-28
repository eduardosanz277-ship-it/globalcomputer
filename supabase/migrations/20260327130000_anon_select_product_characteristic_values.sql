-- Valores de características visibles para catálogo público (Security System + productos por específico).

CREATE POLICY "product_characteristic_values_select_anon"
  ON public.product_characteristic_values
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_characteristic_values.product_id
        AND p.active = true
    )
  );
