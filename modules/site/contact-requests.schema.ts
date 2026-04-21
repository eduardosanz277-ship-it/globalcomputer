import { z } from "zod";

export const contactRequestFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio")
    .email("Introduce un correo válido")
    .max(160, "Máximo 160 caracteres"),
  phone: z
    .string()
    .trim()
    .min(1, "El teléfono es obligatorio")
    .min(7, "Introduce un teléfono válido")
    .max(40, "Máximo 40 caracteres"),
  subject: z
    .string()
    .trim()
    .min(1, "El asunto es obligatorio")
    .min(3, "El asunto debe tener al menos 3 caracteres")
    .max(150, "Máximo 150 caracteres"),
  message: z
    .string()
    .trim()
    .min(1, "El mensaje es obligatorio")
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(2000, "Máximo 2000 caracteres"),
});

export type ContactRequestFormValues = z.infer<typeof contactRequestFormSchema>;
