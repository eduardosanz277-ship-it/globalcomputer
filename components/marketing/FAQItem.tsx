"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

type Props = {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
};

export function FAQItem({ id, question, answer, isOpen, onToggle }: Props) {
  const contentId = `${id}-content`;
  const buttonId = `${id}-trigger`;

  return (
    <article className="rounded-2xl border border-border/60 bg-card shadow-soft">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-controls={contentId}
          aria-expanded={isOpen}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/35 sm:px-6"
        >
          <span className="text-base font-semibold text-foreground sm:text-lg">
            {question}
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180 text-primary",
            )}
            aria-hidden
          />
        </button>
      </h3>

      <div
        id={contentId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-70",
        )}
      >
        <div className="overflow-hidden">
          <p className="border-t border-border/50 px-5 pb-5 pt-3 text-sm leading-relaxed text-muted-foreground sm:px-6 sm:text-base">
            {answer}
          </p>
        </div>
      </div>
    </article>
  );
}
