import { z } from "zod";

/** Email opcional: cadena vacía o solo espacios → sin email (invitados). */
const optionalEmail = z.preprocess((val) => {
  if (typeof val !== "string") return undefined;
  const t = val.trim();
  return t === "" ? undefined : t;
}, z.string().email("Introduce un correo válido").optional());

/**
 * Misma regla en cliente (formulario) y servidor (`/api/site-reviews`).
 * Mensajes alineados con formularios del panel admin (zod + español).
 */
export const siteReviewFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  email: optionalEmail,
  rating: z
    .number({
      required_error: "La valoración es obligatoria",
      invalid_type_error: "Selecciona una valoración",
    })
    .int()
    .min(1, "La valoración debe ser entre 1 y 5")
    .max(5, "La valoración debe ser entre 1 y 5"),
  comment: z
    .string()
    .trim()
    .min(1, "El comentario es obligatorio")
    .max(1200, "Máximo 1200 caracteres"),
});

export type SiteReviewFormValues = z.infer<typeof siteReviewFormSchema>;
