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
import { getAppBaseUrl } from "@/lib/app-url";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/** Convierte errores de `signInWithOtp` (p. ej. límite de envío de email) en mensajes legibles. */
function mapSignInWithOtpError(error: unknown): Error {
  const obj = error && typeof error === "object" ? error : null;
  const code =
    obj && "code" in obj ? String((obj as { code?: unknown }).code ?? "") : "";
  const status =
    obj && "status" in obj ? Number((obj as { status?: unknown }).status) : NaN;

  if (code === "over_email_send_rate_limit") {
    return new Error(
      "Se han enviado demasiados correos. Espera unos minutos antes de solicitar otro código.",
    );
  }
  if (Number.isFinite(status) && status === 429) {
    return new Error(
      "Demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.",
    );
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
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

  const blockReason = await repoGetBusinessLoginBlockReason(parsed.data.email);
  if (blockReason === "pending") {
    throw new Error(
      "Tu cuenta de empresa está pendiente de aprobación por un administrador. Te avisaremos por correo cuando puedas iniciar sesión."
    );
  }
  if (blockReason === "rejected") {
    throw new Error(
      "Tu solicitud de empresa no fue aprobada. Contacta con soporte si necesitas más información."
    );
  }

  try {
    await repoSignInWithOtp(parsed.data.email);
  } catch (error: unknown) {
    throw mapSignInWithOtpError(error);
  }
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

  if (user?.role === "BUSINESS") {
    const s = user.businessRegistrationStatus ?? "pending";
    if (s !== "approved") {
      await repoLogout();
      if (s === "rejected") {
        throw new Error(
          "Tu solicitud de empresa no fue aprobada. Contacta con soporte si necesitas más información."
        );
      }
      throw new Error(
        "Tu cuenta de empresa está pendiente de aprobación por un administrador."
      );
    }
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

export async function ensureAdminUserService() {
  const user = await getCurrentUserService();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function logoutService() {
  await repoLogout();
  return { success: true };
}
