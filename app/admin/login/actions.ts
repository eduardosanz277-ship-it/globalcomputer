"use server";

import type { LoginSchema } from "@/modules/auth/auth.schema";
import { adminPasswordLoginService } from "@/modules/auth/auth.service";

export async function adminLoginAction(values: LoginSchema) {
  return adminPasswordLoginService(values);
}
