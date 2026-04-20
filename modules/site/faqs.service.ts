import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type SiteFaq = {
  id: string;
  question: string;
  answer: string;
};

type SiteFaqRow = {
  id: string;
  pregunta: string;
  respuesta: string;
};

export async function listActiveSiteFaqs(): Promise<SiteFaq[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("id, pregunta, respuesta")
    .eq("activo", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SiteFaqRow[]).map((row) => ({
    id: row.id,
    question: row.pregunta,
    answer: row.respuesta,
  }));
}
