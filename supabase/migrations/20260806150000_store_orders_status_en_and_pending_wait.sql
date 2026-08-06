-- =============================================
-- 1) Estados de store_orders en inglés (+ pending, cancelled)
-- 2) Tiempo máximo de espera para pagos pendientes (shipping_settings)
-- =============================================

-- --- store_orders status ---
alter table public.store_orders
  drop constraint if exists store_orders_status_check;

update public.store_orders
set status = case status
  when 'confirmada' then 'confirmed'
  when 'procesando' then 'processing'
  when 'enviando' then 'shipping'
  when 'completada' then 'completed'
  else status
end
where status in ('confirmada', 'procesando', 'enviando', 'completada');

alter table public.store_orders
  alter column status set default 'confirmed';

alter table public.store_orders
  add constraint store_orders_status_check
  check (
    status in (
      'pending',
      'confirmed',
      'processing',
      'shipping',
      'completed',
      'cancelled'
    )
  );

comment on column public.store_orders.status is
  'pending | confirmed | processing | shipping | completed | cancelled';

-- --- shipping_settings: max wait for pending payments ---
alter table public.shipping_settings
  add column if not exists pending_payment_max_wait_value integer not null default 7,
  add column if not exists pending_payment_max_wait_unit text not null default 'days';

alter table public.shipping_settings
  drop constraint if exists shipping_settings_pending_wait_value_chk;

alter table public.shipping_settings
  add constraint shipping_settings_pending_wait_value_chk
  check (pending_payment_max_wait_value > 0);

alter table public.shipping_settings
  drop constraint if exists shipping_settings_pending_wait_unit_chk;

alter table public.shipping_settings
  add constraint shipping_settings_pending_wait_unit_chk
  check (pending_payment_max_wait_unit in ('minutes', 'hours', 'days'));

comment on column public.shipping_settings.pending_payment_max_wait_value is
  'Maximum waiting time for payments on pending (manual) orders.';
comment on column public.shipping_settings.pending_payment_max_wait_unit is
  'Unit: minutes | hours | days.';
