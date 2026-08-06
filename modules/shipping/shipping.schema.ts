import { z } from "zod";

const money = z.coerce
  .number({ invalid_type_error: "Ingresa un monto válido" })
  .min(0, "Debe ser mayor o igual a 0");

/** Monto obligatorio: vacío → error requerido (no coerción a 0). */
function requiredMoneyField(options?: {
  min?: number;
  minMessage?: string;
  gt?: number;
  gtMessage?: string;
  requiredMessage?: string;
  invalidMessage?: string;
}) {
  const min = options?.min ?? 0;
  const minMessage = options?.minMessage ?? "Debe ser mayor o igual a 0";
  return z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    if (typeof val === "number" && Number.isNaN(val)) return undefined;
    const n = typeof val === "number" ? val : Number(val);
    return Number.isFinite(n) ? n : Number.NaN;
  }, z
    .number({
      required_error: options?.requiredMessage ?? "Este campo es obligatorio",
      invalid_type_error: options?.invalidMessage ?? "Ingresa un monto válido",
    })
    .superRefine((n, ctx) => {
      if (options?.gt != null && !(n > options.gt)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: options.gtMessage ?? `Debe ser mayor que ${options.gt}`,
        });
        return;
      }
      if (n < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: minMessage,
        });
      }
    }));
}

/** Entero obligatorio (> 0): vacío → error requerido. */
function requiredPositiveIntField(requiredMessage: string) {
  return z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    if (typeof val === "number" && Number.isNaN(val)) return undefined;
    const n = typeof val === "number" ? val : Number(val);
    return Number.isFinite(n) ? n : Number.NaN;
  }, z
    .number({
      required_error: requiredMessage,
      invalid_type_error: requiredMessage,
    })
    .int("Debe ser un número entero")
    .min(1, "Debe ser al menos 1"));
}

export const shippingSettingsFormSchema = z.object({
  autoCalcMaxSubtotal: requiredMoneyField({
    requiredMessage:
      "El monto máximo para cálculo automático es obligatorio",
  }),
  overLimitAction: z.enum(["whatsapp"]),
  whatsappPhone: z
    .string()
    .trim()
    .min(1, "El número de WhatsApp es obligatorio")
    .max(40, "Máximo 40 caracteres"),
  whatsappMessage: z
    .string()
    .trim()
    .min(1, "El mensaje es obligatorio")
    .max(2000, "Máximo 2000 caracteres"),
  whatsappMessageEn: z
    .string()
    .trim()
    .min(1, "El mensaje en inglés es obligatorio")
    .max(2000, "Máximo 2000 caracteres"),
  freeShippingEnabled: z.boolean(),
  freeShippingMinSubtotal: money,
  freeShippingSurchargeBehavior: z.enum([
    "keep_surcharges",
    "waive_surcharges",
  ]),
  pendingPaymentMaxWaitValue: requiredPositiveIntField(
    "El tiempo máximo de espera es obligatorio",
  ),
  pendingPaymentMaxWaitUnit: z.enum(["minutes", "hours", "days"]),
});

export type ShippingSettingsFormValues = z.infer<
  typeof shippingSettingsFormSchema
>;

export const SHIPPING_RATE_RANGE_ERROR =
  "El monto «Hasta» debe ser mayor que «Desde»";

export const shippingRateFormSchema = z
  .object({
    minAmount: requiredMoneyField(),
    maxAmount: requiredMoneyField(),
    cost: requiredMoneyField({
      gt: 0,
      gtMessage: "El costo debe ser mayor que 0",
    }),
    active: z.boolean(),
    sortOrder: z.coerce
      .number({ invalid_type_error: "Ingresa un orden válido" })
      .int("Debe ser entero")
      .min(0, "Debe ser mayor o igual a 0"),
  })
  .refine((v) => v.maxAmount > v.minAmount, {
    message: SHIPPING_RATE_RANGE_ERROR,
    path: ["maxAmount"],
  });

export type ShippingRateFormValues = z.infer<typeof shippingRateFormSchema>;
