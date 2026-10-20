import { z } from "zod";
import {
  US_PHONE_DIGIT_COUNT,
  isValidUsPhoneNumber,
} from "@/modules/auth/auth.schema";

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_URLS = 2;

// Campo honeypot oculto. Usamos un nombre poco común para reducir autofill.
export const CONTACT_HONEYPOT_FIELD = "extra_info";

export type ContactRequestFormMessages = {
  nameRequired: string;
  nameMin: string;
  nameMax: string;
  nameChars: string;
  emailRequired: string;
  emailInvalid: string;
  emailMax: string;
  phoneRequired: string;
  phoneChars: string;
  phoneInvalid: string;
  phoneMax: string;
  subjectRequired: string;
  subjectMin: string;
  subjectMax: string;
  subjectChars?: string;
  messageRequired: string;
  messageMin: string;
  messageMax: string;
  messageChars?: string;
  messageLinks: string;
};

const DEFAULT_MESSAGES: ContactRequestFormMessages = {
  nameRequired: "El nombre es obligatorio",
  nameMin: "El nombre debe tener al menos 2 caracteres",
  nameMax: "Máximo 100 caracteres",
  nameChars:
    "El nombre solo puede incluir letras, espacios, guiones y apóstrofes (sin números ni símbolos especiales).",
  emailRequired: "El correo es obligatorio",
  emailInvalid: "Introduce un correo válido",
  emailMax: "Máximo 160 caracteres",
  phoneRequired: "El teléfono es obligatorio",
  phoneChars:
    "El teléfono solo puede incluir dígitos, espacios, paréntesis, signo + y guiones.",
  phoneInvalid: "El teléfono de Estados Unidos debe tener 10 dígitos",
  phoneMax: "Máximo 40 caracteres",
  subjectRequired: "El asunto es obligatorio",
  subjectMin: "El asunto debe tener al menos 3 caracteres",
  subjectMax: "Máximo 150 caracteres",
  subjectChars:
    "El asunto solo puede incluir letras, números, espacios y signos de puntuación básicos.",
  messageRequired: "El mensaje es obligatorio",
  messageMin: "El mensaje debe tener al menos 10 caracteres",
  messageMax: "Máximo 2000 caracteres",
  messageChars:
    "El mensaje no puede incluir los caracteres < o > ni fragmentos de código.",
  messageLinks: "El mensaje no puede incluir tantos enlaces",
};

function cleanText(value: string): string {
  return value.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
}

/** Solo dígitos y formato visual (+, -, espacios, paréntesis); limpia el resto. */
function cleanPhone(value: string): string {
  return value
    .replace(CONTROL_CHARS, "")
    .replace(/[^\d()+\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanMultiline(value: string): string {
  return value
    .replace(CONTROL_CHARS, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countUrlSchemes(value: string): number {
  return (value.match(/https?:\/\//gi) ?? []).length;
}

// Letras (incluyendo acentos y ñ), números, espacios y puntuación básica . , ? ! : ;
function isValidSubject(value: string): boolean {
  const trimmed = cleanText(value);
  if (!trimmed) return false;
  return /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9 .,?!:;'-]+$/.test(trimmed);
}

// Letras (incluyendo acentos y ñ), espacios, guiones y apóstrofes.
function isValidContactName(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ' -]+$/.test(trimmed);
}

function textField(opts: {
  required: string;
  min: string;
  max: string;
  minLen: number;
  maxLen: number;
}) {
  return z
    .string()
    .max(opts.maxLen, opts.max)
    .transform(cleanText)
    .refine((s) => s.length > 0, opts.required)
    .refine((s) => s.length >= opts.minLen, opts.min);
}

export function createContactRequestFormSchema(
  messages: ContactRequestFormMessages = DEFAULT_MESSAGES,
) {
  return z.object({
    name: textField({
      required: messages.nameRequired,
      min: messages.nameMin,
      max: messages.nameMax,
      minLen: 2,
      maxLen: 100,
    }).refine((s) => isValidContactName(s), messages.nameChars),
    email: z
      .string()
      .max(160, messages.emailMax)
      .transform((s) => cleanText(s).toLowerCase())
      .refine((s) => s.length > 0, messages.emailRequired)
      .refine(
        (s) => EMAIL_PATTERN.test(s) && !s.includes("..") && z.string().email().safeParse(s).success,
        messages.emailInvalid,
      ),
    phone: z
      .string()
      .max(40, messages.phoneMax)
      .refine(
        (raw) => /^[\d()+\s-]*$/.test(raw.replace(CONTROL_CHARS, "")),
        messages.phoneChars,
      )
      .transform(cleanPhone)
      .refine((s) => s.length > 0, messages.phoneRequired)
      .refine((s) => isValidUsPhoneNumber(s), messages.phoneInvalid),
    subject: textField({
      required: messages.subjectRequired,
      min: messages.subjectMin,
      max: messages.subjectMax,
      minLen: 5,
      maxLen: 100,
    }).refine((s) => isValidSubject(s), messages.subjectChars ?? messages.subjectMax),
    message: z
      .string()
      .max(2000, messages.messageMax)
      .transform(cleanMultiline)
      .refine((s) => s.length > 0, messages.messageRequired)
      .refine((s) => s.length >= 10, messages.messageMin)
      .refine((s) => !/[<>]/.test(s), messages.messageChars ?? messages.messageMax)
      .refine((s) => countUrlSchemes(s) <= MAX_MESSAGE_URLS, messages.messageLinks),
    [CONTACT_HONEYPOT_FIELD]: z.string().max(200).optional().default(""),
  });
}

export const contactRequestFormSchema = createContactRequestFormSchema();

export type ContactRequestFormValues = z.infer<typeof contactRequestFormSchema>;

export function isContactHoneypotFilled(
  value: ContactRequestFormValues[typeof CONTACT_HONEYPOT_FIELD],
): boolean {
  return Boolean(value?.trim());
}

export { US_PHONE_DIGIT_COUNT };
