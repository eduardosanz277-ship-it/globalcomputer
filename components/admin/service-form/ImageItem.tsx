"use client";

import Image from "next/image";
import { GripVertical, Star, X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import type { ServiceImageItem } from "./types";
import { useI18n } from "@/components/i18n/I18nProvider";

type ImageItemProps = {
  item: ServiceImageItem;
  index: number;
  onRemove: (key: string) => void;
  onSetPrimary: (key: string) => void;
  onMoveUp: (key: string) => void;
  onMoveDown: (key: string) => void;
  isFirst: boolean;
  isLast: boolean;
  className?: string;
};

export function ImageItem({
  item,
  index,
  onRemove,
  onSetPrimary,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  className,
}: ImageItemProps) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.key });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm",
        "h-[140px] w-full",
        isDragging && "z-20 shadow-lg ring-2 ring-ring/30",
        className,
      )}
    >
      <Image
        src={item.url}
        alt={`${t("admin.services.form.media.imageAlt")} ${index + 1}`}
        fill
        sizes="(max-width: 639px) min(100vw, 28rem), (max-width: 1023px) 45vw, 220px"
        className="object-cover"
      />

      <div className="absolute left-2 top-2 flex max-w-[calc(100%-5rem)] flex-col gap-1">
        <span className="w-fit rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
          #{index + 1}
        </span>
        <span className="w-fit rounded-md bg-black/55 px-2 py-0.5 text-[10px] text-white">
          {item.source === "new"
            ? t("admin.services.form.media.imageSourceNew")
            : t("admin.services.form.media.imageSourceExisting")}
        </span>
      </div>

      <div className="absolute right-2 top-2 flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className={cn(
            "h-7 w-7 border-0 bg-black text-amber-50 shadow-sm",
            "hover:bg-black/90 hover:text-amber-50",
            item.isPrimary && "ring-1 ring-amber-400/70"
          )}
          onClick={() => onSetPrimary(item.key)}
          aria-label={t("admin.services.form.media.markPrimaryAria")}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              item.isPrimary ? "fill-amber-400 text-amber-400" : "text-white"
            )}
            aria-hidden
          />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="h-7 w-7"
          onClick={() => onRemove(item.key)}
          aria-label={t("admin.services.form.media.removeImageAria")}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-7 w-7 bg-background/85 backdrop-blur"
              aria-label={t("admin.services.form.media.dragReorderAria")}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3.5 w-3.5 text-foreground" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-center">
            {t("admin.services.form.media.dragHint")}
          </TooltipContent>
        </Tooltip>
        <div className="flex items-center gap-1 rounded-md bg-background/75 p-1 backdrop-blur">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[11px]"
            disabled={isFirst}
            onClick={() => onMoveUp(item.key)}
            aria-label={t("admin.services.form.media.moveUpAria")}
          >
            {t("admin.services.form.media.moveUp")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[11px]"
            disabled={isLast}
            onClick={() => onMoveDown(item.key)}
            aria-label={t("admin.services.form.media.moveDownAria")}
          >
            {t("admin.services.form.media.moveDown")}
          </Button>
        </div>
      </div>
    </div>
  );
}
