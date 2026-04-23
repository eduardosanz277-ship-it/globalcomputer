import { z } from "zod";

type GeneralCharacteristicFormMessages = {
  nameRequired: string;
  nameEnRequired: string;
  maxChars: string;
};

const DEFAULT_MESSAGES: GeneralCharacteristicFormMessages = {
  nameRequired: "El nombre es obligatorio",
  nameEnRequired: "El nombre en inglés es obligatorio",
  maxChars: "Máximo 200 caracteres",
};

export function createGeneralCharacteristicFormSchema(
  messages: GeneralCharacteristicFormMessages = DEFAULT_MESSAGES,
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

export const generalCharacteristicFormSchema = createGeneralCharacteristicFormSchema();

export type GeneralCharacteristicFormValues = z.infer<
  typeof generalCharacteristicFormSchema
>;
