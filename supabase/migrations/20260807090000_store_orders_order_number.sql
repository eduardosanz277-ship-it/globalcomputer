-- Número de orden visible al cliente: ORD-YYYYMMDD-#### (consecutivo por día, TZ Eastern).

alter table public.store_orders
  add column if not exists order_number text;

comment on column public.store_orders.order_number is
  'Public order number (ORD-YYYYMMDD-####). Daily sequential number in America/New_York.';

create table if not exists public.store_order_number_counters (
  order_day date primary key,
  last_seq integer not null default 0
    check (last_seq >= 0)
);

comment on table public.store_order_number_counters is
  'Daily counter to generate store_orders.order_number.';

grant select, insert, update on public.store_order_number_counters to service_role;

create or replace function public.allocate_store_order_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date;
  v_seq integer;
begin
  if new.order_number is not null and btrim(new.order_number) <> '' then
    return new;
  end if;

  v_day := (timezone('America/New_York', coalesce(new.created_at, now())))::date;

  insert into public.store_order_number_counters (order_day, last_seq)
  values (v_day, 1)
  on conflict (order_day) do update
    set last_seq = store_order_number_counters.last_seq + 1
  returning last_seq into v_seq;

  new.order_number :=
    'ORD-'
    || to_char(v_day, 'YYYYMMDD')
    || '-'
    || lpad(v_seq::text, 4, '0');

  return new;
end;
$$;

drop trigger if exists trg_store_orders_allocate_order_number on public.store_orders;
create trigger trg_store_orders_allocate_order_number
  before insert on public.store_orders
  for each row
  execute function public.allocate_store_order_number();

-- Backfill pedidos existentes (orden cronológico por día).
do $$
declare
  r record;
  v_day date;
  v_seq integer;
begin
  for r in
    select id, created_at
    from public.store_orders
    where order_number is null or btrim(order_number) = ''
    order by created_at asc, id asc
  loop
    v_day := (timezone('America/New_York', r.created_at))::date;

    insert into public.store_order_number_counters (order_day, last_seq)
    values (v_day, 1)
    on conflict (order_day) do update
      set last_seq = store_order_number_counters.last_seq + 1
    returning last_seq into v_seq;

    update public.store_orders
    set order_number =
      'ORD-'
      || to_char(v_day, 'YYYYMMDD')
      || '-'
      || lpad(v_seq::text, 4, '0')
    where id = r.id;
  end loop;
end $$;

alter table public.store_orders
  alter column order_number set not null;

create unique index if not exists store_orders_order_number_unique
  on public.store_orders (order_number);
