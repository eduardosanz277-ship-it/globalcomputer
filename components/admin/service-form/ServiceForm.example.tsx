"use client";

import { useState } from "react";
import { ServiceForm } from "./ServiceForm";
import type { ExistingServiceImageInput, ServiceFormSubmitData } from "./types";

const demoExistingImages: ExistingServiceImageInput[] = [
  {
    id: "img-1",
    url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&q=80&auto=format&fit=crop",
    order: 0,
    isPrimary: true,
  },
  {
    id: "img-2",
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80&auto=format&fit=crop",
    order: 1,
    isPrimary: false,
  },
];

export function ServiceFormExample() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (data: ServiceFormSubmitData) => {
    setIsSaving(true);
    try {
      // Conecta aquí tu Server Action / API
      console.log("Payload form servicio:", data);
      await new Promise((resolve) => setTimeout(resolve, 900));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ServiceForm
      initialName="Mantenimiento preventivo"
      initialDescription="Revisión, limpieza y validación de funcionamiento."
      existingImages={demoExistingImages}
      onSubmit={handleSubmit}
      onCancel={() => {
        console.log("Cancelar");
      }}
      isSubmitting={isSaving}
      className="max-w-5xl"
    />
  );
}
