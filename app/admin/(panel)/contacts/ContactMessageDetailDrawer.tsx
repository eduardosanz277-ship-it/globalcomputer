"use client";

import type { ReactNode } from "react";
import { Clock3, Mail, Phone } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import type { ContactMessageAdmin } from "@/modules/admin/contact-messages/contact-messages.types";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { useI18n } from "@/components/i18n/I18nProvider";

type Props = {
  message: ContactMessageAdmin | null;
  onClose: () => void;
};

function DetailItem({
  label,
  value,
  icon,
  labelClassName,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  labelClassName?: string;
}) {
  return (
    <article className="rounded-xl border border-border/70 bg-card p-4">
      <p
        className={labelClassName ?? "inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"}
      >
        {icon ? <span>{icon}</span> : null}
        {label}
      </p>
      <div className="mt-2 text-sm text-foreground">{value}</div>
    </article>
  );
}

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

            <DetailItem
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
                </div>
              }
            />

            <DetailItem
              label={t("admin.contacts.drawer.metadata")}
              labelClassName="inline-flex items-center gap-2 text-sm font-medium text-foreground"
              value={
                <p className="inline-flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="h-4 w-4" aria-hidden />
                  {formatDateDdMmYyyyHhMm(message.createdAt, locale).replace(", ", " ")}
                </p>
              }
            />
          </section>
        </div>
      ) : null}
    </SlideOver>
  );
}
