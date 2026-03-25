import type { BusinessRegistrationStatus, UserRole } from "@/modules/auth/auth.types";

export interface AdminUser {
  id: string;
  /** Desde auth.users (listado admin). */
  email: string | null;
  fullName: string | null;
  role: UserRole;
  /** Solo empresas; null si no aplica. */
  businessRegistrationStatus: BusinessRegistrationStatus | null;
  createdAt: string | null;
  /** Desde auth.users (Admin API). */
  lastSignInAt: string | null;
}

export interface AdminUserDetail {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  role: UserRole;
  businessRegistrationStatus: BusinessRegistrationStatus | null;
  employerIdentificationNumber: string | null;
  /** Fecha creación fila perfil o auth */
  createdAt: string | null;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
}

