import { z } from "zod";

type SpecificCharacteristicFormMessages = {
  generalRequired: string;
  generalInvalid: string;
  nameRequired: string;
  nameEnRequired: string;
  maxChars: string;
};

const DEFAULT_MESSAGES: SpecificCharacteristicFormMessages = {
  generalRequired: "Selecciona una característica general",
  generalInvalid: "Selecciona una característica general válida",
  nameRequired: "El nombre es obligatorio",
  nameEnRequired: "El nombre en inglés es obligatorio",
  maxChars: "Máximo 200 caracteres",
};

export function createSpecificCharacteristicFormSchema(
  messages: SpecificCharacteristicFormMessages = DEFAULT_MESSAGES,
) {
  return z.object({
    generalId: z
      .string()
      .min(1, messages.generalRequired)
      .uuid(messages.generalInvalid),
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

export const specificCharacteristicFormSchema =
  createSpecificCharacteristicFormSchema();

export type SpecificCharacteristicFormValues = z.infer<
  typeof specificCharacteristicFormSchema
>;
