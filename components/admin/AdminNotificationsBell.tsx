"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Mail, MailOpen } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useDropdownPresence } from "@/components/marketing/useDropdownPresence";
import { getContactNotificationsAdminAction } from "@/modules/admin/contact-messages/actions";
import {
  CONTACT_NOTIFICATIONS_REFRESH_EVENT,
  type ContactNotificationsPayload,
} from "@/modules/admin/contact-messages/contact-messages.types";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { cn } from "@/utils/cn";

const EMPTY_PAYLOAD: ContactNotificationsPayload = {
  unreadCount: 0,
  items: [],
};

function formatBadgeCount(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

export function AdminNotificationsBell() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] =
    useState<ContactNotificationsPayload>(EMPTY_PAYLOAD);
  const presence = useDropdownPresence(open);
  const rootRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  const panelMotionClass = cn(
    "transition duration-200 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
    presence.entered
      ? "translate-y-0 opacity-100"
      : "pointer-events-none -translate-y-1 opacity-0",
  );

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      const next = await getContactNotificationsAdminAction();
      if (requestId !== requestIdRef.current) return;
      setPayload(next);
    } catch {
      if (requestId !== requestIdRef.current) return;
      // Mantener el último valor conocido; no romper el header.
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, pathname]);

  useEffect(() => {
    function onFocus() {
      void refresh();
    }
    function onCustomRefresh() {
      void refresh();
    }
    window.addEventListener("focus", onFocus);
    window.addEventListener(
      CONTACT_NOTIFICATIONS_REFRESH_EVENT,
      onCustomRefresh,
    );
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(
        CONTACT_NOTIFICATIONS_REFRESH_EVENT,
        onCustomRefresh,
      );
    };
  }, [refresh]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    void refresh();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, refresh]);

  const unreadCount = payload.unreadCount;
  const hasUnread = unreadCount > 0;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={cn(
          "relative rounded-lg py-1.5 text-muted-foreground transition hover:text-foreground",
          open && "text-foreground",
        )}
        aria-label={t("admin.header.notifications")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {hasUnread ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white shadow-sm"
            aria-label={t("admin.header.notificationsBadge").replace(
              "{count}",
              String(unreadCount),
            )}
          >
            {formatBadgeCount(unreadCount)}
          </span>
        ) : null}
      </button>

      {presence.mounted ? (
        <>
          <button
            type="button"
            className={cn(
              "fixed inset-0 z-40 bg-black/25 md:hidden",
              presence.entered ? "opacity-100" : "opacity-0",
              "transition-opacity duration-200 motion-reduce:transition-none",
            )}
            aria-label={t("admin.header.notifications")}
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "z-50",
              /* Móvil: anclado al viewport para no salirse por la campana. */
              "fixed inset-x-3 top-[4.25rem]",
              /* Escritorio: dropdown relativo a la campana. */
              "md:absolute md:inset-x-auto md:right-0 md:top-full md:pt-1",
            )}
          >
            <div
              className={cn(
                "overflow-hidden border border-border bg-popover shadow-lg",
                "w-full rounded-xl md:w-[min(100vw-2rem,22rem)] md:rounded-lg md:shadow-md",
                panelMotionClass,
              )}
              role="dialog"
              aria-label={t("admin.header.notificationsPanelTitle")}
            >
              <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3 md:px-3 md:py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {t("admin.header.notificationsPanelTitle")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasUnread
                      ? t("admin.header.notificationsUnreadSummary").replace(
                          "{count}",
                          String(unreadCount),
                        )
                      : t("admin.header.notificationsAllCaughtUp")}
                  </p>
                </div>
                {hasUnread ? (
                  <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200/90 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                    {formatBadgeCount(unreadCount)}
                  </span>
                ) : null}
              </div>

              <div className="max-h-[min(22rem,calc(100dvh-11rem))] overflow-y-auto md:max-h-[min(24rem,70vh)]">
                {loading && payload.items.length === 0 ? (
                  <div className="space-y-2 px-3 py-3" aria-hidden>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="animate-pulse rounded-lg bg-muted/70 px-3 py-3"
                      >
                        <div className="h-3 w-2/3 rounded bg-muted-foreground/15" />
                        <div className="mt-2 h-2.5 w-1/2 rounded bg-muted-foreground/10" />
                      </div>
                    ))}
                  </div>
                ) : payload.items.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <MailOpen className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      {t("admin.header.notificationsEmptyTitle")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.header.notificationsEmptyDescription")}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/70 py-1">
                    {payload.items.map((item) => {
                      const relative = formatRelativeLastAccess(
                        item.createdAt,
                        locale,
                      );
                      return (
                        <li key={item.id}>
                          <Link
                            href={`/admin/contacts?message=${encodeURIComponent(item.id)}`}
                            className="flex gap-3 px-3 py-3.5 transition hover:bg-muted/70 md:py-3"
                            onClick={() => setOpen(false)}
                          >
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-800">
                              <Mail className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start justify-between gap-2">
                                <span className="line-clamp-2 text-sm font-semibold text-foreground md:truncate md:line-clamp-none">
                                  {item.subject}
                                </span>
                                <span
                                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500"
                                  aria-hidden
                                />
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {item.name}
                                {item.email ? ` · ${item.email}` : ""}
                              </span>
                              {relative ? (
                                <span className="mt-1 block text-[11px] text-muted-foreground/90">
                                  {relative}
                                </span>
                              ) : null}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="border-t border-border bg-muted/30 px-2 py-2">
                <Link
                  href="/admin/contacts"
                  className="flex w-full items-center justify-center rounded-md px-3 py-2.5 text-sm font-medium text-primary transition hover:bg-muted md:py-2"
                  onClick={() => setOpen(false)}
                >
                  {t("admin.header.notificationsViewAll")}
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
