import { z } from "zod";

export const serviceFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "Máximo 200 caracteres")
    .transform((s) => s.trim()),
  description: z
    .string()
    .max(2000, "Máximo 2000 caracteres")
    .transform((s) => s.trim()),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
