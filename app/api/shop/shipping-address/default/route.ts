import { NextResponse } from "next/server";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { repoGetDefaultShippingAddressForUser } from "@/modules/commerce/checkout-address.repository";

export const dynamic = "force-dynamic";

/**
 * Dirección de envío preferida del usuario autenticado (para prellenar cotización manual).
 */
export async function GET() {
  try {
    const user = await getCurrentUserService();
    if (!user?.id) {
      return NextResponse.json({ address: null });
    }

    const row = await repoGetDefaultShippingAddressForUser(user.id);
    if (!row) {
      return NextResponse.json({
        address: null,
        profile: {
          fullName: user.fullName ?? "",
          email: user.email ?? "",
        },
      });
    }

    const name = [row.first_name, row.last_name]
      .map((p) => (p ?? "").trim())
      .filter(Boolean)
      .join(" ");

    return NextResponse.json({
      address: {
        recipientName: name || user.fullName || "",
        recipientPhone: row.phone ?? "",
        recipientEmail: user.email ?? "",
        addressLine: row.street ?? "",
        addressLine2: row.apartment ?? "",
        city: row.city ?? "",
        state: row.state ?? "",
        postalCode: row.postal_code ?? "",
        country: row.country ?? "US",
      },
      profile: {
        fullName: user.fullName ?? "",
        email: user.email ?? "",
      },
    });
  } catch (error) {
    console.error("shop/shipping-address/default GET", error);
    return NextResponse.json({ address: null });
  }
}
