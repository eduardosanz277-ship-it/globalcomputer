"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/utils/cn";

const DEFAULT_BANNER_ASPECT = 1024 / 432;

type Props = {
  src: string;
  className?: string;
};

export function ServiceHeroMobileImage({ src, className }: Props) {
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_BANNER_ASPECT);

  return (
    <div
      className={cn("relative w-full bg-white", className)}
      style={{ aspectRatio }}
    >
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="(max-width: 767px) 100vw, 0px"
        className="object-contain object-center"
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalWidth > 0 && naturalHeight > 0) {
            setAspectRatio(naturalWidth / naturalHeight);
          }
        }}
      />
    </div>
  );
}
