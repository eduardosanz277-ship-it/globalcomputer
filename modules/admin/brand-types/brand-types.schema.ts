import { z } from "zod";

export const brandTypeFormSchema = z.object({
  brandId: z
    .string()
    .min(1, "Selecciona una marca")
    .uuid("Selecciona una marca válida"),
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "Máximo 200 caracteres")
    .transform((s) => s.trim()),
  active: z.boolean(),
});

export type BrandTypeFormValues = z.infer<typeof brandTypeFormSchema>;
