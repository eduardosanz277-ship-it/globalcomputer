import { z } from "zod";
import {
  RICH_HTML_DESCRIPTION_MAX_ERROR,
  RICH_HTML_DESCRIPTION_MAX_LENGTH,
} from "@/modules/admin/shared/rich-html-description";

export const serviceFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "Máximo 200 caracteres")
    .transform((s) => s.trim()),
  description: z
    .string()
    .max(RICH_HTML_DESCRIPTION_MAX_LENGTH, RICH_HTML_DESCRIPTION_MAX_ERROR)
    .transform((s) => s.trim()),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
