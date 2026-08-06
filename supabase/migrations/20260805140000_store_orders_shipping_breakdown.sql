-- Desglose de oferta / envío y método de envío en pedidos de tienda
alter table public.store_orders
  add column if not exists amount_discount decimal(12,2) not null default 0,
  add column if not exists amount_shipping_base decimal(12,2) not null default 0,
  add column if not exists amount_shipping_surcharge decimal(12,2) not null default 0,
  add column if not exists shipping_method text not null default 'automatic'
    check (shipping_method in ('automatic', 'manual'));

comment on column public.store_orders.amount_discount is
  'Site offer discount applied to the subtotal.';
comment on column public.store_orders.amount_shipping_base is
  'Base shipping rate (0 if shipping_method = manual).';
comment on column public.store_orders.amount_shipping_surcharge is
  'Surcharge for non-standard shipping items.';
comment on column public.store_orders.shipping_method is
  'automatic = calculation based on rates; manual = personalized quote (WhatsApp).';
