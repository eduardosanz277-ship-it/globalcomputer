"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { useServerAction } from "@/hooks/use-server-action";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { updateProfileNameAction } from "./actions";

type FormValues = {
  name: string;
};

type Props = {
  initialName: string | null | undefined;
  email: string;
};

export function ProfileForm({ initialName, email }: Props) {
  const router = useRouter();
  const form = useForm<FormValues>({
    defaultValues: {
      name: initialName ?? "",
    },
  });
  const { execute, isPending } = useServerAction(updateProfileNameAction, {
    successMessage: "Nombre actualizado",
    errorMessage: "No se pudo actualizar el nombre",
    onSettled: () => router.refresh(),
  });
  const isSubmittingRef = useRef(false);

  const onSubmit = async (values: FormValues) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      await execute({ name: values.name });
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Actualiza tu información.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onSubmit}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <FormField
                name="name"
                label="Nombre completo"
                required
                error={form.formState.errors.name?.message}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="account-email">
                Email
              </label>
              <p
                id="account-email"
                className="mt-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
              >
                {email}
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={isPending} className="w-auto px-6">
              {isPending ? "Guardando…" : "Actualizar"}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
