-- Tablas del admin paginadas en servidor (usuarios, pedidos, productos).
-- Replican en SQL la búsqueda, filtros y orden que hacía el `DataTable` en el
-- navegador sobre la lista completa. Requiere `storefront_normalize_text`
-- (migración 20261021130000_storefront_catalog_rpc).

-- ========== Usuarios ==========
-- SECURITY DEFINER: necesita `auth.users` (email y último acceso), que antes se
-- obtenían recorriendo todos los usuarios de Auth con `listUsers`. Solo service role.
CREATE OR REPLACE FUNCTION public.admin_users_page(
  p_search text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_sort text DEFAULT NULL,
  p_desc boolean DEFAULT false,
  p_page integer DEFAULT 0,
  p_page_size integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      nullif(lower(btrim(coalesce(p_search, ''))), '') AS q,
      least(greatest(coalesce(p_page_size, 10), 1), 100) AS size
  ),
  base AS (
    SELECT
      p.id,
      p.full_name::text AS full_name,
      p.role::text AS role,
      p.created_at,
      p.business_registration_status::text AS business_registration_status,
      u.email::text AS email,
      u.last_sign_in_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    -- Clientes completos; empresas solo con registro aprobado (igual que antes).
    WHERE p.role::text = 'CLIENT'
       OR (p.role::text = 'BUSINESS' AND p.business_registration_status::text = 'approved')
  ),
  filtered AS (
    SELECT b.*
    FROM base b, params
    WHERE (p_role IS NULL OR b.role = p_role)
      AND (
        params.q IS NULL
        OR position(params.q IN lower(btrim(coalesce(b.full_name, '') || ' ' || coalesce(b.email, '')))) > 0
        OR position(params.q IN lower(b.role)) > 0
        OR position(params.q IN lower(coalesce(b.last_sign_in_at::text, ''))) > 0
      )
  ),
  ordered AS (
    SELECT
      f.*,
      count(*) OVER () AS total,
      row_number() OVER (
        ORDER BY
          CASE WHEN p_sort = 'user' AND NOT p_desc THEN
            public.storefront_normalize_text(coalesce(f.full_name, '') || ' ' || coalesce(f.email, ''))
          END ASC,
          CASE WHEN p_sort = 'user' AND p_desc THEN
            public.storefront_normalize_text(coalesce(f.full_name, '') || ' ' || coalesce(f.email, ''))
          END DESC,
          -- Sin último acceso: al final en ascendente y al principio en descendente (como la tabla).
          CASE WHEN p_sort = 'lastSignInAt' AND NOT p_desc THEN f.last_sign_in_at END ASC NULLS LAST,
          CASE WHEN p_sort = 'lastSignInAt' AND p_desc THEN f.last_sign_in_at END DESC NULLS FIRST,
          f.created_at DESC,
          f.id
      ) AS rn
    FROM filtered f
  ),
  bounded AS (
    SELECT
      coalesce((SELECT max(o.total) FROM ordered o), 0)::integer AS total,
      params.size
    FROM params
  ),
  page AS (
    SELECT
      bounded.total,
      bounded.size,
      least(
        greatest(coalesce(p_page, 0), 0),
        greatest(ceil(bounded.total::numeric / bounded.size)::integer - 1, 0)
      ) AS idx
    FROM bounded
  )
  SELECT jsonb_build_object(
    'rows', coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', o.id,
            'full_name', o.full_name,
            'role', o.role,
            'created_at', o.created_at,
            'business_registration_status', o.business_registration_status,
            'email', o.email,
            'last_sign_in_at', o.last_sign_in_at
          )
          ORDER BY o.rn
        )
        FROM ordered o
        WHERE o.rn > page.idx * page.size AND o.rn <= (page.idx + 1) * page.size
      ),
      '[]'::jsonb
    ),
    'row_count', page.total,
    'page', page.idx
  )
  FROM page;
$$;

