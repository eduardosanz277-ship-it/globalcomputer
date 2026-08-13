-- Historial de cambios de estado de pedidos (admin + sistema).

create table if not exists public.store_order_status_history (
  id uuid primary key default gen_random_uuid(),
  store_order_id uuid not null
    references public.store_orders (id) on delete cascade,
  status text not null,
  previous_status text,
  changed_by uuid
    references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  constraint store_order_status_history_status_check
    check (
      status in (
        'pending',
        'confirmed',
        'processing',
        'shipping',
        'completed',
        'cancelled'
      )
    ),
  constraint store_order_status_history_previous_status_check
    check (
      previous_status is null
      or previous_status in (
        'pending',
        'confirmed',
        'processing',
        'shipping',
        'completed',
        'cancelled'
      )
    )
);

comment on table public.store_order_status_history is
  'Timeline of store order status changes (admin or system).';
comment on column public.store_order_status_history.previous_status is
  'Status before this change; null for the initial entry.';
comment on column public.store_order_status_history.changed_by is
  'Admin profile who changed the status; null when the system/checkout updated it.';

create index if not exists idx_store_order_status_history_order_created
  on public.store_order_status_history (store_order_id, created_at asc);

grant select, insert, update, delete on public.store_order_status_history
  to authenticated, service_role;

alter table public.store_order_status_history enable row level security;

drop policy if exists "store_order_status_history_select_admin"
  on public.store_order_status_history;
create policy "store_order_status_history_select_admin"
  on public.store_order_status_history
  for select
  using (
    auth.role() = 'authenticated' and auth.uid() in (
      select id from public.profiles where role = 'ADMIN'
    )
  );

drop policy if exists "store_order_status_history_insert_admin"
  on public.store_order_status_history;
create policy "store_order_status_history_insert_admin"
  on public.store_order_status_history
  for insert
  with check (
    auth.role() = 'authenticated' and auth.uid() in (
      select id from public.profiles where role = 'ADMIN'
    )
  );

-- Semilla: un evento inicial por pedido existente (estado actual en created_at).
insert into public.store_order_status_history (
  store_order_id,
  status,
  previous_status,
  changed_by,
  note,
  created_at
)
select
  o.id,
  o.status,
  null,
  null,
  'initial',
  o.created_at
from public.store_orders o
where not exists (
  select 1
  from public.store_order_status_history h
  where h.store_order_id = o.id
);
