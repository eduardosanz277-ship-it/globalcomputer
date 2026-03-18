-- =============================================
-- RLS, trigger de perfil en signup y usuario admin por defecto
-- =============================================

-- Habilitar RLS en todas las tablas públicas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_specific ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_characteristics_general ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_characteristics_specific ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_characteristic_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper: rol del usuario actual desde profiles
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT current_user_role() = 'ADMIN'
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ========== PROFILES ==========
-- Usuario ve/edita solo su perfil
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Admin ve todos los perfiles
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (is_admin());
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (is_admin());
-- Insert lo hace el trigger (security definer)

-- ========== ADDRESSES ==========
CREATE POLICY "addresses_all_own" ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- ========== APP_CONFIG ==========
-- Lectura: todos autenticados. Escritura: solo admin
CREATE POLICY "app_config_select_authenticated" ON public.app_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_config_all_admin" ON public.app_config FOR ALL USING (is_admin());

-- ========== BRANDS, CATEGORIES, PRODUCT_TYPES, CHARACTERISTICS ==========
-- Lectura pública (o autenticados). Escritura solo admin
CREATE POLICY "brands_select" ON public.brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "brands_all_admin" ON public.brands FOR ALL USING (is_admin());

CREATE POLICY "categories_select" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_all_admin" ON public.categories FOR ALL USING (is_admin());

CREATE POLICY "category_specific_select" ON public.category_specific FOR SELECT TO authenticated USING (true);
CREATE POLICY "category_specific_all_admin" ON public.category_specific FOR ALL USING (is_admin());

CREATE POLICY "product_types_select" ON public.product_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_types_all_admin" ON public.product_types FOR ALL USING (is_admin());

CREATE POLICY "product_characteristics_general_select" ON public.product_characteristics_general FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_characteristics_general_all_admin" ON public.product_characteristics_general FOR ALL USING (is_admin());

CREATE POLICY "product_characteristics_specific_select" ON public.product_characteristics_specific FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_characteristics_specific_all_admin" ON public.product_characteristics_specific FOR ALL USING (is_admin());

-- ========== PRODUCTS, PRODUCT_IMAGES, PRODUCT_CHARACTERISTIC_VALUES ==========
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_all_admin" ON public.products FOR ALL USING (is_admin());

CREATE POLICY "product_images_select" ON public.product_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_images_all_admin" ON public.product_images FOR ALL USING (is_admin());

CREATE POLICY "product_characteristic_values_select" ON public.product_characteristic_values FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_characteristic_values_all_admin" ON public.product_characteristic_values FOR ALL USING (is_admin());

-- ========== SERVICES, SERVICE_IMAGES ==========
CREATE POLICY "services_select" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "services_all_admin" ON public.services FOR ALL USING (is_admin());

CREATE POLICY "service_images_select" ON public.service_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_images_all_admin" ON public.service_images FOR ALL USING (is_admin());

-- ========== CARTS, CART_ITEMS ==========
CREATE POLICY "carts_all_own" ON public.carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cart_items_all_own" ON public.cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid())
);

-- ========== ORDERS, ORDER_ITEMS ==========
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update_admin" ON public.orders FOR UPDATE USING (is_admin());
CREATE POLICY "order_items_select_own" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);
CREATE POLICY "order_items_select_admin" ON public.order_items FOR SELECT USING (is_admin());

-- ========== REVIEWS ==========
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete_own" ON public.reviews FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "reviews_all_admin" ON public.reviews FOR ALL USING (is_admin());

-- ========== BUSINESS_SUBSCRIPTIONS ==========
CREATE POLICY "business_subscriptions_select_own" ON public.business_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "business_subscriptions_all_admin" ON public.business_subscriptions FOR ALL USING (is_admin());

-- ========== TRIGGER: crear perfil al registrarse ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'CLIENT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
