-- Módulo de envíos: configuración, tarifas por rango y campos en productos.
-- Preparado para futuras integraciones con transportistas (UPS, FedEx, USPS).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.shipping_over_limit_action as enum ('whatsapp');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.shipping_free_surcharge_behavior as enum (
    'keep_surcharges',
    'waive_surcharges'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.product_shipping_type as enum ('standard', 'non_standard');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Configuración general (singleton)
-- ---------------------------------------------------------------------------

create table if not exists public.shipping_settings (
  id uuid primary key default gen_random_uuid(),
  auto_calc_max_subtotal numeric(12, 2) not null default 10000
    check (auto_calc_max_subtotal >= 0),
  over_limit_action public.shipping_over_limit_action not null default 'whatsapp',
  whatsapp_phone text not null default '',
  whatsapp_message text not null default '',
  free_shipping_enabled boolean not null default false,
  free_shipping_min_subtotal numeric(12, 2) not null default 3000
    check (free_shipping_min_subtotal >= 0),
  free_shipping_surcharge_behavior public.shipping_free_surcharge_behavior
    not null default 'keep_surcharges',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Solo una fila de configuración.
  singleton boolean not null default true,
  constraint shipping_settings_singleton_chk check (singleton = true)
);

create unique index if not exists shipping_settings_singleton_uidx
  on public.shipping_settings (singleton);

comment on table public.shipping_settings is
  'Global shipping configuration (single record).';

-- ---------------------------------------------------------------------------
-- Tarifas por rango de subtotal
-- ---------------------------------------------------------------------------

create table if not exists public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  min_amount numeric(12, 2) not null check (min_amount >= 0),
  max_amount numeric(12, 2) not null,
  cost numeric(12, 2) not null check (cost >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_rates_range_chk check (max_amount > min_amount)
);

create index if not exists shipping_rates_active_range_idx
  on public.shipping_rates (active, min_amount, max_amount);

create index if not exists shipping_rates_sort_idx
  on public.shipping_rates (sort_order asc, min_amount asc);

comment on table public.shipping_rates is
  'Shipping rates based on purchase subtotal ranges (excluding weight/dimensions).';

-- ---------------------------------------------------------------------------
-- Productos: tipo de envío y recargo por unidad
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists shipping_type public.product_shipping_type
    not null default 'standard';

alter table public.products
  add column if not exists shipping_surcharge_per_unit numeric(12, 2)
    not null default 0;

do $$ begin
  alter table public.products
    add constraint products_shipping_surcharge_nonneg_chk
    check (shipping_surcharge_per_unit >= 0);
exception when duplicate_object then null;
end $$;

comment on column public.products.shipping_type is
  'standard = range fare only; non_standard = rate + surcharge per unit.';

comment on column public.products.shipping_surcharge_per_unit is
  'Shipping surcharge per unit when shipping_type = non_standard.';

-- ---------------------------------------------------------------------------
-- Seed: configuración + tarifas iniciales
-- ---------------------------------------------------------------------------

insert into public.shipping_settings (
  auto_calc_max_subtotal,
  over_limit_action,
  whatsapp_phone,
  whatsapp_message,
  free_shipping_enabled,
  free_shipping_min_subtotal,
  free_shipping_surcharge_behavior
)
select
  10000,
  'whatsapp',
  '',
  'Hola, me gustaría solicitar una cotización de envío para un pedido superior a $10,000.',
  false,
  3000,
  'keep_surcharges'
where not exists (select 1 from public.shipping_settings);

insert into public.shipping_rates (min_amount, max_amount, cost, active, sort_order)
select * from (values
  (0::numeric,       100::numeric,    14.99::numeric, true, 10),
  (100.01,           250,             17.99,          true, 20),
  (250.01,           500,             22.99,          true, 30),
  (500.01,           1000,            29.99,          true, 40),
  (1000.01,          1500,            34.99,          true, 50),
  (1500.01,          2000,            39.99,          true, 60),
  (2000.01,          3000,            54.99,          true, 70),
  (3000.01,          4000,            69.99,          true, 80),
  (4000.01,          5000,            84.99,          true, 90),
  (5000.01,          6000,            99.99,          true, 100),
  (6000.01,          7000,            119.99,         true, 110),
  (7000.01,          8000,            139.99,         true, 120),
  (8000.01,          9000,            159.99,         true, 130),
  (9000.01,          10000,           179.99,         true, 140)
) as v(min_amount, max_amount, cost, active, sort_order)
where not exists (select 1 from public.shipping_rates);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.shipping_settings enable row level security;
alter table public.shipping_rates enable row level security;

-- Lectura pública (storefront / checkout); escritura solo service_role.
drop policy if exists shipping_settings_select_public on public.shipping_settings;
create policy shipping_settings_select_public
  on public.shipping_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists shipping_rates_select_active_public on public.shipping_rates;
create policy shipping_rates_select_active_public
  on public.shipping_rates
  for select
  to anon, authenticated
  using (active = true);

grant select on public.shipping_settings to anon, authenticated;
grant select on public.shipping_rates to anon, authenticated;
grant all on public.shipping_settings to service_role;
grant all on public.shipping_rates to service_role;
