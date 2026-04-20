import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type {
  FaqAdmin,
  FaqAdminInsert,
  FaqAdminUpdate,
} from "./faqs.types";

type FaqRow = {
  id: string;
  pregunta: string;
  respuesta: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(row: FaqRow): FaqAdmin {
  return {
    id: row.id,
    question: row.pregunta,
    answer: row.respuesta,
    active: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function repoListAllFaqsAdmin(): Promise<FaqAdmin[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("id, pregunta, respuesta, activo, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data as FaqRow[]).map(mapRow);
}

export async function repoCreateFaqAdmin(
  payload: FaqAdminInsert,
): Promise<FaqAdmin> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("faqs")
    .insert({
      pregunta: payload.question,
      respuesta: payload.answer,
      activo: payload.active,
    })
    .select("id, pregunta, respuesta, activo, created_at, updated_at")
    .single();

  if (error) throw error;
  return mapRow(data as FaqRow);
}

export async function repoUpdateFaqAdmin(
  id: string,
  payload: FaqAdminUpdate,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("faqs")
    .update({
      pregunta: payload.question,
      respuesta: payload.answer,
      activo: payload.active,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function repoDeleteFaqAdmin(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("faqs").delete().eq("id", id);

  if (error) throw error;
}
