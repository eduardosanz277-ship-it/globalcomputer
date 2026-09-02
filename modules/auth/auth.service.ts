import { REGISTER_BUSINESS_ERROR } from "./auth.errors";
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
import { recognizedAppLocale } from "@/lib/i18n/parse-locale";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { translate } from "@/lib/i18n/get-translation";
import type { Locale } from "@/components/i18n/translations";
import {
  extractErrorMessage,
  isNetworkActionError,
} from "@/lib/errors/network-action-error";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/** Convierte errores de `signInWithOtp` (p. ej. límite de envío de email) en mensajes legibles. */
function mapSignInWithOtpError(error: unknown, locale: Locale): Error {
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
  if (isNetworkActionError(error)) {
    return new Error(translate(locale, "common.errors.network"));
  }
  const message = extractErrorMessage(error);
  if (message) {
    return new Error(message);
  }
  return new Error(translate(locale, "common.errors.unexpected"));
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
function isInvalidLoginCredentialsError(error: unknown): boolean {
  const message = (
    error instanceof Error ? error.message : String(error ?? "")
  ).toLowerCase();
  const obj = error && typeof error === "object" ? error : null;
  const code =
    obj && "code" in obj ? String((obj as { code?: unknown }).code ?? "") : "";
  return (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password")
  );
}

export async function adminPasswordLoginService(
  payload: AuthCredentials,
  localeInput?: unknown,
) {
  const locale = (recognizedAppLocale(localeInput) ??
    (await getServerLocale())) as Locale;

  const normalized = {
    email: payload.email.trim().toLowerCase(),
    password: payload.password.trim(),
  };

  const parsed = loginSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  try {
    await repoLogin(parsed.data);
  } catch (error: unknown) {
    if (isInvalidLoginCredentialsError(error)) {
      throw new Error(translate(locale, "adminLogin.errors.invalidCredentials"));
    }
    if (isNetworkActionError(error)) {
      throw new Error(translate(locale, "common.errors.network"));
    }
    throw new Error(
      error instanceof Error && error.message.trim()
        ? error.message
        : translate(locale, "adminLogin.errors.generic"),
    );
  }

  const user = await repoGetSessionUser();

  if (user?.role !== "ADMIN") {
    await repoLogout();
    throw new Error(translate(locale, "adminLogin.errors.notAdmin"));
  }

  await syncProfileAfterLoginService();
  return { success: true as const };
}

export async function sendLoginOtpService(
  rawEmail: string,
  localeInput?: unknown,
) {
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

  const locale = recognizedAppLocale(localeInput) ?? (await getServerLocale());

  try {
    await repoSignInWithOtp(parsed.data.email, locale);
  } catch (error: unknown) {
    throw mapSignInWithOtpError(error, locale);
  }
}

export async function verifyLoginOtpService(
  rawEmail: string,
  rawCode: string,
  localeInput?: unknown,
) {
  const locale = recognizedAppLocale(localeInput) ?? (await getServerLocale());
  const parsed = emailOtpVerifySchema.safeParse({
    email: rawEmail.trim().toLowerCase(),
    code: rawCode.replace(/\s/g, ""),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  try {
    await repoVerifyEmailOtp(parsed.data.email, parsed.data.code);
  } catch (error: unknown) {
    if (isNetworkActionError(error)) {
      throw new Error(translate(locale, "common.errors.network"));
    }
    const message = extractErrorMessage(error);
    throw new Error(
      message || translate(locale, "common.errors.unexpected"),
    );
  }

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

export async function registerService(
  payload: RegisterPayload,
  localeInput?: unknown,
) {
  const locale = recognizedAppLocale(localeInput) ?? (await getServerLocale());
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  try {
    await repoRegister(parsed.data);
  } catch (error: unknown) {
    if (isNetworkActionError(error)) {
      throw new Error(translate(locale, "common.errors.network"));
    }
    const message = extractErrorMessage(error);
    throw new Error(
      message || translate(locale, "common.errors.unexpected"),
    );
  }
  return { success: true };
}

export async function registerBusinessService(
  payload: RegisterBusinessFormInput,
  localeInput?: unknown,
) {
  const locale = (recognizedAppLocale(localeInput) ??
    (await getServerLocale())) as Locale;

  const parsed = registerBusinessSchema.safeParse({
    businessName: payload.businessName,
    phone: payload.phone ?? "",
    email: payload.email.trim().toLowerCase(),
    employerIdentificationNumber: payload.employerIdentificationNumber,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  try {
    await repoRegisterBusiness({
      businessName: parsed.data.businessName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      employerIdentificationNumber: parsed.data.employerIdentificationNumber,
      locale,
    });
  } catch (error: unknown) {
    throw mapRegisterBusinessError(error, locale);
  }

  return { success: true };
}

function mapRegisterBusinessError(error: unknown, locale: Locale): Error {
  const code = extractErrorMessage(error);

  switch (code) {
    case REGISTER_BUSINESS_ERROR.DUPLICATE_EMAIL:
      return new Error(
        translate(locale, "registerBusiness.errors.duplicateEmail"),
      );
    case REGISTER_BUSINESS_ERROR.DUPLICATE_EIN:
      return new Error(translate(locale, "registerBusiness.errors.duplicateEin"));
    case REGISTER_BUSINESS_ERROR.USER_CREATE_FAILED:
      return new Error(
        translate(locale, "registerBusiness.errors.userCreateFailed"),
      );
    case REGISTER_BUSINESS_ERROR.PROFILE_SAVE_FAILED:
      return new Error(
        translate(locale, "registerBusiness.errors.profileSaveFailed"),
      );
    default:
      if (isNetworkActionError(error)) {
        return new Error(translate(locale, "common.errors.network"));
      }
      return new Error(
        code.trim() || translate(locale, "registerBusiness.errors.generic"),
      );
  }
}

export async function getCurrentUserService() {
  return repoGetSessionUser();
}

/** Para mutaciones y guards: un fallo de red se propaga en vez de parecer "sin permisos". */
export async function getCurrentUserStrictService() {
  return repoGetSessionUser({ throwOnNetworkError: true });
}

export async function ensureAdminUserService() {
  const user = await getCurrentUserStrictService();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function logoutService() {
  await repoLogout();
  return { success: true };
}
