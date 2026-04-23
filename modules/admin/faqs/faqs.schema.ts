import { z } from "zod";

type FaqFormMessages = {
  questionRequired: string;
  questionEnRequired: string;
  answerRequired: string;
  answerEnRequired: string;
  maxQuestionChars: string;
  maxQuestionEnChars: string;
  maxAnswerChars: string;
  maxAnswerEnChars: string;
};

const DEFAULT_MESSAGES: FaqFormMessages = {
  questionRequired: "La pregunta es obligatoria",
  questionEnRequired: "La pregunta en inglés es obligatoria",
  answerRequired: "La respuesta es obligatoria",
  answerEnRequired: "La respuesta en inglés es obligatoria",
  maxQuestionChars: "Máximo 300 caracteres",
  maxQuestionEnChars: "Máximo 300 caracteres",
  maxAnswerChars: "Máximo 4000 caracteres",
  maxAnswerEnChars: "Máximo 4000 caracteres",
};

export function createFaqFormSchema(
  messages: FaqFormMessages = DEFAULT_MESSAGES,
) {
  return z.object({
    question: z
      .string()
      .min(1, messages.questionRequired)
      .max(300, messages.maxQuestionChars)
      .transform((s) => s.trim()),
    questionEn: z
      .string()
      .min(1, messages.questionEnRequired)
      .max(300, messages.maxQuestionEnChars)
      .transform((s) => s.trim()),
    answer: z
      .string()
      .min(1, messages.answerRequired)
      .max(4000, messages.maxAnswerChars)
      .transform((s) => s.trim()),
    answerEn: z
      .string()
      .min(1, messages.answerEnRequired)
      .max(4000, messages.maxAnswerEnChars)
      .transform((s) => s.trim()),
    active: z.boolean(),
  });
}

export const faqFormSchema = createFaqFormSchema();

export type FaqFormValues = z.infer<typeof faqFormSchema>;
