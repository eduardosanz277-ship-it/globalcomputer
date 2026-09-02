import { NextResponse } from "next/server";
import { formatServerErrorMessage } from "@/lib/errors/format-server-error";
import { isNetworkActionError } from "@/lib/errors/network-action-error";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { contactRequestFormSchema } from "@/modules/site/contact-requests.schema";
import { createContactRequest } from "@/modules/site/contact-requests.service";

export async function POST(req: Request) {
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

  try {
    await createContactRequest(parsed.data);
    return NextResponse.json(
      { message: "Mensaje enviado correctamente" },
      { status: 201 },
    );
  } catch (error) {
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
