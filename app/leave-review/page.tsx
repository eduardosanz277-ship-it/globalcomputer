import { Inter } from "next/font/google";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { LeaveReviewPageClient } from "@/components/site/LeaveReviewPageClient";
import {
  listProductReviewsForLeaveReviewPage,
  listSiteReviewsForLeaveReviewPage,
} from "@/modules/site/leave-review-data.service";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const revalidate = 0;

export default async function LeaveReviewPage() {
  const [productReviews, siteReviews] = await Promise.all([
    listProductReviewsForLeaveReviewPage(),
    listSiteReviewsForLeaveReviewPage(),
  ]);

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <MarketingBreadcrumb
            items={[{ label: "Inicio", href: "/" }, { label: "Reseñas" }]}
            className={inter.className}
          />
          <div className="mt-4">
            <HomeSectionHeading
              align="left"
              className="max-w-none"
              title="Reseñas"
              description="Descubre lo que opinan nuestros clientes sobre los productos y la experiencia de compra en nuestra tienda."
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
              descriptionClassName={`${inter.className} mt-1 w-full max-w-none text-[15px] font-normal text-muted-foreground sm:text-base`}
            />
          </div>
        </div>
      </div>
      <div className="mt-6">
        <LeaveReviewPageClient
          initialProductReviews={productReviews}
          initialSiteReviews={siteReviews}
        />
      </div>
    </main>
  );
}
