import { z } from "zod";

export const appConfigFormSchema = z.object({
  supportEmail: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Introduce un email válido"),
  supportPhone: z.string().min(1, "El teléfono es obligatorio"),
  supportAddress: z
    .string()
    .trim()
    .min(1, "La dirección es obligatoria"),
  lowStockNotificationsEnabled: z.boolean(),
  lowStockThreshold: z.number().int().min(0, "Mínimo 0"),
});

export type AppConfigFormValues = z.infer<typeof appConfigFormSchema>;
