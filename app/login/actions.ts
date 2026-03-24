"use server";

import {
  sendLoginOtpService,
  verifyLoginOtpService,
} from "@/modules/auth/auth.service";

export async function sendLoginOtpAction(email: string) {
  await sendLoginOtpService(email);
}

export async function verifyLoginOtpAction(email: string, code: string) {
  await verifyLoginOtpService(email, code);
}
