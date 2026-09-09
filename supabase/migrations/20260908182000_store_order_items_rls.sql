-- RLS para líneas de pedido (admin + dueño del pedido padre).
-- Las escrituras (checkout, webhook, cotización manual) usan service_role.

alter table public.store_order_items enable row level security;

drop policy if exists "store_order_items_select_admin" on public.store_order_items;
create policy "store_order_items_select_admin"
  on public.store_order_items
  for select
  using (
    auth.role() = 'authenticated' and auth.uid() in (
      select id from public.profiles where role = 'ADMIN'
    )
  );

drop policy if exists "store_order_items_select_owner" on public.store_order_items;
create policy "store_order_items_select_owner"
  on public.store_order_items
  for select
  using (
    exists (
      select 1 from public.store_orders o
      where o.id = store_order_id and o.user_id = auth.uid()
    )
  );
