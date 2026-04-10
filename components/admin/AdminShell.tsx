"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader, type AdminHeaderUser } from "./AdminHeader";
import { cn } from "@/utils/cn";

type Props = {
  user: AdminHeaderUser;
  children: React.ReactNode;
};

export function AdminShell({ user, children }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  return (
    <div className="relative h-dvh min-h-0 overflow-x-hidden overflow-y-hidden bg-background">
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          aria-label="Cerrar menú"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div
        className={cn(
          "flex h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden",
          "transition-[padding] duration-200 ease-out",
          collapsed ? "md:pl-[72px]" : "md:pl-[260px]",
        )}
      >
        <AdminHeader
          user={user}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
