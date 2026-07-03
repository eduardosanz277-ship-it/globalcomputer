"use client";

import { useMemo, useState } from "react";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { landingSectionPaddingYClass } from "@/components/marketing/landing-section-classes";
import { FAQItem } from "./FAQItem";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";

type FaqItemData = {
  id: string;
  question: string;
  answer: string;
  questionEn: string;
  answerEn: string;
};

type Props = {
  items: FaqItemData[];
};

export function FAQSection({ items }: Props) {
  const { locale, t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  const normalizedItems = useMemo(
    () =>
      items
        .map((item) => {
          const question = locale === "en" ? item.questionEn || item.question : item.question;
          const answer = locale === "en" ? item.answerEn || item.answer : item.answer;
          return {
            ...item,
            question,
            answer,
          };
        })
        .filter(
          (item) => item.question.trim().length > 0 && item.answer.trim().length > 0,
        ),
    [items, locale],
  );

  if (normalizedItems.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "border-t border-border/60 bg-muted/70",
        landingSectionPaddingYClass,
      )}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-soft backdrop-blur-sm sm:p-8 lg:p-10">
          <HomeSectionHeading
            title={t("home.faq.title")}
            description={t("home.faq.description")}
            titleClassName="text-3xl sm:text-4xl"
            descriptionClassName="max-w-2xl"
          />

          <div className="mt-8 space-y-3 sm:mt-10">
            {normalizedItems.map((item) => {
              const isOpen = openId === item.id;
              return (
                <FAQItem
                  key={item.id}
                  id={`faq-${item.id}`}
                  question={item.question}
                  answer={item.answer}
                  isOpen={isOpen}
                  onToggle={() => setOpenId(isOpen ? null : item.id)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
