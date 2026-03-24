import {
  emailOtpRequestSchema,
  emailOtpVerifySchema,
  loginSchema,
  registerBusinessSchema,
  registerSchema,
  type RegisterBusinessFormInput,
} from "./auth.schema";
import { AuthCredentials, RegisterPayload } from "./auth.types";
import {
  repoGetBusinessLoginBlockReason,
  repoGetSessionUser,
  repoLogin,
  repoLogout,
  repoRegister,
  repoRegisterBusiness,
  repoSignInWithOtp,
  repoVerifyEmailOtp,
} from "./auth.repository";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

/**
 * Tras login correcto (enlace, código o contraseña admin): actualiza `profiles`
 * con datos de `auth` (p. ej. nombre desde metadata) y `updated_at`.
 */
export async function syncProfileAfterLoginService(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return;

  const metaName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const existing = profile?.full_name?.trim();
  const resolvedFullName = existing || metaName || null;

  const { error: upErr } = await supabase
    .from("profiles")
    .update({
      full_name: resolvedFullName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (upErr) {
    console.error("syncProfileAfterLoginService:", upErr.message);
  }
}

/** Solo administradores (email + contraseña en /admin/login). */
export async function adminPasswordLoginService(payload: AuthCredentials) {
  const normalized = {
    email: payload.email.trim().toLowerCase(),
    password: payload.password.trim(),
  };

  const parsed = loginSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  await repoLogin(parsed.data);
  const user = await repoGetSessionUser();

  if (user?.role !== "ADMIN") {
    await repoLogout();
    throw new Error(
      "Este acceso es solo para administradores. Si eres cliente o empresa, inicia sesión en la página principal."
    );
  }

  await syncProfileAfterLoginService();
  return { success: true as const };
}

export async function sendLoginOtpService(rawEmail: string) {
  const parsed = emailOtpRequestSchema.safeParse({
    email: rawEmail.trim().toLowerCase(),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Email inválido");
  }

  const redirectTo = `${getAppBaseUrl()}/auth/callback`;
  await repoSignInWithOtp(parsed.data.email, redirectTo);
}

export async function verifyLoginOtpService(rawEmail: string, rawCode: string) {
  const parsed = emailOtpVerifySchema.safeParse({
    email: rawEmail.trim().toLowerCase(),
    code: rawCode.replace(/\s/g, ""),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  await repoVerifyEmailOtp(parsed.data.email, parsed.data.code);

  const user = await repoGetSessionUser();
  if (user?.role === "ADMIN") {
    await repoLogout();
    throw new Error(
      "Las cuentas de administrador deben iniciar sesión en /admin/login."
    );
  }

  await syncProfileAfterLoginService();
}

export async function registerService(payload: RegisterPayload) {
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  await repoRegister(parsed.data);
  return { success: true };
}

export async function registerBusinessService(payload: RegisterBusinessFormInput) {
  const parsed = registerBusinessSchema.safeParse({
    businessName: payload.businessName,
    phone: payload.phone ?? "",
    email: payload.email.trim().toLowerCase(),
    employerIdentificationNumber: payload.employerIdentificationNumber,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  await repoRegisterBusiness({
    businessName: parsed.data.businessName,
    phone: parsed.data.phone,
    email: parsed.data.email,
    employerIdentificationNumber: parsed.data.employerIdentificationNumber,
  });
  return { success: true };
}

export async function getCurrentUserService() {
  return repoGetSessionUser();
}

export async function logoutService() {
  await repoLogout();
  return { success: true };
}
