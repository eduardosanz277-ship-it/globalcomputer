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

function addressRecipientLine(address: CuentaAddress): string {
  const name = [address.firstName?.trim(), address.lastName?.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (name) return name;
  const co = address.company?.trim();
  if (co) return co;
  return "Dirección";
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

function addressConfirmLabel(address: CuentaAddress): string {
  const recipient = addressRecipientLine(address);
  const street = address.street?.trim() ?? "";
  const apt = address.apartment?.trim();
  const location = [street, apt].filter(Boolean).join(" · ");
  if (recipient !== "Dirección" && location)
    return `${recipient} — ${location}`;
  if (location) return location;
  return recipient;
}

type Props = {
  addresses: CuentaAddress[];
  orders?: CuentaOrder[];
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
    const label = addressConfirmLabel(address);
    const raw = label === "Dirección" ? "esta dirección" : label;
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
            Agregar
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
          <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {addresses.map((address) => {
              const locality = addressLocalityLine(address);
              const recipient = addressRecipientLine(address);
              const streetLine = address.street?.trim() ?? "";
              const apartmentLine = address.apartment?.trim();
              const companyLine = address.company?.trim();
              const phoneLine = address.phone?.trim();
              const hasRecipientName = Boolean(
                [address.firstName?.trim(), address.lastName?.trim()].filter(
                  Boolean,
                ).length,
              );
              /** Compañía debajo del título solo si ya hay persona; si no hay nombre, la compañía va en el h4. */
              const showCompanySubline = hasRecipientName && Boolean(companyLine);
              const showPhoneSubline = Boolean(phoneLine);
              const isMinimalHeader =
                !showCompanySubline && !showPhoneSubline;
              return (
                <li key={address.id} className="min-w-0 self-stretch">
                  <article
                    className={cn(
                      "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm",
                      "p-3 sm:p-4",
                      "transition-[box-shadow,border-color] duration-200",
                      "hover:border-primary/25 hover:shadow-md",
                    )}
                  >
                    <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3">
                      <div
                        className={cn(
                          "flex min-w-0 gap-x-2.5 sm:gap-x-3",
                          isMinimalHeader ? "items-center" : "items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "flex shrink-0 items-center justify-center",
                            !isMinimalHeader && "pt-0.5",
                          )}
                          aria-hidden
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.08] text-primary ring-1 ring-inset ring-primary/10 sm:h-11 sm:w-11 sm:rounded-xl">
                            <MapPin
                              className="h-4 w-4 sm:h-5 sm:w-5"
                              strokeWidth={1.75}
                            />
                          </div>
                        </div>
                        <div
                          className={cn(
                            "flex min-w-0 flex-1 justify-between gap-2",
                            isMinimalHeader ? "items-center" : "items-start",
                          )}
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div
                              className={cn(
                                "flex min-w-0 gap-2",
                                address.isDefault
                                  ? "flex-col items-stretch"
                                  : "flex-row flex-nowrap items-center",
                              )}
                            >
                              <h4
                                className={cn(
                                  "min-w-0 text-sm font-semibold leading-tight tracking-tight text-foreground",
                                  address.isDefault
                                    ? "w-full text-pretty break-words [overflow-wrap:anywhere]"
                                    : "min-w-0 flex-1 truncate",
                                  !isMinimalHeader && "pt-0.5",
                                )}
                                title={recipient}
                              >
                                {recipient}
                              </h4>
                              {address.isDefault ? (
                                <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                  <span aria-hidden className="select-none">
                                    ✓
                                  </span>
                                  Predeterminada
                                </span>
                              ) : null}
                            </div>
                            {showCompanySubline ? (
                              <p className="text-xs leading-snug text-muted-foreground [overflow-wrap:anywhere]">
                                {companyLine}
                              </p>
                            ) : null}
                            {showPhoneSubline ? (
                              <p className="text-xs leading-snug text-muted-foreground [overflow-wrap:anywhere]">
                                {phoneLine}
                              </p>
                            ) : null}
                          </div>
                          <div
                            className={cn("shrink-0", !isMinimalHeader && "pt-0.5")}
                          >
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
                          {streetLine || "—"}
                        </p>
                        {apartmentLine ? (
                          <p className="text-sm leading-snug text-muted-foreground [overflow-wrap:anywhere]">
                            Apartamento: {apartmentLine}
                          </p>
                        ) : null}
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
