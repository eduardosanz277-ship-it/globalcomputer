import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { AuthCredentials, RegisterPayload, SessionUser } from "./auth.types";

export async function repoLogin(credentials: AuthCredentials) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw error;
  return data;
}

export async function repoRegister(payload: RegisterPayload) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName,
        role: "USER",
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function repoGetSessionUser(): Promise<SessionUser | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", session.user.id)
    .single();

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    role: (profile?.role as SessionUser["role"]) ?? "USER",
    fullName: profile?.full_name ?? session.user.user_metadata.full_name,
  };
}

export async function repoLogout() {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

