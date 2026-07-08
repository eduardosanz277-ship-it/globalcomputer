import { z } from "zod";
import {
  RICH_HTML_DESCRIPTION_MAX_ERROR,
  RICH_HTML_DESCRIPTION_MAX_LENGTH,
} from "@/modules/admin/shared/rich-html-description";
import type { PricingStrategy } from "./product-pricing-calculator";

const percentSchema = z.coerce
  .number({ invalid_type_error: "Ingresa un número válido" })
  .min(0, "Debe ser mayor o igual a 0")
  .max(100, "No puede ser mayor a 100");

const moneySchema = z.coerce
  .number({ invalid_type_error: "Ingresa un precio válido" })
  .min(0, "El precio no puede ser negativo");

const pricingStrategySchema = z.enum([
  "cost",
  "client_price",
  "business_price",
  "manual",
] satisfies [PricingStrategy, PricingStrategy, PricingStrategy, PricingStrategy]);

/** Mismo tope que descripción: HTML enriquecido (`RICH_HTML_DESCRIPTION_MAX_LENGTH`). */
const richHtmlDescriptionField = z
  .string()
  .max(RICH_HTML_DESCRIPTION_MAX_LENGTH, RICH_HTML_DESCRIPTION_MAX_ERROR)
  .transform((s) => s.trim());

export const productCharacteristicValueInputSchema = z.object({
  specificId: z
    .string()
    .min(1, "Selecciona una característica específica")
    .uuid("Característica específica inválida"),
  value: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .transform((s) => (s ?? "").trim()),
});

export const productFormSchema = z.object({
  sku: z
    .string()
    .min(1, "El SKU es obligatorio")
    .max(80, "Máximo 80 caracteres")
    .transform((s) => s.trim()),
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "Máximo 200 caracteres")
    .transform((s) => s.trim()),
  nameEn: z
    .string()
    .min(1, "El nombre en inglés es obligatorio")
    .max(200, "Máximo 200 caracteres")
    .transform((s) => s.trim()),
  description: richHtmlDescriptionField,
  descriptionEn: richHtmlDescriptionField,
  specifications: richHtmlDescriptionField,
  specificationsEn: richHtmlDescriptionField,
  stock: z.coerce
    .number({ invalid_type_error: "Ingresa un stock válido" })
    .int("El stock debe ser entero")
    .min(0, "El stock no puede ser negativo"),
  pricingStrategy: pricingStrategySchema,
  cost: moneySchema,
  marginClientPct: percentSchema,
  marginBusinessPct: percentSchema,
  priceClient: moneySchema,
  priceBusiness: moneySchema,
  discountClientPct: percentSchema,
  discountBusinessPct: percentSchema,
  active: z.boolean(),
  featured: z.boolean(),
  manualPdfUrl: z
    .string()
    .max(2000, "URL demasiado larga")
    .transform((s) => s.trim())
    .refine((v) => v.length === 0 || /^https?:\/\//i.test(v), {
      message: "Ingresa una URL válida (http/https)",
    }),
  brandId: z
    .string()
    .min(1, "Selecciona una marca")
    .uuid("Selecciona una marca válida"),
  brandTypeId: z
    .string()
    .transform((s) => s.trim())
    .refine(
      (v) => v.length === 0 || z.string().uuid().safeParse(v).success,
      {
        message: "Selecciona un tipo válido",
      },
    ),
  placementCategoryId: z
    .string()
    .min(1, "Selecciona una categoría")
    .uuid("Selecciona una categoría válida"),
  placementSubcategoryId: z
    .string()
    .transform((s) => s.trim())
    .refine(
      (v) => v.length === 0 || z.string().uuid().safeParse(v).success,
      {
        message: "Selecciona una subcategoría válida",
      },
    ),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductCharacteristicValueInputValues = z.infer<
  typeof productCharacteristicValueInputSchema
>;