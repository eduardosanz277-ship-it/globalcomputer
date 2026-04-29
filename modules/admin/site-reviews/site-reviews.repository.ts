import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { AdminSiteReview } from "./site-reviews.types";

type SiteReviewDb = {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  rating: number;
  comment: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(row: SiteReviewDb): AdminSiteReview {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    rating: row.rating,
    comment: row.comment,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function repoListSiteReviewsAdmin(): Promise<AdminSiteReview[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("site_reviews")
    .select(
      "id, user_id, name, email, rating, comment, active, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as SiteReviewDb[]).map(mapRow);
}

export async function repoUpdateSiteReviewActiveAdmin(
  id: string,
  active: boolean,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("site_reviews")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
}

export async function repoDeleteSiteReviewAdmin(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("site_reviews").delete().eq("id", id);
  if (error) throw error;
}
