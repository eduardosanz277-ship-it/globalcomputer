"use server";

import { loginService } from "@/modules/auth/auth.service";
import { LoginSchema } from "@/modules/auth/auth.schema";

export async function loginAction(values: LoginSchema) {
  await loginService(values);
}
