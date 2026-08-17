-- Preferencia de idioma del cliente al crear el pedido (correos, textos).
-- Idempotente: se puede reejecutar sin error.

alter table public.store_orders
  add column if not exists locale text;

update public.store_orders
set locale = 'es'
where locale is null or btrim(locale) = '';

-- Valores fuera de es/en (por si hubo datos basura antes del check).
update public.store_orders
set locale = 'es'
where locale is not null
  and locale not in ('es', 'en');

alter table public.store_orders
  alter column locale set default 'es';

alter table public.store_orders
  alter column locale set not null;

do $$
begin
  alter table public.store_orders
    add constraint store_orders_locale_check
    check (locale in ('es', 'en'));
exception
  when duplicate_object then null;
end $$;

comment on column public.store_orders.locale is
  'UI locale (es|en) at order creation; used for customer emails.';
