import Image from "next/image";
import { SITE_BRAND_NAME } from "@/lib/site";
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
        alt={SITE_BRAND_NAME}
        width={56}
        height={56}
        className={cn("h-14 w-14 object-contain", className)}
        priority={priority}
      />
    );
  }

  // width/height con la proporción real del archivo (254x320) para reservar el hueco
  // correcto; se muestra a <=76px de alto (~60px de ancho).
  return (
    <Image
      src={APP_LOGO_PATH}
      alt={SITE_BRAND_NAME}
      width={254}
      height={320}
      className={cn(
        "h-14 w-auto max-h-[3.5rem] object-contain object-left sm:h-[4.25rem] sm:max-h-[4.5rem]",
        className,
      )}
      priority={priority}
      sizes="64px"
    />
  );
}
