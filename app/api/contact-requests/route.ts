import { NextResponse } from "next/server";
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

  try {
    await createContactRequest(parsed.data);
    return NextResponse.json(
      { message: "Mensaje enviado correctamente" },
      { status: 201 },
    );
  } catch (error) {
    console.error("contact-requests POST error:", error);
    return NextResponse.json(
      { error: "No se pudo enviar el mensaje" },
      { status: 500 },
    );
  }
}
