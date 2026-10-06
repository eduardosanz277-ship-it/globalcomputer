-- El historial de un pago Stripe automático empieza en Confirmado.
-- Pendiente se conserva solo en cotización manual y en conflicto de inventario.

DELETE FROM public.store_order_status_history h
USING public.store_orders o
WHERE h.store_order_id = o.id
  AND h.status = 'pending'
  AND o.shipping_method IS DISTINCT FROM 'manual'
  AND NOT (o.inventory_status = 'conflict' AND o.status = 'pending');

UPDATE public.store_order_status_history h
SET previous_status = NULL
WHERE h.previous_status = 'pending'
  AND h.id IN (
    SELECT first_row.id
    FROM (
      SELECT DISTINCT ON (h2.store_order_id) h2.id
      FROM public.store_order_status_history h2
      INNER JOIN public.store_orders o2 ON o2.id = h2.store_order_id
      WHERE o2.shipping_method IS DISTINCT FROM 'manual'
        AND NOT (o2.inventory_status = 'conflict' AND o2.status = 'pending')
      ORDER BY h2.store_order_id, h2.created_at ASC, h2.id ASC
    ) first_row
  );
