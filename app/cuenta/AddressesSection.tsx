"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus } from "lucide-react";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { useServerAction } from "@/hooks/use-server-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/utils/cn";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import { AddressFormSlideOver } from "./AddressFormSlideOver";
import { deleteAddressAction } from "./actions";
import type { CuentaAddress } from "./types";

function escapeHtmlBasic(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Segunda línea: ciudad, estado y CP sin comas colgantes. */
function addressLocalityLine(address: CuentaAddress): string | null {
  const cityState = [address.city?.trim(), address.state?.trim()]
    .filter(Boolean)
    .join(", ");
  const zip = address.postalCode?.trim();
  if (!cityState && !zip) return null;
  if (cityState && zip) return `${cityState} · ${zip}`;
  return cityState || zip || null;
}

type Props = {
  addresses: CuentaAddress[];
};

export function AddressesSection({ addresses }: Props) {
  const router = useRouter();
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [dialogAddress, setDialogAddress] = useState<CuentaAddress | null>(
    null,
  );

  const { executeAsync: deleteAddressAsync, isPending: deletingAddress } =
    useServerAction(deleteAddressAction, {
      successMessage: "Dirección eliminada",
      errorMessage: "No se pudo eliminar la dirección",
      onSettled: () => router.refresh(),
    });

  const handleDialogOpenChange = (open: boolean) => {
    setAddressDialogOpen(open);
    if (!open) setDialogAddress(null);
  };

  const openCreate = () => {
    setDialogAddress(null);
    setAddressDialogOpen(true);
  };

  const openEdit = (address: CuentaAddress) => {
    setDialogAddress(address);
    setAddressDialogOpen(true);
  };

  const handleDelete = async (address: CuentaAddress) => {
    const raw =
      address.label?.trim() ||
      [address.street, address.city].filter(Boolean).join(", ") ||
      "esta dirección";
    await swalSaasConfirmAsync({
      title: "¿Eliminar dirección?",
      html: `Vas a eliminar <strong>${escapeHtmlBasic(raw)}</strong>. Esta acción <strong>no se puede deshacer</strong>.`,
      confirmButtonText: "Eliminar",
      variant: "destructive",
      iconType: "warning",
      loadingConfirmText: "Eliminando",
      preConfirm: () => deleteAddressAsync({ addressId: address.id }),
    });
  };

  const listBusy = addressDialogOpen || deletingAddress;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Direcciones guardadas</CardTitle>
        <CardDescription>
          Tus direcciones para envíos y facturación. Puedes guardar varias y
          gestionarlas desde aquí.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-3 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Tus direcciones
            </p>
            <p className="text-xs text-muted-foreground">
              {addresses.length === 0
                ? "Ninguna guardada aún"
                : `${addresses.length} dirección${addresses.length === 1 ? "" : "es"}`}
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            onClick={openCreate}
            disabled={listBusy}
            className="w-full gap-1.5 px-6 sm:w-auto sm:shrink-0"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Agregar dirección
          </Button>
        </div>
        {addresses.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center"
            role="status"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MapPin className="h-6 w-6" aria-hidden />
            </div>
            <div className="max-w-sm space-y-1">
              <p className="text-sm font-medium text-foreground">
                Sin direcciones todavía
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Añade una dirección de envío o facturación para agilizar tus
                próximas compras.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 gap-1.5"
              onClick={openCreate}
              disabled={listBusy}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Añadir la primera
            </Button>
          </div>
        ) : (
          <ul
            className={cn(
              "grid list-none gap-3 p-0 sm:gap-4",
              addresses.length > 1 && "sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {addresses.map((address) => {
              const locality = addressLocalityLine(address);
              return (
                <li key={address.id} className="min-w-0">
                  <article
                    className={cn(
                      "overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm",
                      "p-3 sm:p-4",
                      "transition-[box-shadow,border-color] duration-200",
                      "hover:border-primary/25 hover:shadow-md",
                    )}
                  >
                    <div className="flex flex-col gap-2.5 sm:gap-3">
                      <div className="flex min-w-0 gap-x-2.5 sm:gap-x-3">
                        <div
                          className="flex shrink-0 items-center justify-center self-center"
                          aria-hidden
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.08] text-primary ring-1 ring-inset ring-primary/10 sm:h-11 sm:w-11 sm:rounded-xl">
                            <MapPin
                              className="h-4 w-4 sm:h-5 sm:w-5"
                              strokeWidth={1.75}
                            />
                          </div>
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex min-w-0 flex-nowrap items-center gap-2">
                              <h4
                                className="min-w-0 flex-1 truncate text-sm font-semibold leading-none tracking-tight text-foreground"
                                title={
                                  address.label?.trim() || "Dirección"
                                }
                              >
                                {address.label?.trim() || "Dirección"}
                              </h4>
                              {address.isDefault ? (
                                <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                  Predeterminada
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="shrink-0">
                            <AdminEditDeleteRowMenu
                              onEdit={() => openEdit(address)}
                              onDelete={() => void handleDelete(address)}
                              isDeleting={deletingAddress}
                              disabled={addressDialogOpen}
                              deletingLabel="Eliminando"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0 space-y-1.5 border-t border-border/50 pt-2.5">
                        <p className="text-sm font-medium leading-snug text-foreground/90 [overflow-wrap:anywhere]">
                          {address.street}
                        </p>
                        {locality ? (
                          <p className="text-sm leading-snug text-muted-foreground [overflow-wrap:anywhere]">
                            {locality}
                          </p>
                        ) : null}
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80 [overflow-wrap:anywhere]">
                          {address.country}
                        </p>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        <AddressFormSlideOver
          open={addressDialogOpen}
          onOpenChange={handleDialogOpenChange}
          address={dialogAddress}
        />
      </CardContent>
    </Card>
  );
}
