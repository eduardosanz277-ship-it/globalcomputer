import { NextResponse } from "next/server";
import { formatServerErrorMessage } from "@/lib/errors/format-server-error";
import { isNetworkActionError } from "@/lib/errors/network-action-error";
import { isSameOriginFormRequest } from "@/lib/http/same-origin";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { translate } from "@/lib/i18n/get-translation";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  CONTACT_HONEYPOT_FIELD,
  contactRequestFormSchema,
  isContactHoneypotFilled,
} from "@/modules/site/contact-requests.schema";
import {
  ContactRateLimitError,
  enforceContactRequestRateLimit,
  recordContactRequestSubmission,
} from "@/modules/site/contact-request-rate-limit";
import { createContactRequest } from "@/modules/site/contact-requests.service";

export async function POST(req: Request) {
  if (!isSameOriginFormRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud debe ser JSON válido." },
      { status: 400 },
    );
  }

  const parsed = contactRequestFormSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos no válidos para la solicitud de contacto." },
      { status: 400 },
    );
  }

  const locale = await getServerLocale();

  // Verificación Cloudflare Turnstile
  const turnstileToken =
    typeof (payload as Record<string, unknown>)?.cf_turnstile_response === "string"
      ? ((payload as Record<string, unknown>).cf_turnstile_response as string)
      : null;
  const remoteIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined;
  const turnstile = await verifyTurnstileToken(turnstileToken, remoteIp);
  if (!turnstile.success) {
    return NextResponse.json(
      {
        error: translate(locale, "contactPage.errors.turnstileFailed"),
        code: "TURNSTILE" as const,
      },
      { status: 400 },
    );
  }

  try {
    const honeypotFilled = isContactHoneypotFilled(
      parsed.data[CONTACT_HONEYPOT_FIELD],
    );
    if (honeypotFilled) {
      console.warn(
        "[contact] honeypot filled; marking message as possible spam but keeping it for review.",
      );
    }
    await enforceContactRequestRateLimit(req, parsed.data.email);
    await createContactRequest(parsed.data, {
      isSpam: honeypotFilled,
      spamReason: honeypotFilled ? "honeypot" : undefined,
    });
    await recordContactRequestSubmission(req, parsed.data.email);
    return NextResponse.json(
      { message: "Mensaje enviado correctamente" },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ContactRateLimitError) {
      return NextResponse.json(
        {
          error: translate(locale, "contactPage.errors.rateLimit"),
          code: "RATE_LIMIT" as const,
        },
        { status: 429 },
      );
    }
    console.error("contact-requests POST error:", error);
    const network = isNetworkActionError(error);
    return NextResponse.json(
      {
        error: formatServerErrorMessage(error, locale, "contactPage.toastError"),
        ...(network ? { code: "NETWORK" as const } : {}),
      },
      { status: network ? 503 : 500 },
    );
  }
}
