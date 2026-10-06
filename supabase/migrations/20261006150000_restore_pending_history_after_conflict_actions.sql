-- Restaura Pendiente en el historial cuando 20261006140000 lo borró de más:
-- cotización manual, conflicto, reintento de inventario y reembolso.
-- No vuelve a insertar Pendiente en pagos Stripe que empezaron en Confirmado.

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
  CASE
    WHEN o.shipping_method = 'manual' THEN 'manual_quote'
    ELSE 'inventory_conflict'
  END,
  o.created_at - interval '1 millisecond'
FROM public.store_orders o
WHERE NOT EXISTS (
  SELECT 1
  FROM public.store_order_status_history h
  WHERE h.store_order_id = o.id
    AND h.status = 'pending'
)
AND (
  o.shipping_method = 'manual'
  OR o.inventory_status = 'conflict'
  OR EXISTS (
    SELECT 1
    FROM public.store_order_status_history h2
    WHERE h2.store_order_id = o.id
      AND (
        h2.note = 'inventory_conflict'
        OR h2.note = 'manual_quote'
        OR h2.note ILIKE '%reprocess%'
        OR h2.note ILIKE '%refund%'
      )
  )
);

UPDATE public.store_order_status_history h
SET previous_status = 'pending'
WHERE h.status IS DISTINCT FROM 'pending'
  AND h.previous_status IS NULL
  AND h.id IN (
    SELECT next_row.id
    FROM (
      SELECT DISTINCT ON (h2.store_order_id) h2.id
      FROM public.store_order_status_history h2
      INNER JOIN public.store_order_status_history pending
        ON pending.store_order_id = h2.store_order_id
       AND pending.status = 'pending'
      WHERE h2.status IS DISTINCT FROM 'pending'
        AND h2.created_at >= pending.created_at
      ORDER BY h2.store_order_id, h2.created_at ASC, h2.id ASC
    ) next_row
  );
