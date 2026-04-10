-- Categorías y subcategorías (catálogo). Las tablas anteriores se eliminaron en 20250329120000_drop_categories_and_product_fks.sql.

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_unique_not_deleted
  ON public.categories (name)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories (category_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subcategories_category_name_unique_not_deleted
  ON public.subcategories (category_id, name)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS set_updated_at_categories ON public.categories;
CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_subcategories ON public.subcategories;
CREATE TRIGGER set_updated_at_subcategories
  BEFORE UPDATE ON public.subcategories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_authenticated"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "categories_all_admin"
  ON public.categories
  FOR ALL
  USING (is_admin());

CREATE POLICY "subcategories_select_authenticated"
  ON public.subcategories
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "subcategories_all_admin"
  ON public.subcategories
  FOR ALL
  USING (is_admin());

CREATE POLICY "categories_select_anon"
  ON public.categories
  FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

CREATE POLICY "subcategories_select_anon"
  ON public.subcategories
  FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated, service_role;
GRANT SELECT ON public.categories TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcategories TO authenticated, service_role;
GRANT SELECT ON public.subcategories TO anon;
