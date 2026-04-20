import { z } from "zod";

export const faqFormSchema = z.object({
  question: z
    .string()
    .min(1, "La pregunta es obligatoria")
    .max(300, "Máximo 300 caracteres")
    .transform((s) => s.trim()),
  answer: z
    .string()
    .min(1, "La respuesta es obligatoria")
    .max(4000, "Máximo 4000 caracteres")
    .transform((s) => s.trim()),
  active: z.boolean(),
});

export type FaqFormValues = z.infer<typeof faqFormSchema>;
