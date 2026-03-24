import { z } from "zod";

export const generalCharacteristicFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "Máximo 200 caracteres")
    .transform((s) => s.trim()),
  active: z.boolean(),
});

export type GeneralCharacteristicFormValues = z.infer<
  typeof generalCharacteristicFormSchema
>;
