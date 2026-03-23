import type { UserRole } from "@/modules/auth/auth.types";

export interface AdminUser {
  id: string;
  fullName: string | null;
  role: UserRole;
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
  /** Fecha creación fila perfil o auth */
  createdAt: string | null;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
}

