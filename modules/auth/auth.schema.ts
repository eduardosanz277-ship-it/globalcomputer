import { z } from "zod";

/** Login con contraseña (solo panel admin). */
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

/** Paso 1: solicitar código por email (/login clientes y empresas). */
export const emailOtpRequestSchema = z.object({
  email: z.string().email("Email inválido"),
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
  email: z.string().email("Email inválido"),
  code: emailOtpCodeSchema.shape.code,
});

export const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, "Nombre demasiado corto"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type EmailOtpRequestSchema = z.infer<typeof emailOtpRequestSchema>;
export type EmailOtpCodeSchema = z.infer<typeof emailOtpCodeSchema>;
export type EmailOtpVerifySchema = z.infer<typeof emailOtpVerifySchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
