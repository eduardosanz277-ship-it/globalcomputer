import { z } from "zod";

/** Correo obligatorio + formato válido (mensajes en español). */
const emailRequired = z
  .string()
  .min(1, "El correo electrónico es obligatorio")
  .email("Introduce un correo válido");

/** Contraseña obligatoria + longitud mínima (admin `/admin/login` y registro con contraseña). */
const passwordRequired = z
  .string()
  .min(1, "La contraseña es obligatoria")
  .min(6, "Mínimo 6 caracteres");

/** Login con contraseña (solo panel admin). */
export const loginSchema = z.object({
  email: emailRequired,
  password: passwordRequired,
});

/** Paso 1: solicitar código por email (/login clientes y empresas). */
export const emailOtpRequestSchema = z.object({
  email: emailRequired,
});

/** Paso 2: verificar código recibido por email (el email va en estado aparte). */
export const emailOtpCodeSchema = z.object({
  code: z
    .string()
    .min(6, "El código tiene al menos 6 dígitos")
    .max(10, "Código inválido")
    .regex(/^\d+$/, "Solo números"),
});

/** Verificación interna (email + código). */
export const emailOtpVerifySchema = z.object({
  email: emailRequired,
  code: emailOtpCodeSchema.shape.code,
});

export const registerSchema = loginSchema.extend({
  fullName: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .min(2, "Nombre demasiado corto"),
});

/** Registro como empresa: sin contraseña (usuario creado vía Admin API; login por OTP cuando esté aprobado). */
export const registerBusinessSchema = z.object({
  businessName: z.string().trim().min(2, "El nombre del negocio es obligatorio"),
  phone: z
    .string()
    .max(40, "Teléfono demasiado largo")
    .transform((s) => {
      const t = s.trim();
      return t.length > 0 ? t : undefined;
    }),
  email: emailRequired,
  employerIdentificationNumber: z
    .string()
    .trim()
    .min(1, "El EIN es obligatorio")
    .max(32, "Valor demasiado largo"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type EmailOtpRequestSchema = z.infer<typeof emailOtpRequestSchema>;
export type EmailOtpCodeSchema = z.infer<typeof emailOtpCodeSchema>;
export type EmailOtpVerifySchema = z.infer<typeof emailOtpVerifySchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type RegisterBusinessSchema = z.infer<typeof registerBusinessSchema>;
/** Valores del formulario antes de la transformación de Zod (p. ej. `phone` como string). */
export type RegisterBusinessFormInput = z.input<typeof registerBusinessSchema>;
