import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { listContactMessagesAdminService } from "@/modules/admin/contact-messages/contact-messages.service";
import { AdminContactsTable } from "./AdminContactsTable";
import { ContactsErrorState } from "./ContactsErrorState";
import { ContactsPageHeader } from "./ContactsPageHeader";

function formatAdminContactsError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return "";
}

async function AdminContactsTableSection() {
  try {
    const messages = await listContactMessagesAdminService();
    return <AdminContactsTable messages={messages} />;
  } catch (error) {
    const message = formatAdminContactsError(error);
    return <ContactsErrorState message={message} />;
  }
}

export default async function AdminContactsPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <ContactsPageHeader />

        <hr className="border-border" />

        <Suspense fallback={<AdminContactsTable messages={[]} isLoading />}>
          <AdminContactsTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
