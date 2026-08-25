"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type NavBadgesContextValue = {
  badges: Record<string, number>;
  setBadge: (href: string, count: number) => void;
  decrementBadge: (href: string, by?: number) => void;
};

const NavBadgesContext = createContext<NavBadgesContextValue | null>(null);

export function NavBadgesProvider({
  initialBadges,
  children,
}: {
  initialBadges?: Record<string, number>;
  children: React.ReactNode;
}) {
  const [badges, setBadges] = useState<Record<string, number>>(
    initialBadges ?? {},
  );

  const setBadge = useCallback((href: string, count: number) => {
    setBadges((prev) => ({ ...prev, [href]: Math.max(0, count) }));
  }, []);

  const decrementBadge = useCallback((href: string, by = 1) => {
    setBadges((prev) => ({
      ...prev,
      [href]: Math.max(0, (prev[href] ?? 0) - by),
    }));
  }, []);

  const value = useMemo(
    () => ({ badges, setBadge, decrementBadge }),
    [badges, setBadge, decrementBadge],
  );

  return (
    <NavBadgesContext.Provider value={value}>
      {children}
    </NavBadgesContext.Provider>
  );
}

export function useNavBadges() {
  const ctx = useContext(NavBadgesContext);
  if (!ctx) throw new Error("useNavBadges must be used within NavBadgesProvider");
  return ctx;
}
