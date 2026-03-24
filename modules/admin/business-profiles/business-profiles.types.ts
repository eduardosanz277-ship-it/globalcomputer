import type { BusinessRegistrationStatus } from "@/modules/auth/auth.types";

/** Fila de listado admin: solo `profiles` con `role = BUSINESS`. */
export interface AdminBusinessProfileRow {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  employerIdentificationNumber: string | null;
  businessRegistrationStatus: BusinessRegistrationStatus | null;
  createdAt: string | null;
  lastSignInAt: string | null;
}
