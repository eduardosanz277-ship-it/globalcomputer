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
    <div className="grid max-sm:pt-2.5 max-sm:pb-0 max-sm:first:pt-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-2 sm:py-0">
      <input
        value={row.name}
        disabled={disabled}
        onChange={(e) => onChange({ ...row, name: e.target.value })}
        placeholder="Nombre"
        aria-label="Nombre de la especificación"
        className={cn(
          "h-8 w-full rounded-md border border-border/40 bg-background/80 px-2.5 text-sm outline-none transition",
          "placeholder:text-muted-foreground/70",
          "focus:border-primary/60 focus:ring-0 focus-visible:ring-0",
          disabled && "opacity-60",
        )}
      />
      <input
        value={row.detail}
        disabled={disabled}
        onChange={(e) => onChange({ ...row, detail: e.target.value })}
        placeholder="Valor"
        aria-label="Detalle"
        className={cn(
          "h-8 w-full rounded-md border border-border/40 bg-background/80 px-2.5 text-sm outline-none transition",
          "placeholder:text-muted-foreground/70",
          "focus:border-primary/60 focus:ring-0 focus-visible:ring-0",
          disabled && "opacity-60",
        )}
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onRemove}
        disabled={disabled || removeDisabled}
        aria-label="Quitar fila"
        className="inline-flex h-8 w-8 max-sm:-mt-1 max-sm:justify-self-end shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted/80 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      </button>
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

  const editable = editor.isEditable;

  return (
    <NodeViewWrapper
      className="my-3 outline-none"
      contentEditable={false}
      data-drag-handle={false}
    >
      <div className="overflow-hidden rounded-lg border border-border/45 bg-muted/15">
        <div className="flex items-center gap-2 px-3 py-2">
          <input
            value={attrs.groupTitle}
            disabled={!editable}
            onChange={(e) => patchAttrs({ groupTitle: e.target.value })}
            className={cn(
              "min-w-0 flex-1 border-0 bg-transparent py-0.5 text-sm font-medium outline-none",
              "placeholder:text-muted-foreground/60",
              "focus:ring-0 focus-visible:ring-0",
              !editable && "opacity-60",
            )}
            placeholder="Título del grupo"
            aria-label="Título de la agrupación"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => patchAttrs({ open: !attrs.open })}
            disabled={!editable}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted/70 hover:text-foreground disabled:opacity-40"
            aria-label={attrs.open ? "Contraer bloque" : "Expandir bloque"}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition duration-200",
                attrs.open && "rotate-180",
              )}
            />
          </button>
        </div>

        <div
          className={cn(
            "grid border-t border-border/35 transition-[grid-template-rows] duration-200 ease-out",
            attrs.open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-2 px-3 pb-3 pt-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={addRow}
                  disabled={!editable}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted/60 hover:text-foreground disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" aria-hidden />
                  Agregar
                </button>
              </div>
              <div className="flex flex-col max-sm:divide-y max-sm:divide-border/40 sm:gap-2">
                {rows.map((row, index) => (
                  <SpecRow
                    key={index}
                    row={row}
                    onChange={(next) => setRow(index, next)}
                    onRemove={() => removeRow(index)}
                    disabled={!editable}
                    removeDisabled={rows.length === 1}
                  />
                ))}
              </div>
            </div>
          </div>
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
