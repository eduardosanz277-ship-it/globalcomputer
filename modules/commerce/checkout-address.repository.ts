import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type CheckoutShippingAddressRow = {
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  apartment: string | null;
  street: string;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
};

/**
 * Dirección de envío preferida del usuario: `is_default`, si no, la más reciente.
 */
export async function repoGetDefaultShippingAddressForUser(
  userId: string,
): Promise<CheckoutShippingAddressRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data: def } = await supabase
    .from("addresses")
    .select(
      "first_name, last_name, company, apartment, street, city, state, postal_code, country, phone",
    )
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();

  if (def) return def as CheckoutShippingAddressRow;

  const { data: anyRow } = await supabase
    .from("addresses")
    .select(
      "first_name, last_name, company, apartment, street, city, state, postal_code, country, phone",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (anyRow as CheckoutShippingAddressRow | null) ?? null;
}

export async function repoGetProfileStripeCustomerId(
  userId: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  const id = data.stripe_customer_id;
  return typeof id === "string" && id.trim() !== "" ? id.trim() : null;
}

export async function repoSetProfileStripeCustomerId(
  userId: string,
  stripeCustomerId: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("profiles")
    .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
    .eq("id", userId);
}
