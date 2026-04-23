import { z } from "zod";

type BrandTypeFormMessages = {
  brandRequired: string;
  brandInvalid: string;
  nameRequired: string;
  nameEnRequired: string;
  maxChars: string;
};

const DEFAULT_MESSAGES: BrandTypeFormMessages = {
  brandRequired: "Selecciona una marca",
  brandInvalid: "Selecciona una marca válida",
  nameRequired: "El nombre es obligatorio",
  nameEnRequired: "El nombre en inglés es obligatorio",
  maxChars: "Máximo 200 caracteres",
};

export function createBrandTypeFormSchema(
  messages: BrandTypeFormMessages = DEFAULT_MESSAGES,
) {
  return z.object({
    brandId: z
      .string()
      .min(1, messages.brandRequired)
      .uuid(messages.brandInvalid),
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

export const brandTypeFormSchema = createBrandTypeFormSchema();

export type BrandTypeFormValues = z.infer<typeof brandTypeFormSchema>;
