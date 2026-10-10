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

export type EmailOtpFormMessages = {
  emailRequired: string;
  emailInvalid: string;
  codeRequired: string;
  codeFormat: string;
};

export function createEmailOtpRequestSchema(
  messages: Pick<EmailOtpFormMessages, "emailRequired" | "emailInvalid">,
) {
  return z.object({
    email: z
      .string()
      .min(1, messages.emailRequired)
      .email(messages.emailInvalid),
  });
}

/** Paso 2: verificar código recibido por email (el email va en estado aparte). */
export const emailOtpCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "El código es obligatorio")
    .regex(/^\d{6}$/, "El código debe tener exactamente 6 dígitos"),
});

export function createEmailOtpCodeSchema(
  messages: Pick<EmailOtpFormMessages, "codeRequired" | "codeFormat">,
) {
  return z.object({
    code: z
      .string()
      .trim()
      .min(1, messages.codeRequired)
      .regex(/^\d{6}$/, messages.codeFormat),
  });
}

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

const US_PHONE_TOO_LONG = "Teléfono demasiado largo";
const US_PHONE_INVALID_ES =
  "El teléfono de Estados Unidos debe tener 10 dígitos";

export const US_PHONE_DIGIT_COUNT = 10;

export function countPhoneDigits(value: string): number {
  return value.replace(/\D+/g, "").length;
}

/** Conserva el formato escrito y descarta dígitos por encima del máximo. */
export function limitUsPhoneDigits(
  value: string,
  maxDigits = US_PHONE_DIGIT_COUNT,
): string {
  let seen = 0;
  let out = "";
  for (const ch of value) {
    if (ch >= "0" && ch <= "9") {
      if (seen >= maxDigits) continue;
      seen += 1;
    }
    out += ch;
  }
  return out;
}

/** NANP: exactamente 10 dígitos. Ignora espacios y símbolos. */
export function isValidUsPhoneNumber(value: string): boolean {
  return countPhoneDigits(value) === US_PHONE_DIGIT_COUNT;
}

function registerBusinessPhoneSchema(invalidMessage: string) {
  return z
    .string()
    .max(40, US_PHONE_TOO_LONG)
    .refine((s) => {
      const trimmed = s.trim();
      return trimmed.length === 0 || isValidUsPhoneNumber(trimmed);
    }, invalidMessage)
    .transform((s) => {
      const trimmed = s.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    });
}

/** Registro como empresa: sin contraseña (usuario creado vía Admin API; login por OTP cuando esté aprobado). */
export const registerBusinessSchema = z.object({
  businessName: z.string().trim().min(2, "El nombre del negocio es obligatorio"),
  phone: registerBusinessPhoneSchema(US_PHONE_INVALID_ES),
  email: emailRequired,
  employerIdentificationNumber: z
    .string()
    .trim()
    .min(1, "El EIN es obligatorio")
    .max(32, "Valor demasiado largo"),
});

export function createRegisterBusinessSchema(messages: {
  phoneInvalid: string;
}) {
  return z.object({
    businessName: registerBusinessSchema.shape.businessName,
    phone: registerBusinessPhoneSchema(messages.phoneInvalid),
    email: registerBusinessSchema.shape.email,
    employerIdentificationNumber:
      registerBusinessSchema.shape.employerIdentificationNumber,
  });
}

export type LoginSchema = z.infer<typeof loginSchema>;
export type EmailOtpRequestSchema = z.infer<typeof emailOtpRequestSchema>;
export type EmailOtpCodeSchema = z.infer<typeof emailOtpCodeSchema>;
export type EmailOtpVerifySchema = z.infer<typeof emailOtpVerifySchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type RegisterBusinessSchema = z.infer<typeof registerBusinessSchema>;
/** Valores del formulario antes de la transformación de Zod (p. ej. `phone` como string). */
export type RegisterBusinessFormInput = z.input<typeof registerBusinessSchema>;
