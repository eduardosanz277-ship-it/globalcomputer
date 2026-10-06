-- Pedidos en conflicto de inventario: el historial solo conserva Pendiente.
-- Idempotente: si ya hay una sola fila pending, el DELETE no borra nada extra.

DELETE FROM public.store_order_status_history h
WHERE EXISTS (
  SELECT 1
  FROM public.store_orders o
  WHERE o.id = h.store_order_id
    AND o.inventory_status = 'conflict'
    AND o.status = 'pending'
)
AND h.id NOT IN (
  SELECT kept.id
  FROM (
    SELECT DISTINCT ON (h2.store_order_id) h2.id
    FROM public.store_order_status_history h2
    INNER JOIN public.store_orders o2 ON o2.id = h2.store_order_id
    WHERE o2.inventory_status = 'conflict'
      AND o2.status = 'pending'
      AND h2.status = 'pending'
    ORDER BY
      h2.store_order_id,
      CASE WHEN h2.previous_status IS NULL THEN 0 ELSE 1 END,
      h2.created_at ASC
  ) kept
);

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
  o.created_at
FROM public.store_orders o
WHERE o.inventory_status = 'conflict'
  AND o.status = 'pending'
  AND NOT EXISTS (
    SELECT 1
    FROM public.store_order_status_history h
    WHERE h.store_order_id = o.id
      AND h.status = 'pending'
  );
