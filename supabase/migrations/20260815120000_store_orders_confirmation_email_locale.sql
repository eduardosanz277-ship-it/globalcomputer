-- Idioma con el que se envió la confirmación (para no reenviar el mismo y sí corregir es→en).
alter table public.store_orders
  add column if not exists confirmation_email_locale text;

comment on column public.store_orders.confirmation_email_locale is
  'Locale (es|en) used in the last order confirmation email.';
