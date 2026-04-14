"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonPending } from "@/components/ui/button-pending";
import {
  adminServiceLikeInputClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { ProductDescriptionEditor } from "@/components/ProductDescriptionEditor";
import { Dropzone } from "./Dropzone";
import { ImageGrid } from "./ImageGrid";
import { useServiceImagesManager } from "./use-service-images-manager";
import type { ExistingServiceImageInput, ServiceFormSubmitData } from "./types";

type ServiceFormProps = {
  initialName?: string;
  initialDescription?: string;
  existingImages: ExistingServiceImageInput[];
  onSubmit: (data: ServiceFormSubmitData) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
  formId?: string;
  showActions?: boolean;
};

export function ServiceForm({
  initialName = "",
  initialDescription = "",
  existingImages,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
  formId,
  showActions = true,
}: ServiceFormProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [nameError, setNameError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "media">("basic");

  const images = useServiceImagesManager(existingImages);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNameError(null);

    const cleanedName = name.trim();
    if (!cleanedName) {
      setNameError("El nombre del servicio es obligatorio.");
      return;
    }

    await onSubmit({
      name: cleanedName,
      description: description.trim(),
      newImages: images.newImages,
      updatedExistingImages: images.updatedExistingImages,
      removedImages: images.removedImages,
    });
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={cn("flex min-h-0 min-w-0 flex-col gap-0", className)}
    >
      <div
        role="tablist"
        aria-label="Secciones del formulario de servicio"
        className="sticky top-0 z-[100] -mx-4 flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-border/60 bg-background px-4 pb-3 pt-4 shadow-sm [scrollbar-width:thin]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "basic"}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
            activeTab === "basic"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
          )}
          onClick={() => setActiveTab("basic")}
        >
          Información básica
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "media"}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
            activeTab === "media"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
          )}
          onClick={() => setActiveTab("media")}
        >
          Multimedia
        </button>
      </div>

      <div className="relative z-0 min-h-0 flex-1 space-y-4 pt-4">
        {activeTab === "basic" ? (
          <section className={adminSlideOverSectionClassName}>
            <div className="space-y-2">
              <Label htmlFor="service-name">
                Nombre del servicio
                <RequiredMark />
              </Label>
              <Input
                id="service-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="Ej. Instalación y puesta en marcha"
                autoComplete="off"
                aria-required
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? "service-name-error" : undefined}
                className={cn(
                  adminServiceLikeInputClassName,
                  nameError &&
                    "border-destructive focus-visible:ring-destructive/30",
                )}
              />
              {nameError ? (
                <p
                  id="service-name-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {nameError}
                </p>
              ) : null}
            </div>

            <ProductDescriptionEditor
              id="service-description-rich"
              label="Descripción"
              value={description}
              onChange={setDescription}
              disabled={isSubmitting}
            />
          </section>
        ) : (
          <section className={adminSlideOverSectionClassName}>
            <header>
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                Imágenes
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Reordena por drag & drop, define una imagen principal y elimina
                las que no necesites.
              </p>
            </header>

            <Dropzone onFilesAdded={images.addFiles} />

            {images.items.length > 0 ? (
              <ImageGrid
                items={images.items}
                onReorder={images.moveImage}
                onRemove={images.removeImage}
                onSetPrimary={images.markPrimary}
                onMoveUp={(key) => images.moveByKeyboard(key, "up")}
                onMoveDown={(key) => images.moveByKeyboard(key, "down")}
              className="flex min-w-0 gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2 [scrollbar-width:thin] sm:grid-cols-none"
              itemClassName="w-[12rem] shrink-0"
              />
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Aún no hay imágenes. Sube al menos una para mejorar la
                presentación.
              </div>
            )}
          </section>
        )}
      </div>

      {showActions ? (
        <footer className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-10 min-w-[110px] transition hover:-translate-y-[1px]"
            aria-label="Cancelar edición del servicio"
          >
            Cancelar
          </Button>
          <ButtonPending
            type="submit"
            pending={Boolean(isSubmitting)}
            pendingLabel="Guardando"
            skipMinWidth
            className="h-10 min-w-[140px] transition hover:-translate-y-[1px] active:translate-y-0"
            aria-label="Guardar servicio"
          >
            Guardar
          </ButtonPending>
        </footer>
      ) : null}
    </form>
  );
}
