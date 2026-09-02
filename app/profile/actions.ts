"use server";
import { translate } from "@/lib/i18n/get-translation";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { isNetworkActionError } from "@/lib/errors/network-action-error";
import { rethrowTaggingNetworkError } from "@/lib/errors/rsc-network-error";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function throwIfSupabaseError(error: unknown): void {
  if (!error) return;
  if (isNetworkActionError(error)) rethrowTaggingNetworkError(error);
  throw error;
}

async function getAuthenticatedUserId() {
  const locale = await getServerLocale();
  const supabase = await createSupabaseServerClient();
  let user: Awaited<
    ReturnType<typeof supabase.auth.getUser>
  >["data"]["user"] | null = null;
  let authError: Error | null = null;

  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    authError = result.error;
  } catch (error) {
    rethrowTaggingNetworkError(error);
    throw error;
  }

  if (authError) {
    if (isNetworkActionError(authError)) rethrowTaggingNetworkError(authError);
    throw new Error(translate(locale, "profile.errorSessionRequired"));
  }
  if (!user) {
    throw new Error(translate(locale, "profile.errorSessionRequired"));
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
  if (profileError) {
    if (isNetworkActionError(profileError)) rethrowTaggingNetworkError(profileError);
    throw profileError;
  }
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
    if (insertError) throwIfSupabaseError(insertError);
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
  if (error) throwIfSupabaseError(error);
  return null;
}

export type AddAddressPayload = {
  firstName?: string;
  lastName?: string;
  company?: string;
  apartment?: string;
  phone?: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
};

async function clearDefaultAddressesForUser(
  supabase: ServerSupabase,
  userId: string,
) {
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_default", true);
  if (error) throwIfSupabaseError(error);
}

export async function addAddressAction(payload: AddAddressPayload) {
  const locale = await getServerLocale();
  const { supabase, userId } = await getAuthenticatedUserId();
  const firstName = payload.firstName?.trim() || null;
  const lastName = payload.lastName?.trim() || null;
  const street = payload.street.trim();
  if (!street) {
    throw new Error(translate(locale, "profile.validationStreetRequired"));
  }
  const postalCode = payload.postalCode?.trim() ?? "";
  if (!postalCode) {
    throw new Error(
      translate(locale, "profile.validationPostalRequired"),
    );
  }
  const city = payload.city.trim();
  if (!city) {
    throw new Error(translate(locale, "profile.validationCityRequired"));
  }
  const isDefault = Boolean(payload.isDefault);
  if (isDefault) {
    await clearDefaultAddressesForUser(supabase, userId);
  }
  const { error } = await supabase.from("addresses").insert({
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    company: payload.company?.trim() || null,
    apartment: payload.apartment?.trim() || null,
    phone: payload.phone?.trim() || null,
    street,
    city,
    state: payload.state?.trim() || null,
    postal_code: postalCode,
    country: payload.country?.trim() || "United States",
    is_default: isDefault,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throwIfSupabaseError(error);
  return null;
}

export type UpdateAddressPayload = AddAddressPayload & { addressId: string };

export async function updateAddressAction(payload: UpdateAddressPayload) {
  const locale = await getServerLocale();
  const { supabase, userId } = await getAuthenticatedUserId();
  const firstName = payload.firstName?.trim() || null;
  const lastName = payload.lastName?.trim() || null;
  const street = payload.street.trim();
  if (!street) {
    throw new Error(translate(locale, "profile.validationStreetRequired"));
  }
  const postalCode = payload.postalCode?.trim() ?? "";
  if (!postalCode) {
    throw new Error(
      translate(locale, "profile.validationPostalRequired"),
    );
  }
  const city = payload.city.trim();
  if (!city) {
    throw new Error(translate(locale, "profile.validationCityRequired"));
  }
  const isDefault = Boolean(payload.isDefault);
  if (isDefault) {
    await clearDefaultAddressesForUser(supabase, userId);
  }
  const { error } = await supabase
    .from("addresses")
    .update({
      first_name: firstName,
      last_name: lastName,
      company: payload.company?.trim() || null,
      apartment: payload.apartment?.trim() || null,
      phone: payload.phone?.trim() || null,
      street,
      city,
      state: payload.state?.trim() || null,
      postal_code: postalCode,
      country: payload.country?.trim() || "United States",
      is_default: isDefault,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.addressId)
    .eq("user_id", userId);
  if (error) throwIfSupabaseError(error);
  return null;
}

export async function deleteAddressAction(payload: { addressId: string }) {
  const { supabase, userId } = await getAuthenticatedUserId();
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", payload.addressId)
    .eq("user_id", userId);
  if (error) throwIfSupabaseError(error);
  return null;
}
