import { NextResponse } from "next/server";
import { formatServerErrorMessage } from "@/lib/errors/format-server-error";
import { isNetworkActionError } from "@/lib/errors/network-action-error";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { createSiteReview } from "@/modules/site/site-reviews.service";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { siteReviewFormSchema } from "@/modules/site/site-reviews.schema";

export async function POST(req: Request) {
  const locale = await getServerLocale();
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
    const network = isNetworkActionError(error);
    return NextResponse.json(
      {
        error: formatServerErrorMessage(
          error,
          locale,
          "storefront.productDetail.reviewFormError",
        ),
        ...(network ? { code: "NETWORK" as const } : {}),
      },
      { status: network ? 503 : 500 },
    );
  }
}
