import { z } from "zod";

export const subcategoryFormSchema = z.object({
  categoryId: z
    .string()
    .min(1, "Selecciona una categoría")
    .uuid("Selecciona una categoría válida"),
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "Máximo 200 caracteres")
    .transform((s) => s.trim()),
  active: z.boolean(),
});

export type SubcategoryFormValues = z.infer<typeof subcategoryFormSchema>;
