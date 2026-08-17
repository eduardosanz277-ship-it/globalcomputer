-- Impide que sincronizaciones Stripe (webhook / reintentos) pongan `processing`
-- o reviertan un estado que el admin ya aplicó.

create or replace function public.store_orders_guard_stripe_status()
returns trigger
language plpgsql
as $$
declare
  stripe_sync boolean;
begin
  if tg_op = 'INSERT' then
    if new.stripe_session_id is not null
       and new.status = 'processing' then
      new.status := 'confirmed';
    end if;
    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  stripe_sync :=
    new.stripe_payment_status is distinct from old.stripe_payment_status
    or new.stripe_payment_intent is distinct from old.stripe_payment_intent
    or new.stripe_amount_total is distinct from old.stripe_amount_total
    or new.stripe_session_id is distinct from old.stripe_session_id;

  if not stripe_sync then
    return new;
  end if;

  -- Un sync de Stripe nunca deja el pedido en processing.
  if new.status = 'processing' then
    if old.status in ('processing', 'shipping', 'completed', 'cancelled') then
      new.status := old.status;
    else
      new.status := 'confirmed';
    end if;
  end if;

  -- Un reintento de Stripe no puede devolver a confirmed un estado del admin.
  if old.status in ('processing', 'shipping', 'completed', 'cancelled')
     and new.status = 'confirmed' then
    new.status := old.status;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_store_orders_guard_stripe_status on public.store_orders;
create trigger trg_store_orders_guard_stripe_status
  before insert or update on public.store_orders
  for each row
  execute function public.store_orders_guard_stripe_status();

comment on function public.store_orders_guard_stripe_status() is
  'Stripe may only confirm pending orders. processing/shipping/completed/cancelled stay admin-owned.';
