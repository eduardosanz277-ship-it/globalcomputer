"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/utils/cn";

type DropzoneProps = {
  onFilesAdded: (files: File[]) => void;
  maxFileSizeMb?: number;
  acceptedTypes?: string[];
};

const DEFAULT_ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function Dropzone({
  onFilesAdded,
  maxFileSizeMb = 5,
  acceptedTypes = DEFAULT_ACCEPTED,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  const validateFiles = (files: File[]) => {
    const maxBytes = maxFileSizeMb * 1024 * 1024;
    const valid: File[] = [];
    const invalid: string[] = [];

    files.forEach((file) => {
      const typeOk = acceptedTypes.includes(file.type);
      const sizeOk = file.size <= maxBytes;
      if (typeOk && sizeOk) valid.push(file);
      else invalid.push(file.name);
    });

    if (valid.length > 0) {
      onFilesAdded(valid);
      setFeedback(`${valid.length} imagen(es) añadida(s).`);
    } else {
      setFeedback("No se añadieron imágenes válidas.");
    }

    if (invalid.length > 0) {
      setFeedback((prev) =>
        `${prev} ${invalid.length} archivo(s) omitido(s) por tipo o tamaño.`
      );
    }
  };

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Arrastra imágenes o selecciona archivos"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          validateFiles(Array.from(e.dataTransfer.files ?? []));
        }}
        className={cn(
          "group flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 px-6 py-8 text-center transition-all",
          "hover:border-foreground/40 hover:bg-muted/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          isDragActive && "border-foreground/60 bg-muted/50 shadow-inner"
        )}
      >
        <ImagePlus className="mb-3 h-10 w-10 text-muted-foreground transition-colors group-hover:text-foreground" />
        <p className="text-sm font-medium text-foreground">
          Arrastra imágenes aquí o haz clic para seleccionar
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG, WEBP, GIF · máximo {maxFileSizeMb}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            validateFiles(files);
            e.currentTarget.value = "";
          }}
        />
      </div>
      {feedback ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
