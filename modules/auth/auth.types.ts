export type UserRole = "CLIENT" | "BUSINESS" | "ADMIN";

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  fullName: string;
}

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string | null;
}

