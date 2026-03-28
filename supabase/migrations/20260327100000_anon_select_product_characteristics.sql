-- Catálogo de características visible sin sesión (navegación Security System).
-- Las políticas existentes solo permitían SELECT a authenticated; anon no veía filas.

CREATE POLICY "product_characteristics_general_select_anon"
  ON public.product_characteristics_general
  FOR SELECT
  TO anon
  USING (active = true);

CREATE POLICY "product_characteristics_specific_select_anon"
  ON public.product_characteristics_specific
  FOR SELECT
  TO anon
  USING (active = true);

-- Misma razón para marcas / tipos (menú Shop by brand sin sesión).
CREATE POLICY "brands_select_anon"
  ON public.brands
  FOR SELECT
  TO anon
  USING (active = true);

CREATE POLICY "brand_types_select_anon"
  ON public.brand_types
  FOR SELECT
  TO anon
  USING (active = true);
