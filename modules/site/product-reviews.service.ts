import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type CreateProductReviewPayload = {
  productId: string;
  name: string;
  email?: string;
  rating: number;
  comment: string;
};

export async function createProductReview(
  payload: CreateProductReviewPayload,
  userId: string | null,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      product_id: payload.productId,
      user_id: userId ?? null,
      reviewer_name: payload.name.trim(),
      reviewer_email: payload.email?.trim() || null,
      rating: payload.rating,
      comment: payload.comment.trim(),
    })
    .select("id, product_id, user_id, rating, comment, created_at")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("No se pudo crear la reseña.");
  return data;
}
