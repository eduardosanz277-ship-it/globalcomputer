import type { UserRole } from "@/modules/auth/auth.types";

export interface AdminUser {
  id: string;
  fullName: string | null;
  role: UserRole;
  createdAt: string | null;
}

