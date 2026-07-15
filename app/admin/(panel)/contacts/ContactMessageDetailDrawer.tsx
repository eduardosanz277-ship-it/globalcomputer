"use client";

import { Clock3, Mail, Phone } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { AdminDetailPanelItem } from "@/components/admin/admin-detail-panel-item";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import type { ContactMessageAdmin } from "@/modules/admin/contact-messages/contact-messages.types";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { useI18n } from "@/components/i18n/I18nProvider";

type Props = {
  message: ContactMessageAdmin | null;
  onClose: () => void;
};

export function ContactMessageDetailDrawer({ message, onClose }: Props) {
  const { t, locale } = useI18n();
  const open = Boolean(message);

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={t("admin.contacts.drawer.title")}
      description={t("admin.contacts.drawer.description")}
      contentAriaLabel={t("admin.contacts.drawer.ariaLabel")}
    >
      {message ? (
        <div className="space-y-4">
          <section className="space-y-3">
            <article className="rounded-xl border border-border/70 bg-card p-4">
              <div className="space-y-3">
                <p className="text-base font-semibold text-foreground">
                  {message.subject}
                </p>
                <p className="whitespace-pre-wrap break-words leading-relaxed text-foreground">
                  {message.message}
                </p>
              </div>
            </article>

            <AdminDetailPanelItem
              label={t("admin.contacts.drawer.contact")}
              labelClassName="inline-flex items-center gap-2 text-sm font-medium text-foreground"
              value={
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{message.name}</p>
                  <div className="space-y-1">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" aria-hidden />
                      <p className="break-all">{message.email}</p>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" aria-hidden />
                      <p>
                        {message.phone?.trim() ? (
                          message.phone
                        ) : (
                          <AdminTableEmptyEmDash />
                        )}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                      message.isRead
                        ? "border border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:text-emerald-200"
                        : "border border-amber-200/90 bg-amber-50 text-amber-900"
                    }`}
                  >
                    {message.isRead
                      ? t("admin.contacts.status.read")
                      : t("admin.contacts.status.unread")}
                  </p>
                </div>
              }
            />

            <AdminDetailPanelItem
              label={t("admin.contacts.drawer.metadata")}
              labelClassName="inline-flex items-center gap-2 text-sm font-medium text-foreground"
              value={
                <p className="inline-flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="h-4 w-4" aria-hidden />
                  {formatDateDdMmYyyyHhMm(message.createdAt, locale).replace(
                    ", ",
                    " ",
                  )}
                </p>
              }
            />
          </section>
        </div>
      ) : null}
    </SlideOver>
  );
}
