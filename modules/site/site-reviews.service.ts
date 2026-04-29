import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type SiteReviewRow = {
  id: string;
  name: string;
  email: string | null;
  rating: number;
  comment: string;
  created_at: string;
};

export type CreateSiteReviewPayload = {
  name: string;
  email?: string;
  rating: number;
  comment: string;
};

/**
 * Inserta una reseña en `public.site_reviews`.
 * `userId` puede ser null (invitado): el cliente Supabase usa rol `anon` y RLS
 * debe permitir INSERT sin sesión (ver migraciones `site_reviews`).
 */
export async function createSiteReview(
  payload: CreateSiteReviewPayload,
  userId: string | null,
): Promise<SiteReviewRow> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_reviews")
    .insert({
      name: payload.name.trim(),
      email: payload.email?.trim() || null,
      rating: payload.rating,
      comment: payload.comment.trim(),
      user_id: userId ?? null,
    })
    .select("id, name, email, rating, comment, created_at")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("No se pudo crear la reseña.");
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    rating: Number(data.rating),
    comment: data.comment,
    created_at: data.created_at,
  };
}

export async function listRecentSiteReviews(
  limit: number = 6,
): Promise<SiteReviewRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_reviews")
    .select("id, name, email, rating, comment, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (
    data?.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      email: row.email ? String(row.email) : null,
      rating: Number(row.rating ?? 0),
      comment: String(row.comment),
      created_at: String(row.created_at),
    })) ?? []
  );
}
