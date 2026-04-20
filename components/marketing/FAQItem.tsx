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
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-background/90 shadow-sm transition-all duration-200",
        isOpen
          ? "border-primary/30 shadow-soft ring-1 ring-primary/15"
          : "border-border/60 hover:border-primary/25 hover:shadow-soft",
      )}
    >
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-controls={contentId}
          aria-expanded={isOpen}
          onClick={onToggle}
          className={cn(
            "group flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors sm:px-6",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-inset",
            isOpen ? "bg-primary/[0.04]" : "hover:bg-muted/40",
          )}
        >
          <span
            className={cn(
              "text-base font-semibold sm:text-lg",
              isOpen ? "text-primary" : "text-foreground",
            )}
          >
            {question}
          </span>
          <span
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition",
              isOpen
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border/70 bg-muted/50 text-muted-foreground group-hover:border-primary/20 group-hover:text-primary",
            )}
          >
            <ChevronDown
              className={cn(
                "h-4.5 w-4.5 transition-transform duration-300",
                isOpen && "rotate-180",
              )}
              aria-hidden
            />
          </span>
        </button>
      </h3>

      <div
        id={contentId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-70",
        )}
      >
        <div className="overflow-hidden">
          <p
            className={cn(
              "border-t border-border/50 bg-muted/30 px-5 pb-5 pt-3 text-sm leading-relaxed text-muted-foreground sm:px-6 sm:text-base",
              "transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-85",
            )}
          >
            {answer}
          </p>
        </div>
      </div>
    </article>
  );
}
