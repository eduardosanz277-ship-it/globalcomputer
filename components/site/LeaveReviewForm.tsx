"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn as cnUtils } from "@/utils/cn";

const ratingOptions = [
  { label: "Excelente (5 estrellas)", value: 5 },
  { label: "Muy bueno (4 estrellas)", value: 4 },
  { label: "Bueno (3 estrellas)", value: 3 },
  { label: "Regular (2 estrellas)", value: 2 },
  { label: "Pobre (1 estrella)", value: 1 },
];

const defaultFormState = {
  name: "",
  email: "",
  rating: 5,
  comment: "",
};

type FormState = typeof defaultFormState;
type SubmissionStatus = "idle" | "submitting" | "success" | "error";

export function LeaveReviewForm() {
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const submitDisabled = status === "submitting";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/site-reviews", {
        method: "POST",
        body: JSON.stringify(formState),
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "No se pudo enviar la reseña.");
      }

      setStatus("success");
      setFormState(defaultFormState);
    } catch (error) {
      console.error("LeaveReviewForm submit", error);
      setErrorMessage(error instanceof Error ? error.message : "Error inesperado.");
      setStatus("error");
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm dark:bg-card">
        <div className="grid gap-4">
          <Input
            placeholder="Nombre"
            className="h-12 px-3 text-sm"
            value={formState.name}
            onChange={(event) => handleChange("name", event.target.value)}
            autoComplete="name"
            required
          />
          <Input
            type="email"
            placeholder="Correo electrónico (opcional)"
            className="h-12 px-3 text-sm"
            value={formState.email}
            onChange={(event) => handleChange("email", event.target.value)}
            autoComplete="email"
          />
          <label className="text-sm font-medium text-foreground">
            ¿Qué te pareció la tienda?
          </label>
          <select
            className={cnUtils(
              "h-11 rounded-lg border border-border/60 px-3 text-sm",
              "bg-background text-foreground transition hover:border-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40",
            )}
            value={formState.rating}
            onChange={(event) =>
              handleChange("rating", Number(event.target.value) as FormState["rating"])
            }
            required
          >
            {ratingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            className="h-auto min-h-[160px] rounded-2xl border border-border/60 px-3 py-2 text-sm"
            placeholder="Cuéntanos qué te gustó o qué podemos mejorar."
            value={formState.comment}
            onChange={(event) => handleChange("comment", event.target.value)}
            required
            minLength={10}
          />
        </div>
      </div>

      {status === "success" ? (
        <p className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          Resumen recibido. Gracias por compartir tu experiencia.
        </p>
      ) : null}

      {status === "error" && errorMessage ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full rounded-xl"
        disabled={submitDisabled}
        aria-busy={submitDisabled}
      >
        {submitDisabled ? "Enviando reseña…" : "Enviar reseña"}
      </Button>
    </form>
  );
}
