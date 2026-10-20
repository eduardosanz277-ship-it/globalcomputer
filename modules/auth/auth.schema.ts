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

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

/** Solo dígitos y formato visual (+, -, espacios, paréntesis); limpia el resto. */
function cleanPhone(value: string): string {
  return value
    .replace(CONTROL_CHARS, "")
    .replace(/[^\d()+\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value: string): string {
  return value.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
}

function registerBusinessPhoneSchema(invalidMessage: string) {
  return z
    .string()
    .max(40, US_PHONE_TOO_LONG)
    .refine(
      (raw) => /^[\d()+\s-]*$/.test(raw.replace(CONTROL_CHARS, "")),
      invalidMessage,
    )
    .transform(cleanPhone)
    .refine((s) => s.length > 0, invalidMessage)
    .refine((s) => isValidUsPhoneNumber(s), invalidMessage);
}

// Letras (incluyendo acentos y ñ), espacios, guiones y apóstrofes.
function isValidBusinessName(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ' -]+$/.test(trimmed);
}

function registerBusinessNameSchema() {
  return z
    .string()
    .max(100, "Máximo 100 caracteres")
    .transform(cleanText)
    .refine(
      (s) => s.length > 0 && s.length >= 2,
      "El nombre del negocio es obligatorio",
    )
    .refine(
      (s) => isValidBusinessName(s),
      "El nombre solo puede incluir letras, espacios, guiones y apóstrofes (sin números ni símbolos especiales).",
    );
}

function registerBusinessEmailSchema() {
  return z
    .string()
    .max(160, "Máximo 160 caracteres")
    .transform((s) => cleanText(s).toLowerCase())
    .refine((s) => s.length > 0, "El correo electrónico es obligatorio")
    .refine(
      (s) =>
        EMAIL_PATTERN.test(s) &&
        !s.includes("..") &&
        z.string().email().safeParse(s).success,
      "Introduce un correo válido",
    );
}

const IRS_EIN_PREFIXES: readonly string[] = [
  "01", "03", "04", "05", "06", "10", "11", "12", "13", "14", "15",
  "16", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29",
  "30", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41",
  "42", "43", "44", "45", "46", "47", "48", "50", "51", "52", "53",
  "54", "55", "56", "57", "58", "59", "60", "61", "62", "63", "64",
  "65", "66", "67", "68", "71", "72", "73", "74", "75", "76", "77",
  "80", "81", "83", "84", "85", "86", "87", "88", "90", "91", "92",
  "93", "94", "95", "98", "99",
];

function cleanEinInput(value: string): string {
  return value.replace(CONTROL_CHARS, "").trim();
}

/** Registro como empresa: sin contraseña (usuario creado vía Admin API; login por OTP cuando esté aprobado). */
export const registerBusinessSchema = z.object({
  businessName: registerBusinessNameSchema(),
  phone: registerBusinessPhoneSchema(US_PHONE_INVALID_ES),
  email: registerBusinessEmailSchema(),
  employerIdentificationNumber: z
    .string()
    .trim()
    .min(1, "El EIN es obligatorio")
    .max(32, "Valor demasiado largo"),
});

export type RegisterBusinessFormMessages = {
  businessNameRequired: string;
  businessNameMin: string;
  businessNameMax: string;
  businessNameChars: string;
  emailRequired: string;
  emailInvalid: string;
  emailMax: string;
  phoneChars: string;
  phoneInvalid: string;
  phoneMax: string;
  einRequired: string;
  einDigits: string;
  einPrefix: string;
};

export function createRegisterBusinessSchema(
  messages: RegisterBusinessFormMessages,
) {
  return z.object({
    businessName: z
      .string()
      .max(100, messages.businessNameMax)
      .transform(cleanText)
      .refine((s) => s.length > 0, messages.businessNameRequired)
      .refine((s) => s.length >= 2, messages.businessNameMin)
      .refine((s) => isValidBusinessName(s), messages.businessNameChars),
    phone: z
      .string()
      .max(40, messages.phoneMax)
      .refine(
        (raw) => /^[\d()+\s-]*$/.test(raw.replace(CONTROL_CHARS, "")),
        messages.phoneChars,
      )
      .transform(cleanPhone)
      .refine((s) => s.length > 0, messages.phoneInvalid)
      .refine((s) => isValidUsPhoneNumber(s), messages.phoneInvalid),
    email: z
      .string()
      .max(160, messages.emailMax)
      .transform((s) => cleanText(s).toLowerCase())
      .refine((s) => s.length > 0, messages.emailRequired)
      .refine(
        (s) =>
          EMAIL_PATTERN.test(s) &&
          !s.includes("..") &&
          z.string().email().safeParse(s).success,
        messages.emailInvalid,
      ),
    employerIdentificationNumber: z
      .string()
      .transform(cleanEinInput)
      .refine((s) => s.length > 0, messages.einRequired)
      .transform((s) => s.replace(/-/g, ""))
      .refine((s) => /^\d{9}$/.test(s), messages.einDigits)
      .refine(
        (s) => IRS_EIN_PREFIXES.includes(s.slice(0, 2)),
        messages.einPrefix,
      )
      .transform((s) => `${s.slice(0, 2)}-${s.slice(2)}`),
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
