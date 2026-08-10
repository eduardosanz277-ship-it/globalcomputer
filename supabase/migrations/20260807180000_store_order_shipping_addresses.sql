-- Dirección de envío asociada a pedidos (p. ej. cotización manual WhatsApp).

create table if not exists public.store_order_shipping_addresses (
  id uuid primary key default gen_random_uuid(),
  store_order_id uuid not null unique
    references public.store_orders (id) on delete cascade,
  recipient_name text not null,
  recipient_phone text not null,
  recipient_email text,
  address_line text not null,
  address_line_2 text,
  city text not null,
  state text,
  postal_code text not null,
  country text not null default 'US',
  created_at timestamptz not null default now()
);

comment on table public.store_order_shipping_addresses is
  'Order shipping address (one per store_order).';
comment on column public.store_order_shipping_addresses.recipient_name is
  'Recipient''s name.';
comment on column public.store_order_shipping_addresses.recipient_phone is
  'Recipient''s contact phone number.';
comment on column public.store_order_shipping_addresses.recipient_email is
  'Recipient''s contact email (optional).';

create index if not exists idx_store_order_shipping_addresses_order_id
  on public.store_order_shipping_addresses (store_order_id);

grant select, insert, update, delete on public.store_order_shipping_addresses
  to authenticated, service_role;

alter table public.store_order_shipping_addresses enable row level security;

drop policy if exists "store_order_shipping_addresses_select_admin"
  on public.store_order_shipping_addresses;
create policy "store_order_shipping_addresses_select_admin"
  on public.store_order_shipping_addresses
  for select
  using (
    auth.role() = 'authenticated' and auth.uid() in (
      select id from public.profiles where role = 'ADMIN'
    )
  );

drop policy if exists "store_order_shipping_addresses_select_owner"
  on public.store_order_shipping_addresses;
create policy "store_order_shipping_addresses_select_owner"
  on public.store_order_shipping_addresses
  for select
  using (
    exists (
      select 1 from public.store_orders o
      where o.id = store_order_id and o.user_id = auth.uid()
    )
  );
