import type { Locale } from "@/components/i18n/translations";

export type UserRole = "CLIENT" | "BUSINESS" | "ADMIN";

/** Solo aplica a `role === "BUSINESS"`; en otros roles es `null`. */
export type BusinessRegistrationStatus = "pending" | "approved" | "rejected";

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  fullName: string;
}

/** Registro empresa: sin contraseña; acceso solo por OTP tras aprobación admin. */
export interface RegisterBusinessPayload {
  businessName: string;
  phone?: string;
  email: string;
  employerIdentificationNumber: string;
  /** Locale de la UI al registrarse; se usa en el correo de aprobación. */
  locale?: Locale;
}

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string | null;
  businessRegistrationStatus?: BusinessRegistrationStatus | null;
}

