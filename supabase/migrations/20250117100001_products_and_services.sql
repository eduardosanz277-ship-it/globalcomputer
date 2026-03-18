-- =============================================
-- Tipos de producto por marca, características, productos, imágenes, servicios
-- =============================================

-- Tipo de producto por marca (ej: marca Nike -> tipos Zapatillas, Ropa)
CREATE TABLE IF NOT EXISTS public.product_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_types_brand_id ON public.product_types(brand_id);

-- Características generales (ej: Color, RAM, Pulgadas)
CREATE TABLE IF NOT EXISTS public.product_characteristics_general (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Características específicas (ej: bajo "Color" -> Rojo, Negro)
CREATE TABLE IF NOT EXISTS public.product_characteristics_specific (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  general_id uuid NOT NULL REFERENCES public.product_characteristics_general(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(general_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_characteristics_specific_general_id ON public.product_characteristics_specific(general_id);

-- Productos
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  stock int NOT NULL DEFAULT 0,
  price decimal(12,2) NOT NULL CHECK (price >= 0),
  discount_business_pct decimal(5,2) NOT NULL DEFAULT 0 CHECK (discount_business_pct >= 0 AND discount_business_pct <= 100),
  discount_client decimal(12,2) NOT NULL DEFAULT 0 CHECK (discount_client >= 0),
  manual_pdf_url text,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
  product_type_id uuid NOT NULL REFERENCES public.product_types(id) ON DELETE RESTRICT,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  category_specific_id uuid REFERENCES public.category_specific(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_product_type_id ON public.products(product_type_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- Imágenes de producto (una marcada como principal)
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- Valores de características por producto (producto + característica específica + valor opcional)
CREATE TABLE IF NOT EXISTS public.product_characteristic_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  characteristic_specific_id uuid NOT NULL REFERENCES public.product_characteristics_specific(id) ON DELETE CASCADE,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, characteristic_specific_id)
);

CREATE INDEX IF NOT EXISTS idx_product_characteristic_values_product_id ON public.product_characteristic_values(product_id);

-- Servicios (nombre, descripción, imágenes)
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_images_service_id ON public.service_images(service_id);

-- Triggers updated_at (idempotentes)
DROP TRIGGER IF EXISTS set_updated_at_product_types ON public.product_types;
CREATE TRIGGER set_updated_at_product_types BEFORE UPDATE ON public.product_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_product_characteristics_general ON public.product_characteristics_general;
CREATE TRIGGER set_updated_at_product_characteristics_general BEFORE UPDATE ON public.product_characteristics_general FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_product_characteristics_specific ON public.product_characteristics_specific;
CREATE TRIGGER set_updated_at_product_characteristics_specific BEFORE UPDATE ON public.product_characteristics_specific FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_products ON public.products;
CREATE TRIGGER set_updated_at_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_product_images ON public.product_images;
CREATE TRIGGER set_updated_at_product_images BEFORE UPDATE ON public.product_images FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_services ON public.services;
CREATE TRIGGER set_updated_at_services BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_service_images ON public.service_images;
CREATE TRIGGER set_updated_at_service_images BEFORE UPDATE ON public.service_images FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
