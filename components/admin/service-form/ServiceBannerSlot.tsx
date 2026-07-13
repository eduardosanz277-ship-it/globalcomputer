"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import type { ServiceBannerBreakpoint } from "./types";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 5;

type Props = {
  breakpoint: ServiceBannerBreakpoint;
  existingUrl: string | null;
  file: File | null;
  markedForRemoval: boolean;
  disabled?: boolean;
  className?: string;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
};

const BANNER_PREVIEW_ASPECT = "md:aspect-[1024/432]";

export function ServiceBannerSlot({
  breakpoint,
  existingUrl,
  file,
  markedForRemoval,
  disabled = false,
  className,
  onFileChange,
  onRemove,
}: Props) {
  const { t } = useI18n();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const displayUrl =
    previewUrl ?? (markedForRemoval ? null : existingUrl?.trim() || null);
  const hasImage = Boolean(displayUrl);

  const labelKey =
    breakpoint === "mobile"
      ? "admin.services.form.banners.mobile"
      : breakpoint === "tablet"
        ? "admin.services.form.banners.tablet"
        : "admin.services.form.banners.desktop";

  const hintKey =
    breakpoint === "mobile"
      ? "admin.services.form.banners.mobileHint"
      : breakpoint === "tablet"
        ? "admin.services.form.banners.tabletHint"
        : "admin.services.form.banners.desktopHint";

  const validateAndSet = (next: File | null) => {
    setFeedback("");
    if (!next) {
      onFileChange(null);
      return;
    }
    const typeOk = ACCEPTED.includes(next.type);
    const sizeOk = next.size <= MAX_MB * 1024 * 1024;
    if (!typeOk || !sizeOk) {
      setFeedback(t("admin.services.form.banners.invalidFile"));
      return;
    }
    onFileChange(next);
  };

  const openFilePicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleFiles = (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;
    validateAndSet(fileList[0] ?? null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="hidden space-y-0.5 md:block">
        <Label htmlFor={inputId}>{t(labelKey)}</Label>
        <p className="text-xs text-muted-foreground">{t(hintKey)}</p>
      </div>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={
          hasImage
            ? t("admin.services.form.banners.replaceAria")
            : t("admin.services.form.banners.uploadAria")
        }
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFilePicker();
          }
        }}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragActive(false);
          handleFiles(e.dataTransfer.files ?? []);
        }}
        className={cn(
          "group relative flex h-[140px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/30 text-center transition-all md:h-auto",
          BANNER_PREVIEW_ASPECT,
          "hover:border-foreground/40 hover:bg-muted/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          hasImage && "border-solid border-border/70 bg-card shadow-sm",
          isDragActive && "border-foreground/60 bg-muted/50 shadow-inner",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <span className="absolute left-2 top-2 z-10 max-w-[calc(100%-2.5rem)] truncate rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white md:hidden">
          {t(labelKey)}
        </span>

        {hasImage ? (
          <>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayUrl!}
                alt={t(labelKey)}
                className="absolute inset-0 h-full w-full object-cover md:object-contain"
              />
            ) : (
              <Image
                src={displayUrl!}
                alt={t(labelKey)}
                fill
                unoptimized
                sizes="(max-width: 768px) 12rem, 400px"
                className="object-cover md:object-contain"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-3 text-muted-foreground md:gap-2 md:px-4">
            <ImagePlus className="h-8 w-8 transition-colors group-hover:text-foreground md:h-10 md:w-10" />
            <p className="text-xs font-medium text-foreground md:text-sm">
              {t("admin.services.form.dropzone.title")}
            </p>
            <p className="hidden text-xs text-muted-foreground md:block">
              {t("admin.services.form.dropzone.hintPrefix")} {MAX_MB}MB
            </p>
          </div>
        )}

        {hasImage ? (
          <div className="absolute right-2 top-2 z-10">
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-7 w-7"
              disabled={disabled}
              aria-label={t("admin.services.form.banners.removeAria")}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
                if (inputRef.current) inputRef.current.value = "";
                setFeedback("");
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        ) : null}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED.join(",")}
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files ?? []);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {feedback ? (
        <p className="text-xs text-destructive" role="alert">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
