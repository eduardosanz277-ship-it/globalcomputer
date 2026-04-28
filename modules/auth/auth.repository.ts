import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
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

const OTP_COOLDOWN_SECONDS = 60;

function isRefreshTokenNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; message?: unknown; status?: unknown };
  const code = typeof e.code === "string" ? e.code : "";
  const message = typeof e.message === "string" ? e.message : "";
  const status = typeof e.status === "number" ? e.status : NaN;
  return (
    code === "refresh_token_not_found" ||
    (Number.isFinite(status) && status === 400 && /invalid refresh token/i.test(message)) ||
    /refresh token not found/i.test(message)
  );
}

export async function repoGetOtpCooldown(email: string): Promise<Date | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("otp_resend_locks")
    .select("blocked_until")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (error) {
    console.error("repoGetOtpCooldown:", error.message);
    return null;
  }
  return data?.blocked_until ? new Date(data.blocked_until) : null;
}

export async function repoUpsertOtpCooldown(email: string, blockedUntil: Date) {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("otp_resend_locks")
    .upsert(
      {
        email: normalizedEmail,
        blocked_until: blockedUntil.toISOString(),
      },
      { onConflict: "email" },
    );
  if (error) {
    console.error("repoUpsertOtpCooldown:", error.message);
  }
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
 * Passwordless: envía un código OTP (tipo email) y crea el usuario si no existe.
 */
export async function repoSignInWithOtp(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const blockUntil = await repoGetOtpCooldown(normalizedEmail);
  const now = Date.now();
  if (blockUntil && blockUntil.getTime() > now) {
    const remainingSeconds = Math.ceil((blockUntil.getTime() - now) / 1000);
    const timeLabel =
      remainingSeconds === 1 ? "segundo" : `${remainingSeconds} segundos`;
    throw new Error(
      `Ya enviaste un código recientemente. Intenta de nuevo en ${timeLabel}.`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: true,
    },
  });
  if (error) throw error;

  const nextBlock = new Date(now + OTP_COOLDOWN_SECONDS * 1000);
  await repoUpsertOtpCooldown(normalizedEmail, nextBlock);
}

export async function repoVerifyEmailOtp(email: string, token: string) {
  const supabase = await createSupabaseServerClient();
  const prefersMagicLink =
    token.includes(".") || token.length > 60 || /-/g.test(token);

  const attemptTypes = prefersMagicLink
    ? ["magiclink", "email"]
    : ["email", "magiclink"];

  let lastError: Error | null = null;
  for (const type of attemptTypes) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: type as Parameters<
          typeof supabase.auth.verifyOtp
        >[0]["type"],
      } as Parameters<typeof supabase.auth.verifyOtp>[0]);
      if (!error) return;
      lastError = error;
    } catch (error) {
      if (error instanceof Error) {
        lastError = error;
      } else {
        lastError = new Error(String(error));
      }
    }
  }

  if (!lastError) {
    throw new Error("Token inválido");
  }
  throw lastError;
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
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;
  let error: Error | null = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    error = result.error;
  } catch (e) {
    if (isRefreshTokenNotFoundError(e)) {
      return null;
    }
    throw e;
  }

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

