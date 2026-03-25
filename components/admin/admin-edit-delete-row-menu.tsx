"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

const MENU_MIN_WIDTH_PX = 208; // 13rem — mismo ancho que `UsersRowActionsMenu`

/**
 * Menú ⋮ con Editar y Eliminar, mismo patrón visual que las acciones de la tabla de Usuarios.
 */
export function AdminEditDeleteRowMenu({
  onEdit,
  onDelete,
  isDeleting,
  deletingLabel = "Eliminando…",
}: {
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
  isDeleting: boolean;
  deletingLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const left = Math.max(8, r.right - MENU_MIN_WIDTH_PX);
      setMenuPos({ top: r.bottom + 4, left });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  const busy = isDeleting;

  const menuContent =
    open && menuPos ? (
      <div
        ref={menuRef}
        className="fixed z-[100] min-w-[13rem] overflow-hidden rounded-lg border border-border/80 bg-popover py-1 shadow-lg ring-1 ring-black/5"
        style={{ top: menuPos.top, left: menuPos.left }}
        role="menu"
      >
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted/80"
          disabled={busy}
          onClick={() => {
            onEdit();
            setOpen(false);
          }}
        >
          <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          Editar
        </button>
        <div className="my-1 h-px bg-border/70" role="separator" />
        <button
          type="button"
          role="menuitem"
          className={
            busy
              ? "flex w-full cursor-not-allowed items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground/60"
              : "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/10"
          }
          disabled={busy}
          onClick={() => {
            void onDelete();
          }}
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          {isDeleting ? deletingLabel : "Eliminar"}
        </button>
      </div>
    ) : null;

  return (
    <div className="relative flex justify-end" ref={wrapRef}>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground md:rounded-md md:border md:border-border/80 md:bg-background md:hover:bg-muted/60"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Abrir menú de acciones"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </Button>
      {typeof document !== "undefined" && menuContent
        ? createPortal(menuContent, document.body)
        : null}
    </div>
  );
}
