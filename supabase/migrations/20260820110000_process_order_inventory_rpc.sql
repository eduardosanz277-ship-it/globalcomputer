-- =============================================
-- Atomic inventory deduction RPC for confirmed Stripe orders.
--
-- Design guarantees:
--   • Atomicity: runs inside a single implicit PL/pgSQL transaction.
--   • Overselling prevention: SELECT ... FOR UPDATE locks product rows in
--     deterministic (product_id ASC) order before checking stock, preventing
--     concurrent transactions from reading stale values.
--   • All-or-nothing: if ANY product lacks sufficient stock, NO product is
--     deducted and the order is marked 'conflict'.
--   • Idempotency: checks for existing 'sale' movements first; if found,
--     returns 'already_processed' immediately. The UNIQUE constraint on
--     (store_order_id, product_id, type) provides a second idempotency layer
--     via unique_violation exception handling.
--   • Deadlock prevention: product rows are always locked in ASC product_id
--     order so concurrent transactions cannot form a lock cycle.
-- =============================================

CREATE OR REPLACE FUNCTION public.process_order_inventory(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item           RECORD;
  v_stock          int;
  v_conflict_items jsonb   := '[]'::jsonb;
  v_has_conflict   boolean := false;
  v_movement_count int;
BEGIN
  -- -------------------------------------------------------
  -- Step 0: Idempotency check.
  -- If 'sale' movements already exist for this order the work was already
  -- done (possibly by a concurrent or previously retried webhook delivery).
  -- Return immediately without touching any row.
  -- -------------------------------------------------------
  SELECT COUNT(*) INTO v_movement_count
  FROM public.inventory_movements
  WHERE store_order_id = p_order_id
    AND type = 'sale';

  IF v_movement_count > 0 THEN
    RETURN jsonb_build_object('status', 'already_processed', 'order_id', p_order_id);
  END IF;

  -- -------------------------------------------------------
  -- Step 1: Acquire row-level locks on all product rows in consistent
  -- (product_id ASC) order and verify that stock >= requested quantity
  -- for every item in the order.
  --
  -- Locks are held for the rest of the transaction.  Because every
  -- concurrent call sorts by the same column, deadlocks are impossible.
  -- -------------------------------------------------------
  FOR v_item IN
    SELECT soi.product_id, soi.quantity
    FROM public.store_order_items soi
    WHERE soi.store_order_id = p_order_id
    ORDER BY soi.product_id   -- deterministic lock ordering prevents deadlocks
  LOOP
    SELECT p.stock INTO v_stock
    FROM public.products p
    WHERE p.id = v_item.product_id
    FOR UPDATE;   -- acquire exclusive row lock; released on transaction commit/rollback

    IF NOT FOUND OR v_stock < v_item.quantity THEN
      v_has_conflict := true;
      v_conflict_items := v_conflict_items || jsonb_build_object(
        'product_id', v_item.product_id,
        'requested',  v_item.quantity,
        'available',  COALESCE(v_stock, 0)
      );
    END IF;
  END LOOP;

  -- -------------------------------------------------------
  -- Step 2: If any product has insufficient stock, mark conflict and stop.
  -- No stock is deducted; the order needs admin resolution.
  -- -------------------------------------------------------
  IF v_has_conflict THEN
    UPDATE public.store_orders
    SET inventory_status = 'conflict'
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
      'status',    'conflict',
      'order_id',  p_order_id,
      'conflicts', v_conflict_items
    );
  END IF;

  -- -------------------------------------------------------
  -- Step 3: All items have sufficient stock.
  -- Deduct stock and record movements atomically.
  -- Product rows are already locked from Step 1; UPDATEs use the same locks.
  -- -------------------------------------------------------
  FOR v_item IN
    SELECT soi.product_id, soi.quantity
    FROM public.store_order_items soi
    WHERE soi.store_order_id = p_order_id
    ORDER BY soi.product_id
  LOOP
    UPDATE public.products
    SET stock = stock - v_item.quantity
    WHERE id = v_item.product_id;

    -- quantity is stored as a negative integer for outgoing movements.
    INSERT INTO public.inventory_movements (product_id, store_order_id, quantity, type)
    VALUES (v_item.product_id, p_order_id, -v_item.quantity, 'sale');
  END LOOP;

  UPDATE public.store_orders
  SET inventory_status = 'processed'
  WHERE id = p_order_id;

  RETURN jsonb_build_object('status', 'success', 'order_id', p_order_id);

EXCEPTION
  WHEN unique_violation THEN
    -- A concurrent transaction already inserted the movement records
    -- (UNIQUE constraint on store_order_id+product_id+type fired).
    -- The exception handler rolls back all partial writes from this call,
    -- leaving the DB in a consistent state.
    RETURN jsonb_build_object('status', 'already_processed', 'order_id', p_order_id);
END;
$$;

COMMENT ON FUNCTION public.process_order_inventory(uuid) IS
  'Atomically checks stock, deducts inventory, and records movements for a confirmed Stripe order. Returns a JSONB result with status: success | already_processed | conflict. Idempotent: safe to call multiple times.';

-- Only the service role (server-side API via admin Supabase client) may call this function.
-- No public or authenticated user should be able to trigger inventory changes directly.
REVOKE ALL ON FUNCTION public.process_order_inventory(uuid)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_order_inventory(uuid) TO service_role;