-- ========== Pedidos ==========
-- SECURITY INVOKER: se llama con la sesión del admin y aplica la RLS de `store_orders`
-- (igual que la consulta anterior con el cliente de servidor).
CREATE OR REPLACE FUNCTION public.admin_store_orders_page(
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_shipping_method text DEFAULT NULL,
  p_conflict_only boolean DEFAULT false,
  p_sort text DEFAULT NULL,
  p_desc boolean DEFAULT false,
  p_page integer DEFAULT 0,
  p_page_size integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      nullif(lower(btrim(coalesce(p_search, ''))), '') AS q,
      least(greatest(coalesce(p_page_size, 10), 1), 100) AS size
  ),
  base AS (
    SELECT
      o.id,
      coalesce(nullif(btrim(o.order_number::text), ''), o.id::text) AS order_number,
      o.customer_name::text AS customer_name,
      o.customer_email::text AS customer_email,
      o.status::text AS status,
      o.inventory_status::text AS inventory_status,
      CASE WHEN o.shipping_method::text = 'manual' THEN 'manual' ELSE 'automatic' END AS shipping_method,
      o.total_amount,
      -- Total mostrado: manual → total_amount; automático → importe de Stripe.
      CASE
        WHEN o.shipping_method::text = 'manual' THEN coalesce(o.total_amount, 0)
        ELSE coalesce(o.stripe_amount_total, 0)
      END AS display_total,
      o.created_at
    FROM public.store_orders o
  ),
  filtered AS (
    SELECT b.*
    FROM base b, params
    WHERE (p_status IS NULL OR b.status = p_status)
      AND (p_shipping_method IS NULL OR b.shipping_method = p_shipping_method)
      AND (NOT coalesce(p_conflict_only, false) OR b.inventory_status = 'conflict')
      AND (
        params.q IS NULL
        OR position(params.q IN lower(b.order_number)) > 0
        OR position(params.q IN lower(btrim(coalesce(b.customer_name, '') || ' ' || coalesce(b.customer_email, '')))) > 0
        OR position(params.q IN lower(coalesce(b.total_amount::text, ''))) > 0
        OR position(params.q IN b.shipping_method) > 0
        OR position(params.q IN lower(b.status)) > 0
        OR position(params.q IN lower(b.created_at::text)) > 0
      )
  ),
  ordered AS (
    SELECT
      f.id,
      count(*) OVER () AS total,
      row_number() OVER (
        ORDER BY
          CASE WHEN p_sort = 'order_number' AND NOT p_desc THEN f.order_number END ASC,
          CASE WHEN p_sort = 'order_number' AND p_desc THEN f.order_number END DESC,
          CASE WHEN p_sort = 'created_at' AND NOT p_desc THEN f.created_at END ASC,
          CASE WHEN p_sort = 'created_at' AND p_desc THEN f.created_at END DESC,
          CASE WHEN p_sort = 'customer' AND NOT p_desc THEN
            public.storefront_normalize_text(coalesce(f.customer_name, '') || ' ' || coalesce(f.customer_email, ''))
          END ASC,
          CASE WHEN p_sort = 'customer' AND p_desc THEN
            public.storefront_normalize_text(coalesce(f.customer_name, '') || ' ' || coalesce(f.customer_email, ''))
          END DESC,
          CASE WHEN p_sort = 'total_amount' AND NOT p_desc THEN f.display_total END ASC,
          CASE WHEN p_sort = 'total_amount' AND p_desc THEN f.display_total END DESC,
          CASE WHEN p_sort = 'shipping_method' AND NOT p_desc THEN f.shipping_method END ASC,
          CASE WHEN p_sort = 'shipping_method' AND p_desc THEN f.shipping_method END DESC,
          CASE WHEN p_sort = 'status' AND NOT p_desc THEN
            array_position(ARRAY['pending','confirmed','processing','shipping','completed','cancelled'], f.status)
          END ASC,
          CASE WHEN p_sort = 'status' AND p_desc THEN
            array_position(ARRAY['pending','confirmed','processing','shipping','completed','cancelled'], f.status)
          END DESC,
          f.created_at DESC,
          f.id
      ) AS rn
    FROM filtered f
  ),
  bounded AS (
    SELECT
      coalesce((SELECT max(o.total) FROM ordered o), 0)::integer AS total,
      params.size
    FROM params
  ),
  page AS (
    SELECT
      bounded.total,
      bounded.size,
      least(
        greatest(coalesce(p_page, 0), 0),
        greatest(ceil(bounded.total::numeric / bounded.size)::integer - 1, 0)
      ) AS idx
    FROM bounded
  )
  SELECT jsonb_build_object(
    'ids', coalesce(
      (
        SELECT jsonb_agg(o.id ORDER BY o.rn)
        FROM ordered o
        WHERE o.rn > page.idx * page.size AND o.rn <= (page.idx + 1) * page.size
      ),
      '[]'::jsonb
    ),
    'row_count', page.total,
    'page', page.idx,
    -- Conflictos de inventario de todos los pedidos (aviso superior), sin filtros.
    'conflict_count', (SELECT count(*) FROM base WHERE base.inventory_status = 'conflict')
  )
  FROM page;
$$;

