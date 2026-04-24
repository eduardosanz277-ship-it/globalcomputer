import { z } from "zod";

type AppConfigFormMessages = {
  supportEmailRequired: string;
  supportEmailInvalid: string;
  supportPhoneRequired: string;
  supportAddressRequired: string;
  lowStockThresholdMin: string;
};

const DEFAULT_MESSAGES: AppConfigFormMessages = {
  supportEmailRequired: "El email es obligatorio",
  supportEmailInvalid: "Introduce un email válido",
  supportPhoneRequired: "El teléfono es obligatorio",
  supportAddressRequired: "La dirección es obligatoria",
  lowStockThresholdMin: "Mínimo 0",
};

export function createAppConfigFormSchema(
  messages: AppConfigFormMessages = DEFAULT_MESSAGES,
) {
  return z.object({
    supportEmail: z
      .string()
      .min(1, messages.supportEmailRequired)
      .email(messages.supportEmailInvalid),
    supportPhone: z.string().min(1, messages.supportPhoneRequired),
    supportAddress: z
      .string()
      .trim()
      .min(1, messages.supportAddressRequired),
    lowStockNotificationsEnabled: z.boolean(),
    lowStockThreshold: z.number().int().min(0, messages.lowStockThresholdMin),
  });
}

export const appConfigFormSchema = createAppConfigFormSchema();

export type AppConfigFormValues = z.infer<typeof appConfigFormSchema>;
