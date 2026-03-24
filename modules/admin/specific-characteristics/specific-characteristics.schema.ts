import { z } from "zod";

export const specificCharacteristicFormSchema = z.object({
  generalId: z
    .string()
    .min(1, "Selecciona una característica general")
    .uuid("Selecciona una característica general válida"),
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "Máximo 200 caracteres")
    .transform((s) => s.trim()),
  active: z.boolean(),
});

export type SpecificCharacteristicFormValues = z.infer<
  typeof specificCharacteristicFormSchema
>;
