import { z } from "zod";

type BrandFormMessages = {
  nameRequired: string;
  nameEnRequired: string;
  maxChars: string;
};

const DEFAULT_MESSAGES: BrandFormMessages = {
  nameRequired: "El nombre es obligatorio",
  nameEnRequired: "El nombre en inglés es obligatorio",
  maxChars: "Máximo 200 caracteres",
};

export function createBrandFormSchema(
  messages: BrandFormMessages = DEFAULT_MESSAGES,
) {
  return z.object({
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

export const brandFormSchema = createBrandFormSchema();

export type BrandFormValues = z.infer<typeof brandFormSchema>;
