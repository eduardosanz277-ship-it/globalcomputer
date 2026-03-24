"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader, type AdminHeaderUser } from "./AdminHeader";

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
    <div className="flex h-screen min-h-0 overflow-hidden bg-[hsl(210_40%_96%)]">
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminHeader
          user={user}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <div className="min-h-0 min-w-0 w-full flex-1 overflow-auto px-4 py-4 sm:px-6 lg:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
