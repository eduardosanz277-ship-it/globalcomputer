import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { BusinessRegistrationStatus } from "@/modules/auth/auth.types";
import type { AdminBusinessProfileRow } from "./business-profiles.types";

/**
 * Lista filas de `public.profiles` con `role = 'BUSINESS'`.
 * Usa service role para leer todas las filas: con la anon key + RLS solo se verían
 * los perfiles que la política `is_admin()` permite, y si falla el contexto admin
 * la query devuelve [] sin error.
 * Email y último acceso se enriquecen desde Auth Admin (no están en profiles).
 */
export async function repoListBusinessProfiles(): Promise<
  AdminBusinessProfileRow[]
> {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, full_name, created_at, business_registration_status, phone, employer_identification_number, role"
    )
    .eq("role", "BUSINESS")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const emailById = new Map<string, string | null>();
  const lastSignInById = new Map<string, string | null>();
  let page = 1;
  const perPage = 1000;
  const maxPages = 50;

  while (page <= maxPages) {
    const { data: listData, error: listErr } =
      await admin.auth.admin.listUsers({ page, perPage });
    if (listErr) throw listErr;

    const users = listData?.users ?? [];
    for (const u of users) {
      emailById.set(u.id, u.email ?? null);
      lastSignInById.set(u.id, u.last_sign_in_at ?? null);
    }
    if (users.length < perPage) break;
    page += 1;
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const brs = row.business_registration_status;
    const businessRegistrationStatus =
      brs === "pending" || brs === "approved" || brs === "rejected"
        ? (brs as BusinessRegistrationStatus)
        : null;

    const id = row.id as string;

    return {
      id,
      fullName: (row.full_name as string | null) ?? null,
      email: emailById.get(id) ?? null,
      phone: (row.phone as string | null) ?? null,
      employerIdentificationNumber:
        (row.employer_identification_number as string | null) ?? null,
      businessRegistrationStatus,
      createdAt: (row.created_at as string | null) ?? null,
      lastSignInAt: lastSignInById.get(id) ?? null,
    };
  });
}

/** Suscripciones empresariales pendientes de aprobación (`pending` o sin estado). */
export async function repoCountPendingBusinessProfiles(): Promise<number> {
  try {
    const admin = createSupabaseAdminClient();
    const { count, error } = await admin
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .eq("role", "BUSINESS")
      .or(
        "business_registration_status.eq.pending,business_registration_status.is.null",
      );
    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}