-- ========== Productos ==========
-- Solo service role (el listado usa el cliente admin, igual que antes).
CREATE OR REPLACE FUNCTION public.admin_products_page(
  p_search text DEFAULT NULL,
  p_brand_id uuid DEFAULT NULL,
  p_brand_type_id uuid DEFAULT NULL,
  p_active text DEFAULT NULL,
  p_stock text DEFAULT NULL,
  p_locale text DEFAULT 'es',
  p_sort text DEFAULT NULL,
  p_desc boolean DEFAULT false,
  p_page integer DEFAULT 0,
  p_page_size integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      nullif(lower(btrim(coalesce(p_search, ''))), '') AS q,
      least(greatest(coalesce(p_page_size, 10), 1), 100) AS size
  ),
  base AS (
    SELECT
      p.id,
      p.name::text AS name,
      p.name_en::text AS name_en,
      p.stock,
      p.active,
      p.price_client,
      p.brand_id,
      p.brand_type_id,
      b.name::text AS brand_name,
      b.name_en::text AS brand_name_en,
      -- Texto buscable: mismos campos que la columna «Producto» y «Marca» de la tabla.
      lower(concat_ws(' ',
        p.name, p.name_en, p.sku,
        b.name, b.name_en, bt.name, bt.name_en,
        c.name, c.name_en, sc.name, sc.name_en, scp.name, scp.name_en,
        p.description, p.description_en,
        p.price_client::text, p.stock::text, p.active::text
      )) AS haystack
    FROM public.products p
    LEFT JOIN public.brands b ON b.id = p.brand_id
    LEFT JOIN public.brand_types bt ON bt.id = p.brand_type_id
    LEFT JOIN public.categories c ON c.id = p.category_id
    LEFT JOIN public.subcategories sc ON sc.id = p.subcategory_id
    LEFT JOIN public.categories scp ON scp.id = sc.category_id
  ),
  filtered AS (
    SELECT b.*
    FROM base b, params
    WHERE (p_brand_id IS NULL OR b.brand_id = p_brand_id)
      AND (p_brand_type_id IS NULL OR b.brand_type_id = p_brand_type_id)
      AND (
        p_active IS NULL
        OR (p_active = 'active' AND b.active)
        OR (p_active = 'inactive' AND NOT b.active)
      )
      AND (
        p_stock IS NULL
        OR (p_stock = 'outOfStock' AND b.stock <= 0)
        OR (p_stock = 'lowStock' AND b.stock > 0 AND b.stock <= 10)
        OR (p_stock = 'inStock' AND b.stock > 10)
      )
      AND (params.q IS NULL OR position(params.q IN b.haystack) > 0)
  ),
  ordered AS (
    SELECT
      f.id,
      count(*) OVER () AS total,
      row_number() OVER (
        ORDER BY
          CASE WHEN p_sort = 'product' AND NOT p_desc THEN
            public.storefront_normalize_text(public.storefront_localized(p_locale, f.name, f.name_en))
          END ASC,
          CASE WHEN p_sort = 'product' AND p_desc THEN
            public.storefront_normalize_text(public.storefront_localized(p_locale, f.name, f.name_en))
          END DESC,
          CASE WHEN p_sort = 'brand' AND NOT p_desc THEN
            public.storefront_normalize_text(public.storefront_localized(p_locale, f.brand_name, f.brand_name_en))
          END ASC,
          CASE WHEN p_sort = 'brand' AND p_desc THEN
            public.storefront_normalize_text(public.storefront_localized(p_locale, f.brand_name, f.brand_name_en))
          END DESC,
          CASE WHEN p_sort = 'priceClient' AND NOT p_desc THEN f.price_client END ASC,
          CASE WHEN p_sort = 'priceClient' AND p_desc THEN f.price_client END DESC,
          CASE WHEN p_sort = 'stock' AND NOT p_desc THEN f.stock END ASC,
          CASE WHEN p_sort = 'stock' AND p_desc THEN f.stock END DESC,
          CASE WHEN p_sort = 'active' AND NOT p_desc THEN f.active::integer END ASC,
          CASE WHEN p_sort = 'active' AND p_desc THEN f.active::integer END DESC,
          f.name ASC,
          f.id
      ) AS rn
    FROM filtered f
  ),
  bounded AS (
    SELECT
      coalesce((SELECT max(o.total) FROM ordered o), 0)::integer AS total,
      params.size
    FROM params
  ),
  page AS (
    SELECT
      bounded.total,
      bounded.size,
      least(
        greatest(coalesce(p_page, 0), 0),
        greatest(ceil(bounded.total::numeric / bounded.size)::integer - 1, 0)
      ) AS idx
    FROM bounded
  )
  SELECT jsonb_build_object(
    'ids', coalesce(
      (
        SELECT jsonb_agg(o.id ORDER BY o.rn)
        FROM ordered o
        WHERE o.rn > page.idx * page.size AND o.rn <= (page.idx + 1) * page.size
      ),
      '[]'::jsonb
    ),
    'row_count', page.total,
    'page', page.idx
  )
  FROM page;
$$;

-- ========== Permisos ==========
REVOKE EXECUTE ON FUNCTION public.admin_users_page(text, text, text, boolean, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_users_page(text, text, text, boolean, integer, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.admin_store_orders_page(text, text, text, boolean, text, boolean, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_store_orders_page(text, text, text, boolean, text, boolean, integer, integer) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.admin_products_page(text, uuid, uuid, text, text, text, text, boolean, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_products_page(text, uuid, uuid, text, text, text, text, boolean, integer, integer) TO service_role;

-- La RPC de pedidos se ejecuta como `authenticated` y usa el helper de normalización.
GRANT EXECUTE ON FUNCTION public.storefront_normalize_text(text) TO authenticated;
