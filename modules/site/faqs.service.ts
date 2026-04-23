import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type SiteFaq = {
  id: string;
  question: string;
  answer: string;
  questionEn: string;
  answerEn: string;
};

type SiteFaqRow = {
  id: string;
  question: string;
  answer: string;
  question_en: string;
  answer_en: string;
};

export async function listActiveSiteFaqs(): Promise<SiteFaq[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("id, question, answer, question_en, answer_en")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SiteFaqRow[]).map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    questionEn: row.question_en,
    answerEn: row.answer_en,
  }));
}
