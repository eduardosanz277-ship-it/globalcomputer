import { NextResponse } from "next/server";
import { formatServerErrorMessage } from "@/lib/errors/format-server-error";
import { isNetworkActionError } from "@/lib/errors/network-action-error";
import { isSameOriginFormRequest } from "@/lib/http/same-origin";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { translate } from "@/lib/i18n/get-translation";
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

  if (isContactHoneypotFilled(parsed.data[CONTACT_HONEYPOT_FIELD])) {
    return NextResponse.json(
      { message: "Mensaje enviado correctamente" },
      { status: 201 },
    );
  }

  try {
    await enforceContactRequestRateLimit(req, parsed.data.email);
    await createContactRequest(parsed.data);
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
