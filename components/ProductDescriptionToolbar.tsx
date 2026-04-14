"use client";

import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type ComponentType,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Table2,
  TextQuote,
  Underline,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";

/** Misma apariencia que tooltips de tablas admin (p. ej. columna de fechas). */
const TABLE_LIKE_TOOLTIP_CLASS =
  "rounded-xl border border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl";

type Props = {
  /** Instancia Tiptap; los botones se desactivan si es null. */
  editor: Editor | null;
  disabled?: boolean;
  /** Abre el input file oculto del editor para subir imagen. */
  onPickImage: () => void;
  /** Inserta el bloque de lista “Características principales”. */
  onInsertCharacteristicsBlock: () => void;
  /** Inserta título + párrafo + tabla de especificaciones (plantilla larga). */
  onInsertSpecificationsSection: () => void;
  /** Inserta solo la tabla de especificaciones con filas predefinidas. */
  onInsertSpecificationsTable: () => void;
};

function toolbarBtnClass(active?: boolean) {
  return cn(
    "h-8 min-w-8 shrink-0 px-2",
    active && "bg-primary/12 text-primary",
  );
}

/** Tooltip unificado: solo título, diseño tipo panel/tablas. */
function EditorTooltip({
  title,
  side = "top",
  align = "start",
  children,
}: {
  title: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  children: ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        className={TABLE_LIKE_TOOLTIP_CLASS}
      >
        <span className="font-medium">{title}</span>
      </TooltipContent>
    </Tooltip>
  );
}

type DropdownItem = {
  label: string;
  onSelect: () => void;
  active?: boolean;
  icon?: ComponentType<{ className?: string }>;
};

/**
 * Menú desplegable (click fuera cierra).
 */
