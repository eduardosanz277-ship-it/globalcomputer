import { z } from "zod";
import {
  RICH_HTML_DESCRIPTION_MAX_ERROR,
  RICH_HTML_DESCRIPTION_MAX_LENGTH,
} from "@/modules/admin/shared/rich-html-description";

type ServiceFormMessages = {
  nameRequired: string;
  nameEnRequired: string;
  maxChars: string;
};

const DEFAULT_MESSAGES: ServiceFormMessages = {
  nameRequired: "El nombre es obligatorio",
  nameEnRequired: "El nombre en inglés es obligatorio",
  maxChars: "Máximo 200 caracteres",
};

export function createServiceFormSchema(
  messages: ServiceFormMessages = DEFAULT_MESSAGES,
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
    description: z
      .string()
      .max(RICH_HTML_DESCRIPTION_MAX_LENGTH, RICH_HTML_DESCRIPTION_MAX_ERROR)
      .transform((s) => s.trim()),
    descriptionEn: z
      .string()
      .max(RICH_HTML_DESCRIPTION_MAX_LENGTH, RICH_HTML_DESCRIPTION_MAX_ERROR)
      .transform((s) => s.trim()),
  });
}

export const serviceFormSchema = createServiceFormSchema();

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
