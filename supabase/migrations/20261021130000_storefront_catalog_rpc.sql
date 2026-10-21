-- Catálogo de tienda paginado en servidor.
-- Replica en SQL la búsqueda, filtros, orden y facetas que antes hacía
-- `StorefrontProductCatalog` en el navegador sobre la lista completa de productos.
-- Solo se ejecutan con service role (cliente de catálogo del servidor).

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- ========== Helpers ==========

-- Equivalente a `normalizeSearchText` (NFD sin diacríticos, minúsculas, trim).
CREATE OR REPLACE FUNCTION public.storefront_normalize_text(p_value text)
RETURNS text
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = public, extensions
AS $$
  SELECT btrim(lower(extensions.unaccent(coalesce(p_value, ''))), E' \t\n\r');
$$;

-- Equivalente a `storefrontLocalizedText`: en → name_en recortado si existe; si no, es.
CREATE OR REPLACE FUNCTION public.storefront_localized(p_locale text, p_es text, p_en text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_locale = 'en' THEN coalesce(nullif(btrim(p_en), ''), p_es)
    ELSE p_es
  END;
$$;

-- Equivalente a `resolveStorefrontUnitPrice` (base ≥ 0, descuento 0–100, redondeo a 2 decimales).
CREATE OR REPLACE FUNCTION public.storefront_unit_price(p_base numeric, p_discount_pct numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN coalesce(p_discount_pct, 0) <= 0 THEN greatest(coalesce(p_base, 0), 0)
    ELSE round(greatest(coalesce(p_base, 0), 0) * (1 - least(p_discount_pct, 100) / 100), 2)
  END;
$$;

-- Productos activos de un ámbito de listado, con los campos derivados que usa la tienda
-- (mismos fallbacks que `mapStorefrontProductRow`).
--   all | featured | offers | brand | brand_type | category | subcategory | general | specific
CREATE OR REPLACE FUNCTION public.storefront_scope_rows(
  p_scope text,
  p_scope_id uuid DEFAULT NULL,
  p_scope_id2 uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  name_en text,
  sku text,
  slug text,
  stock integer,
  updated_at timestamptz,
  brand_id uuid,
  brand_name text,
  brand_name_en text,
  category_id uuid,
  category_name text,
  category_name_en text,
  unit_client numeric,
  unit_business numeric,
  discount_client boolean,
  discount_business boolean
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name::text,
    CASE WHEN btrim(p.name_en) <> '' THEN p.name_en::text END,
    coalesce(p.sku, '')::text,
    CASE WHEN btrim(p.slug) <> '' THEN p.slug::text END,
    p.stock::integer,
    p.updated_at,
    p.brand_id,
    CASE WHEN btrim(b.name) <> '' THEN b.name::text ELSE '—' END,
    CASE WHEN btrim(b.name_en) <> '' THEN b.name_en::text END,
    CASE WHEN p.category_id IS NOT NULL THEN p.category_id ELSE sc.category_id END,
    CASE
      WHEN p.category_id IS NOT NULL THEN CASE WHEN btrim(cd.name) <> '' THEN cd.name::text END
      ELSE CASE WHEN btrim(cs.name) <> '' THEN cs.name::text END
    END,
    CASE
      WHEN p.category_id IS NOT NULL THEN CASE WHEN btrim(cd.name_en) <> '' THEN cd.name_en::text END
      ELSE CASE WHEN btrim(cs.name_en) <> '' THEN cs.name_en::text END
    END,
    public.storefront_unit_price(p.price_client, p.discount_client_pct),
    public.storefront_unit_price(p.price_business, p.discount_business_pct),
    coalesce(p.discount_client_pct, 0) > 0
      AND public.storefront_unit_price(p.price_client, p.discount_client_pct)
        < greatest(coalesce(p.price_client, 0), 0),
    coalesce(p.discount_business_pct, 0) > 0
      AND public.storefront_unit_price(p.price_business, p.discount_business_pct)
        < greatest(coalesce(p.price_business, 0), 0)
  FROM public.products p
  LEFT JOIN public.brands b ON b.id = p.brand_id
  LEFT JOIN public.categories cd ON cd.id = p.category_id
  LEFT JOIN public.subcategories sc ON sc.id = p.subcategory_id
  LEFT JOIN public.categories cs ON cs.id = sc.category_id
  WHERE p.active = true
    AND CASE p_scope
      WHEN 'all' THEN true
      WHEN 'featured' THEN p.featured = true
      WHEN 'offers' THEN (p.discount_client_pct > 0 OR p.discount_business_pct > 0)
      WHEN 'brand' THEN p.brand_id = p_scope_id
      WHEN 'brand_type' THEN p.brand_id = p_scope_id AND p.brand_type_id = p_scope_id2
      WHEN 'category' THEN (
        p.category_id = p_scope_id
        OR p.subcategory_id IN (
          SELECT s.id FROM public.subcategories s
          WHERE s.category_id = p_scope_id AND s.deleted_at IS NULL
        )
      )
      WHEN 'subcategory' THEN p.subcategory_id = p_scope_id
      WHEN 'general' THEN EXISTS (
        SELECT 1
        FROM public.product_characteristic_values v
        JOIN public.product_characteristics_specific s ON s.id = v.characteristic_specific_id
        WHERE v.product_id = p.id
          AND s.general_id = p_scope_id
          AND coalesce(s.active, true)
      )
      WHEN 'specific' THEN EXISTS (
        SELECT 1
        FROM public.product_characteristic_values v
        WHERE v.product_id = p.id AND v.characteristic_specific_id = p_scope_id
      )
      ELSE false
    END;
$$;

-- Textos buscables de un producto, en el mismo orden que el "haystack" del catálogo
-- (nombre localizado, nombres, SKU, slug, marca, categoría y características).
-- Recibe los campos ya derivados por `storefront_scope_rows` para no releer el producto.
CREATE OR REPLACE FUNCTION public.storefront_product_search_terms(
  p_product_id uuid,
  p_locale text,
  p_name text,
  p_name_en text,
  p_sku text,
  p_slug text,
  p_brand_name text,
  p_brand_name_en text,
  p_category_name text,
  p_category_name_en text
)
RETURNS text[]
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH spec_terms AS (
    SELECT array_agg(t.term ORDER BY x.vid, t.ord) AS terms
    FROM (
      SELECT
        v.id AS vid,
        CASE WHEN btrim(s.name) <> '' THEN s.name::text ELSE '—' END AS s_name,
        CASE WHEN btrim(s.name_en) <> '' THEN s.name_en::text END AS s_name_en,
        CASE WHEN btrim(g.name) <> '' THEN g.name::text ELSE '—' END AS g_name,
        CASE WHEN btrim(g.name_en) <> '' THEN g.name_en::text END AS g_name_en,
        CASE WHEN btrim(v.value::text) <> '' THEN v.value::text END AS val
      FROM public.product_characteristic_values v
      JOIN public.product_characteristics_specific s ON s.id = v.characteristic_specific_id
      LEFT JOIN public.product_characteristics_general g ON g.id = s.general_id
      WHERE v.product_id = p_product_id AND s.general_id IS NOT NULL
    ) x
    CROSS JOIN LATERAL unnest(ARRAY[
      public.storefront_localized(p_locale, x.s_name, x.s_name_en),
      x.s_name,
      x.s_name_en,
      public.storefront_localized(p_locale, x.g_name, x.g_name_en),
      x.g_name,
      x.g_name_en,
      x.val
    ]) WITH ORDINALITY AS t(term, ord)
  ),
  all_terms AS (
    SELECT ARRAY[
        public.storefront_localized(p_locale, p_name, p_name_en),
        p_name,
        p_name_en,
        p_sku,
        p_slug,
        public.storefront_localized(p_locale, p_brand_name, p_brand_name_en),
        p_brand_name,
        p_brand_name_en,
        CASE WHEN p_category_name IS NOT NULL
          THEN public.storefront_localized(p_locale, p_category_name, p_category_name_en)
        END,
        p_category_name,
        p_category_name_en
      ] || coalesce((SELECT terms FROM spec_terms), '{}'::text[]) AS terms
  )
  SELECT coalesce(
    (
      SELECT array_agg(u.term ORDER BY u.ord)
      FROM all_terms, unnest(all_terms.terms) WITH ORDINALITY AS u(term, ord)
      WHERE u.term IS NOT NULL AND u.term <> ''
    ),
    '{}'::text[]
  );
$$;

-- ========== Página del catálogo (fase 3) ==========
-- Devuelve los ids de la página en orden, el total filtrado y la página efectiva
-- (acotada a la última, como hacía el cliente).
CREATE OR REPLACE FUNCTION public.storefront_catalog_page(
  p_scope text,
  p_scope_id uuid DEFAULT NULL,
  p_scope_id2 uuid DEFAULT NULL,
  p_tier text DEFAULT 'client',
  p_locale text DEFAULT 'es',
  p_query text DEFAULT NULL,
  p_brand_ids uuid[] DEFAULT NULL,
  p_category_ids uuid[] DEFAULT NULL,
  p_specific_ids uuid[] DEFAULT NULL,
  p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL,
  p_stock text[] DEFAULT NULL,
  p_discount_only boolean DEFAULT false,
  p_sort text DEFAULT 'relevance',
  p_page integer DEFAULT 0,
  p_page_size integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      nullif(public.storefront_normalize_text(p_query), '') AS q,
      least(greatest(coalesce(p_page_size, 20), 1), 100) AS size
  ),
  scoped AS (
    SELECT
      r.*,
      CASE WHEN p_tier = 'business' THEN r.unit_business ELSE r.unit_client END AS unit,
      CASE WHEN p_tier = 'business' THEN r.discount_business ELSE r.discount_client END AS discounted
    FROM public.storefront_scope_rows(p_scope, p_scope_id, p_scope_id2) r
  ),
  filtered AS (
    SELECT s.*
    FROM scoped s, params
    WHERE
      CASE
        WHEN params.q IS NULL THEN true
        ELSE position(
          params.q IN public.storefront_normalize_text(
            array_to_string(
              public.storefront_product_search_terms(
                s.id, p_locale, s.name, s.name_en, s.sku, s.slug,
                s.brand_name, s.brand_name_en, s.category_name, s.category_name_en
              ),
              ' '
            )
          )
        ) > 0
      END
      AND (coalesce(cardinality(p_brand_ids), 0) = 0 OR s.brand_id = ANY (p_brand_ids))
      AND (coalesce(cardinality(p_category_ids), 0) = 0 OR s.category_id = ANY (p_category_ids))
      AND (
        coalesce(cardinality(p_specific_ids), 0) = 0
        OR EXISTS (
          SELECT 1
          FROM public.product_characteristic_values v
          JOIN public.product_characteristics_specific sp ON sp.id = v.characteristic_specific_id
          WHERE v.product_id = s.id
            AND v.characteristic_specific_id = ANY (p_specific_ids)
            AND sp.general_id IS NOT NULL
        )
      )
      AND (p_price_min IS NULL OR s.unit >= p_price_min)
      AND (p_price_max IS NULL OR s.unit <= p_price_max)
      AND (NOT coalesce(p_discount_only, false) OR s.discounted)
      AND (
        coalesce(cardinality(p_stock), 0) = 0
        OR ('in_stock' = ANY (p_stock) AND s.stock > 0)
        OR ('low' = ANY (p_stock) AND s.stock > 0 AND s.stock <= 5)
        OR ('out' = ANY (p_stock) AND s.stock = 0)
      )
  ),
  ordered AS (
    SELECT
      f.id,
      count(*) OVER () AS total,
      row_number() OVER (
        ORDER BY
          CASE WHEN p_sort = 'price_asc' THEN f.unit END ASC,
          CASE WHEN p_sort = 'price_desc' THEN f.unit END DESC,
          CASE WHEN p_sort = 'name_asc'
            THEN public.storefront_normalize_text(public.storefront_localized(p_locale, f.name, f.name_en))
          END ASC,
          CASE WHEN p_sort = 'name_desc'
            THEN public.storefront_normalize_text(public.storefront_localized(p_locale, f.name, f.name_en))
          END DESC,
          CASE WHEN p_sort = 'date_desc' THEN f.updated_at END DESC NULLS LAST,
          CASE WHEN p_sort = 'date_asc' THEN f.updated_at END ASC NULLS FIRST,
          -- Orden base de cada listado (lo que antes devolvía la consulta).
          CASE WHEN p_scope = 'featured' THEN f.updated_at END DESC NULLS LAST,
          f.name ASC,
          f.id ASC
      ) AS rn
    FROM filtered f
  ),
  page AS (
    SELECT
      coalesce((SELECT max(o.total) FROM ordered o), 0)::integer AS total,
      params.size
    FROM params
  ),
  bounded AS (
    SELECT
      page.total,
      page.size,
      least(
        greatest(coalesce(p_page, 0), 0),
        greatest(ceil(page.total::numeric / page.size)::integer - 1, 0)
      ) AS idx
    FROM page
  )
  SELECT jsonb_build_object(
    'ids', coalesce(
      (
        SELECT jsonb_agg(o.id ORDER BY o.rn)
        FROM ordered o
        WHERE o.rn > bounded.idx * bounded.size
          AND o.rn <= (bounded.idx + 1) * bounded.size
      ),
      '[]'::jsonb
    ),
    'filtered_count', bounded.total,
    'page', bounded.idx
  )
  FROM bounded;
$$;

-- Opciones de filtro del listado (no dependen de los filtros activos, igual que antes).
CREATE OR REPLACE FUNCTION public.storefront_catalog_facets(
  p_scope text,
  p_scope_id uuid DEFAULT NULL,
  p_scope_id2 uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH r AS (
    SELECT * FROM public.storefront_scope_rows(p_scope, p_scope_id, p_scope_id2)
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM r),
    'brands', coalesce(
      (
        SELECT jsonb_agg(jsonb_build_object('id', b.brand_id, 'name', b.brand_name, 'name_en', b.brand_name_en))
        FROM (
          SELECT DISTINCT ON (r.brand_id) r.brand_id, r.brand_name, r.brand_name_en
          FROM r
          ORDER BY r.brand_id
        ) b
      ),
      '[]'::jsonb
    ),
    'categories', coalesce(
      (
        SELECT jsonb_agg(jsonb_build_object('id', c.category_id, 'name', c.category_name, 'name_en', c.category_name_en))
        FROM (
          SELECT DISTINCT ON (r.category_id) r.category_id, r.category_name, r.category_name_en
          FROM r
          WHERE r.category_id IS NOT NULL
          ORDER BY r.category_id
        ) c
      ),
      '[]'::jsonb
    ),
    'specifics', coalesce(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'id', x.id,
          'name', x.s_name,
          'name_en', x.s_name_en,
          'general_id', x.general_id,
          'general_name', x.g_name,
          'general_name_en', x.g_name_en
        ))
        FROM (
          SELECT DISTINCT ON (s.id)
            s.id,
            CASE WHEN btrim(s.name) <> '' THEN s.name::text ELSE '—' END AS s_name,
            CASE WHEN btrim(s.name_en) <> '' THEN s.name_en::text END AS s_name_en,
            s.general_id,
            CASE WHEN btrim(g.name) <> '' THEN g.name::text ELSE '—' END AS g_name,
            CASE WHEN btrim(g.name_en) <> '' THEN g.name_en::text END AS g_name_en
          FROM r
          JOIN public.product_characteristic_values v ON v.product_id = r.id
          JOIN public.product_characteristics_specific s ON s.id = v.characteristic_specific_id
          LEFT JOIN public.product_characteristics_general g ON g.id = s.general_id
          WHERE s.general_id IS NOT NULL
          ORDER BY s.id
        ) x
      ),
      '[]'::jsonb
    ),
    'price_client', jsonb_build_object('min', (SELECT min(r.unit_client) FROM r), 'max', (SELECT max(r.unit_client) FROM r)),
    'price_business', jsonb_build_object('min', (SELECT min(r.unit_business) FROM r), 'max', (SELECT max(r.unit_business) FROM r))
  );
