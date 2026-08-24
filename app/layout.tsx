import "./globals.css";
import type { Metadata } from "next";
import "./globals.css";
import "sweetalert2/dist/sweetalert2.min.css";
import { Inter, Outfit, Roboto } from "next/font/google";
import { ScrollToTopOnPathname } from "@/components/ScrollToTopOnPathname";
import { AppLoadingListener } from "@/components/AppLoadingListener";
import { ConditionalSiteHeader } from "@/components/marketing/ConditionalSiteHeader";
import { ConditionalSiteFooter } from "@/components/marketing/ConditionalSiteFooter";
import { HomeBackToTopButton } from "@/components/marketing/HomeBackToTopButton";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { LoginSuccessToast } from "@/components/auth/LoginSuccessToast";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { getPublicSiteContact } from "@/lib/site-contact.server";
import { type ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const fontSans = Inter({
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

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, contact, locale] = await Promise.all([
    getCurrentUserService(),
    getPublicSiteContact(),
    getServerLocale(),
  ]);

  return (
    <html
      lang={locale}
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontRoboto.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <I18nProvider initialLocale={locale}>
          <AppLoadingListener />
          <ScrollToTopOnPathname />
          <ConditionalSiteHeader user={user} />
          <main className="relative isolate z-0 flex-1">{children}</main>
          <ConditionalSiteFooter contact={contact} />
          <HomeBackToTopButton />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            pauseOnHover
            pauseOnFocusLoss
            newestOnTop
            closeOnClick
            draggable
            style={{ zIndex: 10000 }}
            toastClassName="pointer-events-auto"
          />
          <LoginSuccessToast />
        </I18nProvider>
      </body>
    </html>
  );
}
