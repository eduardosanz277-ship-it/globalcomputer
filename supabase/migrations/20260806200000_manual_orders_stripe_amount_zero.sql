-- Pedidos manuales no pasan por Stripe: stripe_amount_total debe ser 0.
update public.store_orders
set stripe_amount_total = 0
where shipping_method = 'manual'
  and stripe_amount_total is distinct from 0;