function ToolbarDropdown({
  disabled,
  tooltip,
  label,
  icon: Icon,
  headingBadge,
  items,
  menuWidthClassName,
  isTriggerActive,
}: {
  disabled?: boolean;
  tooltip: string;
  label?: string;
  icon?: ComponentType<{ className?: string }>;
  headingBadge?: string;
  items: DropdownItem[];
  /** Clases extra para el panel (p. ej. ancho mínimo en desktop). */
  menuWidthClassName?: string;
  isTriggerActive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  /** Posición `fixed` en viewport (menú renderizado con portal a `document.body` para no recortarlo por overflow del SlideOver / paneles). */
  const [menuFixedStyle, setMenuFixedStyle] = useState<React.CSSProperties | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const showTextLabel = Boolean(label?.trim());

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuFixedStyle(null);
      return;
    }

    const pad = 12;
    const place = () => {
      const root = rootRef.current;
      if (!root) return;
      const rr = root.getBoundingClientRect();
      const vw = window.innerWidth;
      const narrow = vw < 640;
      const top = rr.bottom + 6;
      const menu = menuRef.current;
      const mw = menu?.getBoundingClientRect().width ?? 200;

      let left: number;
      if (narrow) {
        left = Math.max(pad, Math.min((vw - mw) / 2, vw - pad - mw));
      } else {
        left = rr.left;
        if (left + mw > vw - pad) left = vw - pad - mw;
        if (left < pad) left = pad;
      }

      setMenuFixedStyle({
        position: "fixed",
        top,
        left,
        zIndex: 200,
      });
    };

    place();
    const raf1 = window.requestAnimationFrame(place);
    const raf2 = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(place);
    });
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, items.length]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <EditorTooltip title={tooltip} side="top" align="start">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={
            headingBadge != null ? `${tooltip}: ${headingBadge}` : tooltip
          }
          className={cn(
            "h-8 shrink-0 gap-1 px-2 text-xs font-medium",
            showTextLabel
              ? "min-w-[7.25rem] justify-between sm:min-w-[8.5rem]"
              : headingBadge != null
                ? "min-w-[2.75rem] justify-center px-1.5 tabular-nums"
                : "min-w-[3rem] justify-center px-1.5",
            isTriggerActive && "bg-primary/12 text-primary",
          )}
          onClick={() => {
            if (disabled) return;
            setOpen((o) => !o);
          }}
        >
          <span className="flex min-w-0 items-center gap-1">
            {headingBadge != null ? (
              <span className="inline-flex items-baseline gap-px font-bold leading-none">
                <span className="text-[12px] sm:text-[13px]">H</span>
                {headingBadge.length > 1 ? (
                  <span className="text-[9px] font-semibold tabular-nums text-inherit sm:text-[10px]">
                    {headingBadge.slice(1)}
                  </span>
                ) : null}
              </span>
            ) : Icon ? (
              <Icon className="h-4 w-4 shrink-0" />
            ) : null}
            {showTextLabel ? <span className="truncate">{label}</span> : null}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 opacity-70 transition",
              open && "rotate-180",
            )}
          />
        </Button>
      </EditorTooltip>
      {open && menuFixedStyle && typeof document !== "undefined"
        ? createPortal(
            <TooltipProvider delayDuration={120}>
              <ul
                ref={menuRef}
                role="listbox"
                style={menuFixedStyle}
                className={cn(
                  "max-h-[min(55dvh,22rem)] w-max min-w-0 max-w-[calc(100vw-1.25rem)] overflow-y-auto overflow-x-hidden overscroll-contain rounded-md border border-border/80 bg-popover py-1 shadow-lg sm:min-w-[12.5rem] sm:max-w-none",
                  menuWidthClassName,
                )}
              >
                {items.map((item) => {
                const ItemIcon = item.icon;
                const row = (
                  <button
                    type="button"
                    className={cn(
                      "flex min-h-[2.75rem] w-full cursor-help items-center gap-2.5 px-3 py-2.5 text-left text-sm leading-snug text-foreground transition hover:bg-muted/80 sm:min-h-0 sm:py-2",
                      item.active && "bg-primary/10 font-medium text-primary",
                    )}
                    onClick={() => {
                      item.onSelect();
                      setOpen(false);
                    }}
                  >
                    {ItemIcon ? (
                      <ItemIcon
                        className="h-4 w-4 shrink-0 opacity-85"
                        aria-hidden
                      />
                    ) : null}
                    <span className="min-w-0 flex-1 break-words">
                      {item.label}
                    </span>
                  </button>
                );

                return (
                  <li key={item.label} role="option" aria-selected={item.active}>
                    <EditorTooltip title={item.label} side="top" align="start">
                      {row}
                    </EditorTooltip>
                  </li>
                );
              })}
              </ul>
            </TooltipProvider>,
            document.body,
          )
        : null}
    </div>
  );
}

/**
 * Barra de herramientas del editor: formato inline, encabezados y listas en
 * desplegables, cita (blockquote), enlaces, imagen y bloques de plantilla.
 */
