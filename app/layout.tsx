import "./globals.css";
import type { Metadata } from "next";
import "./globals.css";
import "sweetalert2/dist/sweetalert2.min.css";
import { DM_Sans, Outfit, Roboto } from "next/font/google";
import { ScrollToTopOnPathname } from "@/components/ScrollToTopOnPathname";
import { ConditionalSiteHeader } from "@/components/marketing/ConditionalSiteHeader";
import { ConditionalSiteFooter } from "@/components/marketing/ConditionalSiteFooter";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontDisplay = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const fontRoboto = Roboto({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-roboto",
  display: "swap",
});
export const metadata: Metadata = {
  title: {
    default: "Global Computers USA",
    template: "%s | Global Computers USA",
  },
  description: "Cámaras de Seguridad, Software y Tecnología",
  icons: {
    icon: "/logos/logo.png",
    shortcut: "/logos/logo.png",
    apple: "/logos/logo.png",
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUserService();

  return (
    <html
      lang="es"
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontRoboto.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ScrollToTopOnPathname />
        <ConditionalSiteHeader user={user} />
        <main className="flex-1">{children}</main>
        <ConditionalSiteFooter />
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  );
}
