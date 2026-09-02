"use server";

import { registerService } from "@/modules/auth/auth.service";
import { RegisterSchema } from "@/modules/auth/auth.schema";

export async function registerAction(values: RegisterSchema, locale?: string) {
  await registerService(values, locale);
}
