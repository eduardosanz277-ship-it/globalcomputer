-- El dueño del pedido puede ver el historial de estados de sus pedidos.

drop policy if exists "store_order_status_history_select_owner"
  on public.store_order_status_history;
create policy "store_order_status_history_select_owner"
  on public.store_order_status_history
  for select
  using (
    exists (
      select 1 from public.store_orders o
      where o.id = store_order_id and o.user_id = auth.uid()
    )
  );
