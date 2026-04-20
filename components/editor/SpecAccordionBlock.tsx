"use client";

import { useCallback, useMemo } from "react";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { Editor } from "@tiptap/core";
import { cn } from "@/utils/cn";

export type SpecRowData = {
  name: string;
  detail: string;
};

type SpecAccordionAttrs = {
  /** Título de la agrupación (no usar `title`: Tiptap lo refleja como atributo HTML `title` y muestra tooltip nativo). */
  groupTitle: string;
  open: boolean;
  rows: SpecRowData[];
};

const DEFAULT_ROWS: SpecRowData[] = [
  { name: "Tipo", detail: "Dual lens" },
  { name: "Focal Length", detail: "4 mm" },
];

/**
 * Parsea filas para el editor: conserva filas vacías para que el usuario
 * pueda rellenarlas. Solo valida la estructura del objeto.
 */
function parseRowsForEditor(value: unknown): SpecRowData[] {
  if (!Array.isArray(value)) return DEFAULT_ROWS;
  const rows = value.map((row) => ({
    name: typeof row?.name === "string" ? row.name : "",
    detail: typeof row?.detail === "string" ? row.detail : "",
  }));
  return rows.length > 0 ? rows : DEFAULT_ROWS;
}

/**
 * Parsea y filtra filas para renderizado HTML: descarta las completamente
 * vacías que no aportan contenido visible.
 */
function parseRowsForHtml(value: unknown): SpecRowData[] {
  const rows = parseRowsForEditor(value);
  const filtered = rows.filter(
    (row) => row.name.trim().length > 0 || row.detail.trim().length > 0,
  );
  return filtered.length > 0 ? filtered : rows;
}

function rowsFromAttr(value: unknown): SpecRowData[] {
  if (Array.isArray(value)) return parseRowsForEditor(value);
  if (typeof value === "string") {
    try {
      return parseRowsForEditor(JSON.parse(value));
    } catch {
      return DEFAULT_ROWS;
    }
  }
  return DEFAULT_ROWS;
}

function rowsToAttr(rows: SpecRowData[]): string {
  return JSON.stringify(rows);
}

export function SpecRow({
  row,
  onChange,
  onRemove,
  disabled,
  removeDisabled,
}: {
  row: SpecRowData;
  onChange: (next: SpecRowData) => void;
  onRemove: () => void;
  disabled?: boolean;
  removeDisabled?: boolean;
}) {
  return (
    <div className="grid gap-2 border-t border-border/60 px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-4">
      <div className="space-y-1">
        <label className="text-[11px] font-semibold tracking-wide text-muted-foreground">
          Nombre de la especificación
        </label>
        <input
          value={row.name}
          disabled={disabled}
          onChange={(e) => onChange({ ...row, name: e.target.value })}
          placeholder="Ej. Resolución"
          className={cn(
            "h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition",
            "focus:border-primary focus:ring-0 focus-visible:ring-0",
            disabled && "opacity-60",
          )}
        />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] font-semibold tracking-wide text-muted-foreground">
            Detalle
          </label>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onRemove}
            disabled={disabled || removeDisabled}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Quitar
          </button>
        </div>
        <input
          value={row.detail}
          disabled={disabled}
          onChange={(e) => onChange({ ...row, detail: e.target.value })}
          placeholder="Ej. 4 mm"
          className={cn(
            "h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition",
            "focus:border-primary focus:ring-0 focus-visible:ring-0",
            disabled && "opacity-60",
          )}
        />
      </div>
    </div>
  );
}

