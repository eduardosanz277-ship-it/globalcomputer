import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const LIST_LIMIT = 200;

export type ProductReviewListItem = {
  id: string;
  productName: string;
  reviewerLabel: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type ProductReviewDetailListItem = {
  id: string;
  reviewerLabel: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type SiteReviewListItem = {
  id: string;
  name: string;
  email: string | null;
  rating: number;
  comment: string;
  createdAt: string;
};

function relName<T extends { name?: string }>(
  rel: T | T[] | null | undefined,
): string {
  if (!rel) return "—";
  if (Array.isArray(rel)) return rel[0]?.name ?? "—";
  return rel.name ?? "—";
}

function relFullName(
  rel:
    | { full_name?: string | null }
    | { full_name?: string | null }[]
    | null
    | undefined,
): string {
  if (!rel) return "Cliente";
  const row = Array.isArray(rel) ? rel[0] : rel;
  const n = row?.full_name?.trim();
  return n || "Cliente";
}

function reviewerLabelFromRow(row: Record<string, unknown>): string {
  const explicitName =
    typeof row.reviewer_name === "string" ? row.reviewer_name.trim() : "";
  if (explicitName) return explicitName;
  return relFullName(
    row.profiles as
      | { full_name?: string | null }
      | { full_name?: string | null }[]
      | null,
  );
}

/**
 * Listado público de reseñas de producto (usa service role: RLS de `reviews` solo
 * permite SELECT a `authenticated`). Solo entradas con `active = true` (visibles en tienda).
 */
export async function listProductReviewsForLeaveReviewPage(): Promise<
  ProductReviewListItem[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, reviewer_name, products(name), profiles(full_name)",
    )
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.error("[leave-review] listProductReviews", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    productName: relName(
      row.products as { name?: string } | { name?: string }[] | null,
    ),
    reviewerLabel: reviewerLabelFromRow(row),
    rating: Number(row.rating ?? 0),
    comment:
      row.comment == null || String(row.comment).trim() === ""
        ? null
        : String(row.comment),
    createdAt: String(row.created_at),
  }));
}

/** Reseñas públicas de un producto concreto para la ficha (`/productos/[id]`). */
export async function listProductReviewsByProductId(
  productId: string,
): Promise<ProductReviewDetailListItem[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, reviewer_name, profiles(full_name)")
    .eq("product_id", productId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.error(
      "[product-detail] listProductReviewsByProductId",
      productId,
      error.message,
    );
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    reviewerLabel: reviewerLabelFromRow(row),
    rating: Number(row.rating ?? 0),
    comment:
      row.comment == null || String(row.comment).trim() === ""
        ? null
        : String(row.comment),
    createdAt: String(row.created_at),
  }));
}

/** Reseñas de la tienda (`site_reviews`), solo visibles (`active = true`), más recientes primero. */
export async function listSiteReviewsForLeaveReviewPage(): Promise<
  SiteReviewListItem[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("site_reviews")
    .select("id, name, email, rating, comment, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    console.error("[leave-review] listSiteReviews", error.message);
    return [];
  }

  return (
    data?.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      email: row.email ? String(row.email) : null,
      rating: Number(row.rating ?? 0),
      comment: String(row.comment ?? ""),
      createdAt: String(row.created_at),
    })) ?? []
  );
}

export type StoreRatingSummary = {
  /** Media en escala típica 1–5; `null` si no hay valoraciones válidas. */
  average: number | null;
  count: number;
};

/**
 * Promedio de valoraciones de la tienda: solo reseñas visibles (`active = true`)
 * en `reviews` y `site_reviews`.
 */
export async function getStoreRatingSummary(): Promise<StoreRatingSummary> {
  const supabase = createSupabaseAdminClient();
  const [reviewsRes, siteRes] = await Promise.all([
    supabase.from("reviews").select("rating").eq("active", true),
    supabase.from("site_reviews").select("rating").eq("active", true),
  ]);

  if (reviewsRes.error) {
    console.warn("[store-rating] reviews", reviewsRes.error.message);
  }
  if (siteRes.error) {
    console.warn("[store-rating] site_reviews", siteRes.error.message);
  }

  const ratings: number[] = [];
  for (const row of reviewsRes.data ?? []) {
    const n = Number((row as { rating: unknown }).rating);
    if (Number.isFinite(n) && n >= 1 && n <= 5) ratings.push(n);
  }
  for (const row of siteRes.data ?? []) {
    const n = Number((row as { rating: unknown }).rating);
    if (Number.isFinite(n) && n >= 1 && n <= 5) ratings.push(n);
  }

  if (ratings.length === 0) return { average: null, count: 0 };
  const sum = ratings.reduce((a, b) => a + b, 0);
  return { average: sum / ratings.length, count: ratings.length };
}
