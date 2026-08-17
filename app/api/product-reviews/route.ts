import { NextResponse } from "next/server";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { createProductReviewFormSchema } from "@/modules/site/product-reviews.schema";
import { createProductReview } from "@/modules/site/product-reviews.service";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { translate } from "@/lib/i18n/get-translation";

export async function POST(req: Request) {
  const locale = await getServerLocale();
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: translate(locale, "storefront.productDetail.reviewApiInvalidJson") },
      { status: 400 },
    );
  }

  const parseResult = createProductReviewFormSchema(locale).safeParse(payload);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: translate(locale, "storefront.productDetail.reviewApiInvalidData") },
      { status: 400 },
    );
  }

  const user = await getCurrentUserService();

  try {
    await createProductReview(parseResult.data, user?.id ?? null);
    return NextResponse.json(
      { message: translate(locale, "storefront.productDetail.reviewFormSuccess") },
      { status: 201 },
    );
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";

    if (code === "23505") {
      return NextResponse.json(
        {
          error: translate(locale, "storefront.productDetail.reviewApiDuplicate"),
        },
        { status: 409 },
      );
    }

    console.error("product-reviews POST error:", error);
    return NextResponse.json(
      { error: translate(locale, "storefront.productDetail.reviewApiSaveError") },
      { status: 500 },
    );
  }
}
