-- Claim atómico: un solo correo de confirmación por pedido, independientemente del locale.
-- Evita el doble envío webhook + /cart/success (y es+en).

alter table public.store_orders
  add column if not exists confirmation_email_sent_at timestamptz;

alter table public.store_orders
  add column if not exists confirmation_email_locale text;

create or replace function public.claim_store_order_confirmation_email(
  p_order_id uuid,
  p_locale text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated int;
begin
  if p_locale is null or p_locale not in ('es', 'en') then
    return false;
  end if;

  update public.store_orders
  set
    confirmation_email_sent_at = timezone('utc', now()),
    confirmation_email_locale = p_locale,
    locale = p_locale
  where id = p_order_id
    and confirmation_email_sent_at is null;

  get diagnostics updated = row_count;
  return updated = 1;
end;
$$;

revoke all on function public.claim_store_order_confirmation_email(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_store_order_confirmation_email(uuid, text) to service_role;

comment on function public.claim_store_order_confirmation_email(uuid, text) is
  'Returns true only for the first confirmation-email sender of an order.';
