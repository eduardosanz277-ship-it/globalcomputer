"use server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

async function getAuthenticatedUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Necesitas iniciar sesión nuevamente.");
  }

  const allowedRoles = new Set(["CLIENT", "BUSINESS", "ADMIN"]);
  const metadataRole =
    typeof user.user_metadata?.role === "string" &&
    allowedRoles.has(user.user_metadata.role)
      ? user.user_metadata.role
      : null;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? null;
  const adminRole = process.env.ADMIN_ROLE?.trim().toUpperCase() ?? "ADMIN";
  const isAdminEmail = adminEmail ? user.email?.toLowerCase() === adminEmail : false;

  const { error: profileError, data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) {
    const resolvedRole = isAdminEmail
      ? allowedRoles.has(adminRole)
        ? adminRole
        : "ADMIN"
      : metadataRole ?? "CLIENT";

    const { error: insertError } = await createSupabaseAdminClient()
      .from("profiles")
      .insert({
        id: user.id,
        full_name: null,
        role: resolvedRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    if (insertError) throw insertError;
  }
  return { supabase, userId: user.id };
}

export async function updateProfileNameAction(payload: { name: string }) {
  const { supabase, userId } = await getAuthenticatedUserId();
  const name = payload.name.trim();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: name || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
  return null;
}

export type AddAddressPayload = {
  label?: string;
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export async function addAddressAction(payload: AddAddressPayload) {
  const { supabase, userId } = await getAuthenticatedUserId();
  const street = payload.street.trim();
  const city = payload.city.trim();
  const { error } = await supabase.from("addresses").insert({
    user_id: userId,
    label: payload.label?.trim() || null,
    street,
    city,
    state: payload.state?.trim() || null,
    postal_code: payload.postalCode?.trim() || null,
    country: payload.country?.trim() || "España",
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return null;
}

export async function deleteAddressAction(payload: { addressId: string }) {
  const { supabase, userId } = await getAuthenticatedUserId();
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", payload.addressId)
    .eq("user_id", userId);
  if (error) throw error;
  return null;
}