export function ProductDescriptionToolbar({
  editor,
  disabled,
  onPickImage,
  onInsertCharacteristicsBlock,
  onInsertSpecificationsSection,
  onInsertSpecificationsTable,
}: Props) {
  const [, tick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (!editor) return;
    const fn = () => tick();
    editor.on("selectionUpdate", fn);
    editor.on("transaction", fn);
    return () => {
      editor.off("selectionUpdate", fn);
      editor.off("transaction", fn);
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-border/70 bg-muted/25 px-2 py-2 text-xs text-muted-foreground">
        Cargando editor…
      </div>
    );
  }

  const run = (fn: () => void) => {
    if (disabled) return;
    fn();
  };

  const headingActive =
    editor.isActive("heading", { level: 1 }) ||
    editor.isActive("heading", { level: 2 }) ||
    editor.isActive("heading", { level: 3 }) ||
    editor.isActive("heading", { level: 4 });

  const headingLevel = ([1, 2, 3, 4] as const).find((level) =>
    editor.isActive("heading", { level }),
  );
  const headingBadge = headingLevel != null ? `H${headingLevel}` : "H";

  const listActive =
    editor.isActive("bulletList") || editor.isActive("orderedList");

  const blockTextAlign = (editor.getAttributes("paragraph").textAlign ??
    editor.getAttributes("heading").textAlign) as
    | "left"
    | "center"
    | "right"
    | "justify"
    | null
    | undefined;
  const effectiveTextAlign: "left" | "center" | "right" | "justify" =
    blockTextAlign ?? "left";

  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex min-w-0 flex-col gap-2 rounded-t-lg border border-b-0 border-border/70 bg-muted/20 px-2 py-2 sm:px-3">
        <div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:thin]">
          <EditorTooltip title="Deshacer (Ctrl+Z)">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toolbarBtnClass(false)}
              disabled={disabled || !editor.can().undo()}
              onClick={() => run(() => editor.chain().focus().undo().run())}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </EditorTooltip>
          <EditorTooltip title="Rehacer (Ctrl+Shift+Z)">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toolbarBtnClass(false)}
              disabled={disabled || !editor.can().redo()}
              onClick={() => run(() => editor.chain().focus().redo().run())}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </EditorTooltip>

          <span className="mx-1 hidden h-5 w-px bg-border/80 sm:inline-block" />

          <ToolbarDropdown
            disabled={disabled}
            tooltip="Encabezado"
            headingBadge={headingBadge}
            isTriggerActive={headingActive}
            items={[
              {
                label: "Encabezado 1",
                icon: Heading1,
                active: editor.isActive("heading", { level: 1 }),
                onSelect: () =>
                  run(() => {
                    if (editor.isActive("heading", { level: 1 })) {
                      editor.chain().focus().setParagraph().run();
                    } else {
                      editor.chain().focus().setHeading({ level: 1 }).run();
                    }
                  }),
              },
              {
                label: "Encabezado 2",
                icon: Heading2,
                active: editor.isActive("heading", { level: 2 }),
                onSelect: () =>
                  run(() => {
                    if (editor.isActive("heading", { level: 2 })) {
                      editor.chain().focus().setParagraph().run();
                    } else {
                      editor.chain().focus().setHeading({ level: 2 }).run();
                    }
                  }),
              },
              {
                label: "Encabezado 3",
                icon: Heading3,
                active: editor.isActive("heading", { level: 3 }),
                onSelect: () =>
                  run(() => {
                    if (editor.isActive("heading", { level: 3 })) {
                      editor.chain().focus().setParagraph().run();
                    } else {
                      editor.chain().focus().setHeading({ level: 3 }).run();
                    }
                  }),
              },
              {
                label: "Encabezado 4",
                icon: Heading4,
                active: editor.isActive("heading", { level: 4 }),
                onSelect: () =>
                  run(() => {
                    if (editor.isActive("heading", { level: 4 })) {
                      editor.chain().focus().setParagraph().run();
                    } else {
                      editor.chain().focus().setHeading({ level: 4 }).run();
                    }
                  }),
              },
            ]}
          />

          <ToolbarDropdown
            disabled={disabled}
            tooltip="Listas"
            icon={List}
            isTriggerActive={listActive}
            items={[
              {
                label: "Lista con viñetas",
                icon: List,
                active: editor.isActive("bulletList"),
                onSelect: () =>
                  run(() => editor.chain().focus().toggleBulletList().run()),
              },
              {
                label: "Lista numerada",
                icon: ListOrdered,
                active: editor.isActive("orderedList"),
                onSelect: () =>
                  run(() => editor.chain().focus().toggleOrderedList().run()),
              },
            ]}
          />

          <EditorTooltip title="Cita / bloque destacado">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toolbarBtnClass(editor.isActive("blockquote"))}
              disabled={disabled}
              onClick={() =>
                run(() => editor.chain().focus().toggleBlockquote().run())
              }
            >
              <TextQuote className="h-4 w-4" />
            </Button>
          </EditorTooltip>

          <span className="mx-1 hidden h-5 w-px bg-border/80 sm:inline-block" />

          <EditorTooltip title="Negrita">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toolbarBtnClass(editor.isActive("bold"))}
              disabled={disabled}
              onClick={() =>
                run(() => editor.chain().focus().toggleBold().run())
              }
            >
              <span className="text-sm font-bold leading-none">B</span>
            </Button>
          </EditorTooltip>
          <EditorTooltip title="Cursiva">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toolbarBtnClass(editor.isActive("italic"))}
              disabled={disabled}
              onClick={() =>
                run(() => editor.chain().focus().toggleItalic().run())
              }
            >
              <Italic className="h-4 w-4" />
            </Button>
          </EditorTooltip>
          <EditorTooltip title="Subrayado">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toolbarBtnClass(editor.isActive("underline"))}
              disabled={disabled}
              onClick={() =>
                run(() => editor.chain().focus().toggleUnderline().run())
              }
            >
              <Underline className="h-4 w-4" />
            </Button>
          </EditorTooltip>

          <span className="mx-1 hidden h-5 w-px bg-border/80 sm:inline-block" />

          <EditorTooltip title="Alinear a la izquierda">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toolbarBtnClass(effectiveTextAlign === "left")}
              disabled={disabled}
              onClick={() =>
                run(() => editor.chain().focus().setTextAlign("left").run())
              }
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
          </EditorTooltip>
          <EditorTooltip title="Centrar">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toolbarBtnClass(effectiveTextAlign === "center")}
              disabled={disabled}
              onClick={() =>
                run(() => editor.chain().focus().setTextAlign("center").run())
              }
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
          </EditorTooltip>
          <EditorTooltip title="Alinear a la derecha">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toolbarBtnClass(effectiveTextAlign === "right")}
              disabled={disabled}
              onClick={() =>
                run(() => editor.chain().focus().setTextAlign("right").run())
              }
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </EditorTooltip>
          <EditorTooltip title="Justificar">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toolbarBtnClass(effectiveTextAlign === "justify")}
              disabled={disabled}
              onClick={() =>
                run(() => editor.chain().focus().setTextAlign("justify").run())
              }
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </EditorTooltip>

          <span className="mx-1 hidden h-5 w-px bg-border/80 sm:inline-block" />

          <EditorTooltip title="Enlace">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toolbarBtnClass(editor.isActive("link"))}
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                const prev = editor.getAttributes("link").href as
                  | string
                  | undefined;
                const next = window.prompt(
                  "URL del enlace (vacío para quitar)",
                  prev ?? "https://",
                );
                if (next === null) return;
                if (next.trim() === "") {
                  editor
                    .chain()
                    .focus()
                    .extendMarkRange("link")
                    .unsetLink()
                    .run();
                  return;
                }
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: next.trim(), target: "_blank" })
                  .run();
              }}
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </EditorTooltip>
          <EditorTooltip title="Insertar imagen (sube a Storage)">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toolbarBtnClass(false)}
              disabled={disabled}
              onClick={() => run(onPickImage)}
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
          </EditorTooltip>
          <EditorTooltip title="Separador horizontal">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={toolbarBtnClass(false)}
              disabled={disabled}
              onClick={() =>
                run(() => editor.chain().focus().setHorizontalRule().run())
              }
            >
              <Minus className="h-4 w-4" />
            </Button>
          </EditorTooltip>
        </div>

        <div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain border-t border-border/50 pt-2 [scrollbar-width:thin]">
          <span className="mr-1 shrink-0 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Bloques
          </span>
          <EditorTooltip title="Inserta título y lista de características">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 shrink-0 gap-1.5 px-2.5 text-xs whitespace-nowrap"
              disabled={disabled}
              onClick={() => run(onInsertCharacteristicsBlock)}
            >
              <TextQuote className="h-3.5 w-3.5" />
              Características
            </Button>
          </EditorTooltip>
          <EditorTooltip title="Sección completa de especificaciones con tabla">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 shrink-0 gap-1.5 px-2.5 text-xs whitespace-nowrap"
              disabled={disabled}
              onClick={() => run(onInsertSpecificationsSection)}
            >
              <Table2 className="h-3.5 w-3.5" />
              Especificaciones
            </Button>
          </EditorTooltip>
          <EditorTooltip title="Solo tabla editable con filas típicas">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 shrink-0 gap-1.5 px-2.5 text-xs whitespace-nowrap"
              disabled={disabled}
              onClick={() => run(onInsertSpecificationsTable)}
            >
              <Table2 className="h-3.5 w-3.5" />
              Tabla espec.
            </Button>
          </EditorTooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
