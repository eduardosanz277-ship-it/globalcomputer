import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { AuthCredentials, RegisterPayload, SessionUser } from "./auth.types";

export async function repoLogin(credentials: AuthCredentials) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw error;
  return data;
}

/**
 * Passwordless: envía enlace mágico y/o código según plantilla de email en Supabase.
 * `emailRedirectTo` debe coincidir con URL permitidas del proyecto (Site URL / Redirect URLs).
 */
export async function repoSignInWithOtp(email: string, emailRedirectTo: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo,
    },
  });
  if (error) throw error;
}

export async function repoVerifyEmailOtp(email: string, token: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
}

export async function repoRegister(payload: RegisterPayload) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName,
        role: "CLIENT",
      },
    },
  });

  if (error) throw error;
  return data;
}

function normalizeRole(
  raw: string | undefined | null
): SessionUser["role"] | null {
  if (raw === "ADMIN" || raw === "BUSINESS" || raw === "CLIENT") return raw;
  return null;
}

export async function repoGetSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();

  // getUser() valida el JWT en el servidor; getSession() puede estar desfasado en RSC.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const fromProfile = normalizeRole(profile?.role ?? null);
  const fromMeta = normalizeRole(
    typeof user.user_metadata?.role === "string"
      ? user.user_metadata.role
      : null
  );
  const role: SessionUser["role"] =
    fromProfile ?? fromMeta ?? "CLIENT";

  return {
    id: user.id,
    email: user.email ?? "",
    role,
    fullName:
      profile?.full_name ??
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null),
  };
}

export async function repoLogout() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

