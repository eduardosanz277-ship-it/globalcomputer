-- Permitir unidad "minutes" en tiempo máximo de espera de pagos pendientes
alter table public.shipping_settings
  drop constraint if exists shipping_settings_pending_wait_unit_chk;

alter table public.shipping_settings
  add constraint shipping_settings_pending_wait_unit_chk
  check (pending_payment_max_wait_unit in ('minutes', 'hours', 'days'));
