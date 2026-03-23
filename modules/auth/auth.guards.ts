import type { UserRole } from "./auth.types";

/** Quién puede usar el shell /admin/* (panel comercio + administración). */
export function canAccessAdminRoutes(role: UserRole | undefined): boolean {
  return role === "ADMIN" || role === "BUSINESS";
}

/** Solo administradores globales (p. ej. gestión de usuarios). */
export function isGlobalAdmin(role: UserRole | undefined): boolean {
  return role === "ADMIN";
}
