/**
 * Verificación server-side del token de Cloudflare Turnstile.
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteip?: string,
): Promise<{ success: boolean; errorCodes?: string[] }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.error("[turnstile] TURNSTILE_SECRET_KEY no está configurado.");
    return { success: false, errorCodes: ["missing-secret"] };
  }

  // Token vacío o ausente → fallo inmediato sin llamar a Cloudflare
  if (!token) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteip) body.set("remoteip", remoteip);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const json = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    return {
      success: json.success === true,
      errorCodes: json["error-codes"],
    };
  } catch (err) {
    console.error("[turnstile] Error al verificar el token:", err);
    return { success: false, errorCodes: ["network-error"] };
  }
}
