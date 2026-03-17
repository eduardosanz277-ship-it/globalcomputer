import { loginSchema, registerSchema } from "./auth.schema";
import { AuthCredentials, RegisterPayload } from "./auth.types";
import {
  repoGetSessionUser,
  repoLogin,
  repoLogout,
  repoRegister,
} from "./auth.repository";

export async function loginService(payload: AuthCredentials) {
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  await repoLogin(parsed.data);
  return { success: true };
}

export async function registerService(payload: RegisterPayload) {
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  await repoRegister(parsed.data);
  return { success: true };
}

export async function getCurrentUserService() {
  return repoGetSessionUser();
}

export async function logoutService() {
  await repoLogout();
  return { success: true };
}

