import { NextResponse } from "next/server";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { productReviewFormSchema } from "@/modules/site/product-reviews.schema";
import { createProductReview } from "@/modules/site/product-reviews.service";

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

  const parseResult = productReviewFormSchema.safeParse(payload);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Datos no válidos para la reseña del producto." },
      { status: 400 },
    );
  }

  const user = await getCurrentUserService();

  try {
    await createProductReview(parseResult.data, user?.id ?? null);
    return NextResponse.json({ message: "Reseña enviada." }, { status: 201 });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";

    if (code === "23505") {
      return NextResponse.json(
        {
          error:
            "Ya has publicado una reseña para este producto. Puedes actualizarla más adelante.",
        },
        { status: 409 },
      );
    }

    console.error("product-reviews POST error:", error);
    return NextResponse.json(
      { error: "No se pudo guardar la reseña." },
      { status: 500 },
    );
  }
}
