import { NextResponse } from "next/server";
import { z } from "zod";
import { createSiteReview } from "@/modules/site/site-reviews.service";
import { getCurrentUserService } from "@/modules/auth/auth.service";

const createReviewSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1200),
});

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

  const parseResult = createReviewSchema.safeParse(payload);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Datos no válidos para la reseña." },
      { status: 400 },
    );
  }

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
