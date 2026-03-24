"use server";

import type { RegisterBusinessFormInput } from "@/modules/auth/auth.schema";
import { registerBusinessService } from "@/modules/auth/auth.service";

export async function registerBusinessAction(values: RegisterBusinessFormInput) {
  await registerBusinessService(values);
}
