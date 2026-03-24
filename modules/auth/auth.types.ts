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
}

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string | null;
  businessRegistrationStatus?: BusinessRegistrationStatus | null;
}

