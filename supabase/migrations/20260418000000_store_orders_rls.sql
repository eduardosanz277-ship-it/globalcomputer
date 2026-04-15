-- =============================================
-- Habilita RLS y políticas para pedidos (admin + owner)
-- =============================================

ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_orders_select_admin" ON public.store_orders
  FOR SELECT USING (
    auth.role() = 'authenticated' AND auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'ADMIN'
    )
  );

CREATE POLICY "store_orders_select_owner" ON public.store_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "store_orders_insert_admin" ON public.store_orders
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'ADMIN'
    )
  );

CREATE POLICY "store_orders_update_admin" ON public.store_orders
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'ADMIN'
    )
  );

CREATE POLICY "store_orders_delete_admin" ON public.store_orders
  FOR DELETE USING (
    auth.role() = 'authenticated' AND auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'ADMIN'
    )
  );
