import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  AuthCredentials,
  RegisterBusinessPayload,
  RegisterPayload,
  SessionUser,
} from "./auth.types";

const DUPLICATE_EMAIL_MSG =
  "Ya existe una cuenta con este correo electrónico.";
const DUPLICATE_EIN_MSG =
  "Ya existe una cuenta registrada con este EIN (Employer Identification Number).";

/** Errores típicos de Auth Admin al crear usuario con email ya registrado. */
function mapAuthAdminDuplicateEmail(error: unknown): Error {
  const msg =
    (error instanceof Error ? error.message : String(error)).toLowerCase();
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  if (
    code === "email_exists" ||
    code === "email_address_not_unique" ||
    msg.includes("already been registered") ||
    msg.includes("already registered") ||
    msg.includes("user already registered") ||
    msg.includes("email address is already") ||
    (msg.includes("duplicate") &&
      (msg.includes("email") || msg.includes("users_email")))
  ) {
    return new Error(DUPLICATE_EMAIL_MSG);
  }
  return error instanceof Error ? error : new Error(String(error));
}

function isPostgresUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: string; message?: string };
  return (
    e.code === "23505" ||
    (e.message ?? "").toLowerCase().includes("duplicate key") ||
    (e.message ?? "").toLowerCase().includes("unique constraint")
  );
}

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

/**
 * Alta empresa sin contraseña: creación en Auth con service role (no abre sesión en el cliente).
 * El trigger `handle_new_user` deja el perfil en `pending` hasta aprobación admin.
 */
export async function repoRegisterBusiness(payload: RegisterBusinessPayload) {
  const admin = createSupabaseAdminClient();

  const email = payload.email.trim().toLowerCase();
  const ein = payload.employerIdentificationNumber.trim();

  const { data: existingEin, error: einCheckError } = await admin
    .from("profiles")
    .select("id")
    .eq("employer_identification_number", ein)
    .maybeSingle();

  if (einCheckError) throw einCheckError;
  if (existingEin) {
    throw new Error(DUPLICATE_EIN_MSG);
  }

  const meta: Record<string, string> = {
    full_name: payload.businessName.trim(),
    role: "BUSINESS",
    employer_identification_number: ein,
    employerIdentificationNumber: ein,
  };
  if (payload.phone?.trim()) {
    const p = payload.phone.trim();
    meta.phone = p;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: {
      role: "BUSINESS",
    },
    user_metadata: meta,
  });

  if (error) throw mapAuthAdminDuplicateEmail(error);
  const userId = data.user?.id;
  if (!userId) {
    throw new Error("No se pudo crear el usuario.");
  }

  // El trigger en auth.users debería insertar en profiles; si no existe (migración ausente,
  // fallo del trigger, etc.) solo UPDATE no crea fila. upsert garantiza fila en profiles.
  const phoneTrim = payload.phone?.trim() ?? "";
  const profileRow = {
    id: userId,
    full_name: payload.businessName.trim(),
    phone: phoneTrim || null,
    employer_identification_number: ein,
    role: "BUSINESS" as const,
    business_registration_status: "pending" as const,
  };

  const { data: savedProfile, error: profileError } = await admin
    .from("profiles")
    .upsert(profileRow, { onConflict: "id" })
    .select("id")
    .single();

  if (profileError) {
    if (isPostgresUniqueViolation(profileError)) {
      await admin.auth.admin.deleteUser(userId);
      throw new Error(DUPLICATE_EIN_MSG);
    }
    throw profileError;
  }
  if (!savedProfile?.id) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error(
      "No se pudo guardar el perfil en la base de datos. Contacta con soporte."
    );
  }

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
    .select("full_name, role, business_registration_status")
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

  const brs = profile?.business_registration_status;
  const businessRegistrationStatus =
    brs === "pending" || brs === "approved" || brs === "rejected"
      ? brs
      : null;

  return {
    id: user.id,
    email: user.email ?? "",
    role,
    fullName:
      profile?.full_name ??
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null),
    businessRegistrationStatus,
  };
}

export async function repoGetBusinessLoginBlockReason(
  email: string
): Promise<"pending" | "rejected" | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("business_login_block_reason", {
    check_email: email.trim().toLowerCase(),
  });
  if (error) {
    console.error("business_login_block_reason:", error.message);
    return null;
  }
  if (data === "pending" || data === "rejected") return data;
  return null;
}

export async function repoLogout() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

