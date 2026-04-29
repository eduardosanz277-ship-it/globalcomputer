import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { AdminProductReview } from "./product-reviews.types";

type ProductRel = { name: string; name_en: string | null } | null;

type ReviewRow = {
  id: string;
  product_id: string;
  user_id: string | null;
  reviewer_name: string;
  reviewer_email: string | null;
  rating: number;
  comment: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  products: ProductRel | ProductRel[];
};

function productFromRow(p: ProductRel | ProductRel[]): ProductRel {
  if (Array.isArray(p)) return p[0] ?? null;
  return p ?? null;
}

function mapRow(row: ReviewRow): AdminProductReview {
  const p = productFromRow(row.products);
  return {
    id: row.id,
    productId: row.product_id,
    productName: p?.name ?? "—",
    productNameEn: p?.name_en ?? null,
    userId: row.user_id,
    reviewerName: row.reviewer_name,
    reviewerEmail: row.reviewer_email,
    rating: row.rating,
    comment: row.comment,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function repoListProductReviewsAdmin(): Promise<AdminProductReview[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      product_id,
      user_id,
      reviewer_name,
      reviewer_email,
      rating,
      comment,
      active,
      created_at,
      updated_at,
      products ( name, name_en )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as ReviewRow[]).map(mapRow);
}

export async function repoUpdateProductReviewActiveAdmin(
  id: string,
  active: boolean,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("reviews")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
}

export async function repoDeleteProductReviewAdmin(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}
