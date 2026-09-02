import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { listProductReviewsAdminService } from "@/modules/admin/product-reviews/product-reviews.service";
import { AdminProductReviewsTable } from "./AdminProductReviewsTable";
import { ProductReviewsPageHeader } from "./ProductReviewsPageHeader";
import { ProductReviewsErrorState } from "./ProductReviewsErrorState";

function formatLoadError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return "";
}

async function ProductReviewsTableSection() {
  try {
    const reviews = await listProductReviewsAdminService();
    return <AdminProductReviewsTable reviews={reviews} />;
  } catch (error) {
    const message = formatLoadError(error);
    return <ProductReviewsErrorState message={message} />;
  }
}

export default async function AdminProductReviewsPage() {
  const current = await getCurrentUserStrictService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <ProductReviewsPageHeader />

        <hr className="border-border" />

        <Suspense
          fallback={<AdminProductReviewsTable reviews={[]} isLoading />}
        >
          <ProductReviewsTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
