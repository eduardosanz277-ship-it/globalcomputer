"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRight, Trash2 } from "lucide-react";
import { useServerAction } from "@/hooks/use-server-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { addAddressAction, deleteAddressAction } from "./actions";
import type { CuentaAddress } from "./types";

type FormValues = {
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type Props = {
  addresses: CuentaAddress[];
};

export function AddressesSection({ addresses }: Props) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const form = useForm<FormValues>({
    defaultValues: {
      label: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "España",
    },
  });

  const {
    execute: addAddress,
    isPending: addingAddress,
  } = useServerAction(addAddressAction, {
    successMessage: "Dirección agregada",
    errorMessage: "No se pudo guardar la dirección",
    onSettled: () => {
      router.refresh();
      setShowForm(false);
    },
  });

  const {
    execute: deleteAddress,
    isPending: deletingAddress,
  } = useServerAction(deleteAddressAction, {
    successMessage: "Dirección eliminada",
    errorMessage: "No se pudo eliminar la dirección",
    onSettled: () => router.refresh(),
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta dirección?")) return;
    deleteAddress({ addressId: id });
  };

  const onSubmit = (values: FormValues) => {
    addAddress(values);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Direcciones guardadas</CardTitle>
            <CardDescription>
              Tus direcciones preferidas para envíos y facturación.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowForm((prev) => !prev)}
          >
            {showForm ? "Cancelar" : "Agregar dirección"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Guarda varias direcciones y selecciona tu preferida.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Direcciones asociadas
          </p>
          <p className="text-xs text-muted-foreground">
            {addresses.length} dirección(es) guardada(s)
          </p>
        </div>
        {addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no has agregado ninguna dirección.
          </p>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-xl border border-border bg-background/40 px-4 py-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {address.label || "Dirección"}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDelete(address.id)}
                    disabled={deletingAddress}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {address.street}, {address.city}
                  {address.state ? `, ${address.state}` : ""}
                  {address.postalCode ? ` · ${address.postalCode}` : ""}
                  <br />
                  {address.country}
                </p>
                {address.isDefault ? (
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                    Predeterminada
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <Form form={form} onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField name="label" label="Alias (ej: Casa, Trabajo)" />
              <FormField name="street" label="Calle" required />
              <FormField name="city" label="Ciudad" required />
              <FormField name="state" label="Provincia / Estado" />
              <FormField name="postalCode" label="Código postal" />
              <FormField name="country" label="País" />
            </div>
            <Button type="submit" disabled={addingAddress} className="w-auto px-6">
              <ArrowRight className="mr-2 h-4 w-4" aria-hidden />
              {addingAddress ? "Guardando…" : "Guardar dirección"}
            </Button>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
