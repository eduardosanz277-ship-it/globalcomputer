import { z } from "zod";

export const brandFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "Máximo 200 caracteres")
    .transform((s) => s.trim()),
  active: z.boolean(),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;
