import { NextResponse } from "next/server";
import { getNavigationData } from "@/modules/navigation/navigation.service";

/** Evita que Next cachee una respuesta vacía o antigua del catálogo. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getNavigationData();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/navigation]", e);
    return NextResponse.json(
      { error: "No se pudo cargar la navegación" },
      { status: 500 },
    );
  }
}
