import { cn } from "@/utils/cn";

type HomeSectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function HomeSectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: HomeSectionHeadingProps) {
  return (
    <div
      className={cn(
        align === "center" && "mx-auto max-w-2xl text-center",
        align === "left" && "max-w-2xl",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:text-sm">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
          eyebrow && "mt-2",
          !eyebrow && "mt-0",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
