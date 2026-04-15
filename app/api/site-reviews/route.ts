import { NextResponse } from "next/server";
import { createSiteReview } from "@/modules/site/site-reviews.service";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { siteReviewFormSchema } from "@/modules/site/site-reviews.schema";

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

  const parseResult = siteReviewFormSchema.safeParse(payload);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Datos no válidos para la reseña." },
      { status: 400 },
    );
  }

  /** Sesión opcional: invitados envían `user_id` null; si hay login, se asocia la reseña. */
  const user = await getCurrentUserService();

  try {
    await createSiteReview(parseResult.data, user?.id ?? null);
    return NextResponse.json({ message: "Reseña enviada." }, { status: 201 });
  } catch (error) {
    console.error("site-reviews POST error:", error);
    return NextResponse.json(
      { error: "No se pudo guardar la reseña." },
      { status: 500 },
    );
  }
}
