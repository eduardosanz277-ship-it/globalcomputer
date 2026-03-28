import Image from "next/image";
import { cn } from "@/utils/cn";

export const APP_LOGO_PATH = "/logos/logo.png";

type AppLogoProps = {
  className?: string;
  priority?: boolean;
  /** Cuadrado (sidebar admin colapsado) */
  variant?: "default" | "mark";
};

/**
 * Logo de marca (`public/logos/logo.png`).
 */
export function AppLogo({ className, priority, variant = "default" }: AppLogoProps) {
  if (variant === "mark") {
    return (
      <Image
        src={APP_LOGO_PATH}
        alt="Global Computers USA"
        width={56}
        height={56}
        className={cn("h-14 w-14 object-contain", className)}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={APP_LOGO_PATH}
      alt="Global Computers USA"
      width={360}
      height={90}
      className={cn(
        "h-14 w-auto max-h-[3.5rem] object-contain object-left sm:h-[4.25rem] sm:max-h-[4.5rem]",
        className,
      )}
      priority={priority}
      sizes="(max-width: 640px) 240px, 360px"
    />
  );
}
