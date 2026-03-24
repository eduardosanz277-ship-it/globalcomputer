"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { cn } from "@/utils/cn";
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
      className={cn("space-y-6", className)}
    >
      <section className="space-y-4 rounded-xl border border-border/60 bg-white p-5 shadow-sm dark:bg-card">
        <header className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            Información básica
          </h2>
        </header>

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
              "h-11 rounded-lg border-border/80 bg-background/80 shadow-sm transition focus-visible:ring-2 focus-visible:ring-ring/35",
              nameError && "border-destructive focus-visible:ring-destructive/30"
            )}
          />
          {nameError ? (
            <p id="service-name-error" className="text-sm text-destructive" role="alert">
              {nameError}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="service-description">Descripción</Label>
          <textarea
            id="service-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe brevemente el alcance del servicio"
            className={cn(
              "min-h-[120px] w-full rounded-lg border border-border/80 bg-background/80 px-3 py-2 text-sm shadow-sm outline-none transition",
              "placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring/35"
            )}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/60 bg-white p-5 shadow-sm dark:bg-card">
        <header>
          <h2 className="text-sm font-semibold tracking-wide text-foreground">
            Imágenes
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Reordena por drag & drop, define una imagen principal y elimina las que no necesites.
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
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Aún no hay imágenes. Sube al menos una para mejorar la presentación.
          </div>
        )}
      </section>

      {showActions ? (
        <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-10 min-w-[110px] transition hover:-translate-y-[1px]"
            aria-label="Cancelar edición del servicio"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 min-w-[140px] transition hover:-translate-y-[1px] active:translate-y-0"
            aria-label="Guardar servicio"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </footer>
      ) : null}
    </form>
  );
}
