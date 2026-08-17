-- Evita correos de confirmación duplicados (webhook + /cart/success, o es+en).
-- Idempotente.

alter table public.store_orders
  add column if not exists confirmation_email_sent_at timestamptz;

comment on column public.store_orders.confirmation_email_sent_at is
  'When the order confirmation email was successfully sent; null = not sent yet.';