$$;

-- ========== Autocompletado de búsqueda (fase 2) ==========
-- Misma puntuación que `scoreSuggestion`: igual 120, empieza por 90, contiene 60.
CREATE OR REPLACE FUNCTION public.storefront_search_suggest(
  p_query text,
  p_locale text DEFAULT 'es',
  p_limit integer DEFAULT 6
)
RETURNS uuid[]
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH q AS (
    SELECT nullif(public.storefront_normalize_text(p_query), '') AS q
  ),
  scored AS (
    SELECT
      r.id,
      r.name,
      r.name_en,
      (
        SELECT max(
          CASE
            WHEN n.v = q.q THEN 120
            WHEN starts_with(n.v, q.q) THEN 90
            WHEN position(q.q IN n.v) > 0 THEN 60
            ELSE 0
          END
        )
        FROM unnest(
          public.storefront_product_search_terms(
            r.id, p_locale, r.name, r.name_en, r.sku, r.slug,
            r.brand_name, r.brand_name_en, r.category_name, r.category_name_en
          )
        ) AS t(term)
        CROSS JOIN LATERAL (SELECT public.storefront_normalize_text(t.term) AS v) n
        WHERE n.v <> ''
      ) AS score
    FROM public.storefront_scope_rows('all') r, q
    WHERE q.q IS NOT NULL
  ),
  top AS (
    SELECT
      s.id,
      s.score,
      public.storefront_normalize_text(public.storefront_localized(p_locale, s.name, s.name_en)) AS sort_name,
      s.name
    FROM scored s
    WHERE s.score > 0
    ORDER BY s.score DESC, 3, s.name, s.id
    LIMIT least(greatest(coalesce(p_limit, 6), 1), 50)
  )
  SELECT coalesce(array_agg(top.id ORDER BY top.score DESC, top.sort_name, top.name, top.id), '{}'::uuid[])
  FROM top;
