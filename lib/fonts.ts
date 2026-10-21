import { Inter } from "next/font/google";

/**
 * Inter compartida por páginas y componentes de la tienda: una sola instancia
 * (antes cada archivo creaba la suya y se repetían las reglas `@font-face`).
 */
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
