import { cn } from "@/utils/cn";

type HomeSectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  /** Clases extra para el título (p. ej. tamaño expresivo en home) */
  titleClassName?: string;
  /** Clases extra para la descripción. */
  descriptionClassName?: string;
};

export function HomeSectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  titleClassName,
  descriptionClassName,
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary sm:text-sm">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-display text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl sm:leading-tight",
          eyebrow && "mt-3",
          !eyebrow && "mt-0",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base",
            descriptionClassName,
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