$$;

-- ========== Home: marcas con productos activos (fase 1) ==========
-- Una fila por marca con la imagen principal de su último producto por nombre
-- (el `Map` de la home se quedaba con la última aparición).
CREATE OR REPLACE FUNCTION public.storefront_brand_showcase()
RETURNS TABLE (brand_id uuid, image_url text)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT DISTINCT ON (p.brand_id)
    p.brand_id,
    (
      SELECT i.url::text
      FROM public.product_images i
      WHERE i.product_id = p.id
      ORDER BY i.is_primary DESC, coalesce(i.sort_order, 0), i.id
      LIMIT 1
    )
  FROM public.products p
  WHERE p.active = true AND p.brand_id IS NOT NULL
  ORDER BY p.brand_id, p.name DESC, p.id DESC;
$$;

-- ========== Permisos: solo service role ==========
REVOKE EXECUTE ON FUNCTION public.storefront_normalize_text(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.storefront_localized(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.storefront_unit_price(numeric, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.storefront_scope_rows(text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.storefront_product_search_terms(uuid, text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.storefront_catalog_page(text, uuid, uuid, text, text, text, uuid[], uuid[], uuid[], numeric, numeric, text[], boolean, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.storefront_catalog_facets(text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.storefront_search_suggest(text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.storefront_brand_showcase() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.storefront_normalize_text(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.storefront_localized(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.storefront_unit_price(numeric, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.storefront_scope_rows(text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.storefront_product_search_terms(uuid, text, text, text, text, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.storefront_catalog_page(text, uuid, uuid, text, text, text, uuid[], uuid[], uuid[], numeric, numeric, text[], boolean, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.storefront_catalog_facets(text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.storefront_search_suggest(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.storefront_brand_showcase() TO service_role;
