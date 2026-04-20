"use client";

import { useMemo, useState } from "react";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { FAQItem } from "./FAQItem";

type FaqItemData = {
  id: string;
  question: string;
  answer: string;
};

type Props = {
  items: FaqItemData[];
};

export function FAQSection({ items }: Props) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  const normalizedItems = useMemo(
    () =>
      items.filter(
        (item) => item.question.trim().length > 0 && item.answer.trim().length > 0,
      ),
    [items],
  );

  if (normalizedItems.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border/60 bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <HomeSectionHeading
          title="Preguntas frecuentes"
          description="Aquí respondemos las dudas más comunes para ayudarte a elegir y comprar con confianza."
          titleClassName="text-3xl sm:text-4xl"
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
    </section>
  );
}
