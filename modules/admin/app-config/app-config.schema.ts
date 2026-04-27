import { z } from "zod";

type AppConfigFormMessages = {
  supportEmailRequired: string;
  supportEmailInvalid: string;
  supportPhoneRequired: string;
  supportAddressRequired: string;
  numberInvalid: string;
  lowStockThresholdMin: string;
  offerAmountMin: string;
  offerPercentageMin: string;
  offerPercentageMax: string;
};

const DEFAULT_MESSAGES: AppConfigFormMessages = {
  supportEmailRequired: "El email es obligatorio",
  supportEmailInvalid: "Introduce un email válido",
  supportPhoneRequired: "El teléfono es obligatorio",
  supportAddressRequired: "La dirección es obligatoria",
  numberInvalid: "Debe ser un valor numérico",
  lowStockThresholdMin: "Debe ser mayor o igual a 0",
  offerAmountMin: "Debe ser mayor o igual a 0",
  offerPercentageMin: "Debe ser mayor o igual a 0",
  offerPercentageMax: "No puede ser mayor a 100",
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
    lowStockThreshold: z
      .number({ invalid_type_error: messages.numberInvalid })
      .int()
      .min(0, messages.lowStockThresholdMin),
    offerAmount: z
      .number({ invalid_type_error: messages.numberInvalid })
      .min(0, messages.offerAmountMin),
    offerPercentage: z
      .number({ invalid_type_error: messages.numberInvalid })
      .min(0, messages.offerPercentageMin)
      .max(100, messages.offerPercentageMax),
  });
}

export const appConfigFormSchema = createAppConfigFormSchema();

export type AppConfigFormValues = z.infer<typeof appConfigFormSchema>;
