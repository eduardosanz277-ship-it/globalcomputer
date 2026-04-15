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

/**
 * Listado público de reseñas de producto (usa service role: RLS de `reviews` solo
 * permite SELECT a `authenticated`).
 */
export async function listProductReviewsForLeaveReviewPage(): Promise<
  ProductReviewListItem[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, products(name), profiles(full_name)",
    )
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
    reviewerLabel: relFullName(
      row.profiles as
        | { full_name?: string | null }
        | { full_name?: string | null }[]
        | null,
    ),
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
    .select("id, rating, comment, created_at, profiles(full_name)")
    .eq("product_id", productId)
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
    reviewerLabel: relFullName(
      row.profiles as
        | { full_name?: string | null }
        | { full_name?: string | null }[]
        | null,
    ),
    rating: Number(row.rating ?? 0),
    comment:
      row.comment == null || String(row.comment).trim() === ""
        ? null
        : String(row.comment),
    createdAt: String(row.created_at),
  }));
}

/** Reseñas de la tienda (tabla `site_reviews`), más recientes primero. */
export async function listSiteReviewsForLeaveReviewPage(): Promise<
  SiteReviewListItem[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("site_reviews")
    .select("id, name, email, rating, comment, created_at")
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