function SpecAccordionBlockView({
  editor,
  node,
  updateAttributes,
  getPos,
}: {
  editor: Editor;
  node: any;
  updateAttributes: (attrs: Partial<SpecAccordionAttrs>) => void;
  getPos: (() => number | undefined) | boolean;
}) {
  const attrs = node.attrs as SpecAccordionAttrs;
  const rows = useMemo(() => rowsFromAttr(attrs.rows), [attrs.rows]);

  const patchAttrs = useCallback(
    (nextAttrs: Partial<SpecAccordionAttrs>) => {
      if (typeof getPos !== "function") {
        updateAttributes(nextAttrs);
        return;
      }

      const pos = getPos();
      if (typeof pos !== "number") {
        updateAttributes(nextAttrs);
        return;
      }
      const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
        ...attrs,
        ...nextAttrs,
      });
      editor.view.dispatch(tr);
    },
    [attrs, editor, getPos, updateAttributes],
  );

  const setRow = useCallback(
    (index: number, next: SpecRowData) => {
      const copy = rows.slice();
      copy[index] = next;
      patchAttrs({ rows: copy });
    },
    [patchAttrs, rows],
  );

  const addRow = useCallback(() => {
    patchAttrs({ rows: [...rows, { name: "", detail: "" }], open: true });
  }, [patchAttrs, rows]);

  const removeRow = useCallback(
    (index: number) => {
      const copy = rows.filter((_, i) => i !== index);
      patchAttrs({ rows: copy.length > 0 ? copy : DEFAULT_ROWS });
    },
    [patchAttrs, rows],
  );

  return (
    <NodeViewWrapper
      className="my-4 outline-none"
      contentEditable={false}
      data-drag-handle={false}
    >
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-card/90 px-4 py-3">
          <div className="min-w-0 flex-1 space-y-1">
            <label className="text-[12px] font-semibold tracking-wide text-muted-foreground">
              Título de la agrupación
            </label>
            <input
              value={attrs.groupTitle}
              disabled={false}
              onChange={(e) => patchAttrs({ groupTitle: e.target.value })}
              className={cn(
                "h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm font-semibold outline-none transition",
                "focus:border-primary focus:ring-0 focus-visible:ring-0",
              )}
              placeholder="Ej. Lente"
            />
          </div>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => patchAttrs({ open: !attrs.open })}
            className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background text-foreground transition hover:bg-muted/60"
            aria-label={attrs.open ? "Contraer bloque" : "Expandir bloque"}
          >
            {attrs.open ? (
              <Minus className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-semibold tracking-wide text-muted-foreground">
              {attrs.open ? "Bloque expandido" : "Bloque colapsado"}
            </p>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted/50"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Agregar fila
            </button>
          </div>

          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-out",
              attrs.open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="overflow-hidden">
              <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-background/70">
                {rows.map((row, index) => (
                  <SpecRow
                    key={index}
                    row={row}
                    onChange={(next) => setRow(index, next)}
                    onRemove={() => removeRow(index)}
                    disabled={!editor.isEditable}
                    removeDisabled={rows.length === 1}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          <span>Bloque reutilizable de especificaciones técnicas.</span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => patchAttrs({ open: !attrs.open })}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-primary transition hover:bg-primary/5"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition",
                attrs.open && "rotate-180",
              )}
            />
            {attrs.open ? "Colapsar" : "Expandir"}
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const SpecAccordionBlockExtension = Node.create({
  name: "specAccordionBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      groupTitle: {
        default: "Lente",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-title") ??
          element.getAttribute("data-group-title") ??
          "Lente",
      },
      open: {
        default: true,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("open") !== null,
      },
      rows: {
        default: DEFAULT_ROWS,
        parseHTML: (element: HTMLElement) =>
          rowsFromAttr(element.getAttribute("data-rows")),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'details[data-type="spec-accordion-block"]' }];
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    const attrs = HTMLAttributes as unknown as SpecAccordionAttrs;
    const rows = parseRowsForHtml(attrs.rows);
    const isOpen = attrs.open !== false;

    // Evitar que un `title` heredado en attrs se serialice como atributo HTML nativo (tooltip).
    const { title: _legacyTitle, ...htmlAttrsWithoutTitle } = HTMLAttributes;

    return [
      "details",
      mergeAttributes(htmlAttrsWithoutTitle, {
        "data-type": "spec-accordion-block",
        "data-title": attrs.groupTitle,
        "data-rows": JSON.stringify(rows),
        class: "spec-accordion-block",
        open: isOpen ? "" : null,
      }),
      ["summary", {}, attrs.groupTitle || "Lente"],
      [
        "div",
        { class: "spec-accordion-body" },
        [
          "div",
          {},
          ...rows.map((row) => [
            "div",
            {
              class: "spec-accordion-row",
            },
            ["span", { class: "spec-accordion-row-name" }, row.name || "—"],
            ["span", { class: "spec-accordion-row-detail" }, row.detail || "—"],
          ]),
        ],
      ],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(SpecAccordionBlockView);
  },
});
