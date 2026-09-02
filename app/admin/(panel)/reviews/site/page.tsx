import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { listSiteReviewsAdminService } from "@/modules/admin/site-reviews/site-reviews.service";
import { AdminSiteReviewsTable } from "./AdminSiteReviewsTable";
import { SiteReviewsPageHeader } from "./SiteReviewsPageHeader";
import { SiteReviewsErrorState } from "./SiteReviewsErrorState";

function formatLoadError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return "";
}

async function SiteReviewsTableSection() {
  try {
    const reviews = await listSiteReviewsAdminService();
    return <AdminSiteReviewsTable reviews={reviews} />;
  } catch (error) {
    const message = formatLoadError(error);
    return <SiteReviewsErrorState message={message} />;
  }
}

export default async function AdminSiteReviewsPage() {
  const current = await getCurrentUserStrictService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <SiteReviewsPageHeader />

        <hr className="border-border" />

        <Suspense
          fallback={<AdminSiteReviewsTable reviews={[]} isLoading />}
        >
          <SiteReviewsTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
