-- Pedidos que nunca tuvieron 'pending' en el historial (p. ej. Stripe que
-- arrancó en confirmed). Idempotente: NOT EXISTS por pedido.
-- No se añade un segundo pending por conflicto: ese pedido debe quedar
-- solo con Pendiente.

INSERT INTO public.store_order_status_history (
  store_order_id,
  status,
  previous_status,
  changed_by,
  note,
  created_at
)
SELECT
  o.id,
  'pending',
  NULL,
  NULL,
  'initial',
  o.created_at - interval '1 millisecond'
FROM public.store_orders o
WHERE NOT EXISTS (
  SELECT 1
  FROM public.store_order_status_history h
  WHERE h.store_order_id = o.id
    AND h.status = 'pending'
);
