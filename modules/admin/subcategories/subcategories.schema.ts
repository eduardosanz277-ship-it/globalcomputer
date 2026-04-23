import { z } from "zod";

type SubcategoryFormMessages = {
  categoryRequired: string;
  categoryInvalid: string;
  nameRequired: string;
  nameEnRequired: string;
  maxChars: string;
};

const DEFAULT_MESSAGES: SubcategoryFormMessages = {
  categoryRequired: "Selecciona una categoría",
  categoryInvalid: "Selecciona una categoría válida",
  nameRequired: "El nombre es obligatorio",
  nameEnRequired: "El nombre en inglés es obligatorio",
  maxChars: "Máximo 200 caracteres",
};

export function createSubcategoryFormSchema(
  messages: SubcategoryFormMessages = DEFAULT_MESSAGES,
) {
  return z.object({
    categoryId: z
      .string()
      .min(1, messages.categoryRequired)
      .uuid(messages.categoryInvalid),
    name: z
      .string()
      .min(1, messages.nameRequired)
      .max(200, messages.maxChars)
      .transform((s) => s.trim()),
    nameEn: z
      .string()
      .min(1, messages.nameEnRequired)
      .max(200, messages.maxChars)
      .transform((s) => s.trim()),
    active: z.boolean(),
  });
}

export const subcategoryFormSchema = createSubcategoryFormSchema();

export type SubcategoryFormValues = z.infer<typeof subcategoryFormSchema>;
