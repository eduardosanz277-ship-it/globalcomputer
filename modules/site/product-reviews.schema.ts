import { z } from "zod";
import type { Locale } from "@/components/i18n/translations";
import { translate } from "@/lib/i18n/get-translation";

function reviewCopy(locale: Locale) {
  return {
    emailInvalid: translate(locale, "storefront.productDetail.reviewEmailInvalid"),
    productInvalid: translate(locale, "storefront.productDetail.reviewProductInvalid"),
    nameRequired: translate(locale, "storefront.productDetail.reviewNameRequired"),
    nameMin: translate(locale, "storefront.productDetail.reviewNameMin"),
    nameMax: translate(locale, "storefront.productDetail.reviewNameMax"),
    ratingRequired: translate(locale, "storefront.productDetail.reviewRatingRequired"),
    ratingInvalid: translate(locale, "storefront.productDetail.reviewRatingInvalid"),
    ratingRange: translate(locale, "storefront.productDetail.reviewRatingRange"),
    commentRequired: translate(locale, "storefront.productDetail.reviewCommentRequired"),
    commentMax: translate(locale, "storefront.productDetail.reviewCommentMax"),
  };
}

export function createProductReviewFormSchema(locale: Locale = "es") {
  const t = reviewCopy(locale);
  const optionalEmail = z.preprocess((val) => {
    if (typeof val !== "string") return undefined;
    const trimmed = val.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().email(t.emailInvalid).optional());

  return z.object({
    productId: z.string().uuid(t.productInvalid),
    name: z
      .string()
      .trim()
      .min(1, t.nameRequired)
      .min(2, t.nameMin)
      .max(120, t.nameMax),
    email: optionalEmail,
    rating: z
      .number({
        required_error: t.ratingRequired,
        invalid_type_error: t.ratingInvalid,
      })
      .int()
      .min(1, t.ratingRange)
      .max(5, t.ratingRange),
    comment: z
      .string()
      .trim()
      .min(1, t.commentRequired)
      .max(1200, t.commentMax),
  });
}

export const productReviewFormSchema = createProductReviewFormSchema("es");

export type ProductReviewFormValues = z.infer<typeof productReviewFormSchema>;
