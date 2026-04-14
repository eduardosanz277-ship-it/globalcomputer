"use client";

import { useCallback, useEffect, useRef, type ChangeEvent } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { toast } from "react-toastify";
import { ProductDescriptionToolbar } from "@/components/ProductDescriptionToolbar";
import { ProductDescriptionPreview } from "@/components/ProductDescriptionPreview";
import { uploadProductDescriptionImage } from "@/lib/uploadImage";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";

/** Plantilla lista para fichas tipo cámara / seguridad. */
const BLOQUE_CARACTERISTICAS_HTML = `
<h2>Características principales</h2>
<ul>
<li>Resolución 4MP</li>
<li>Visión nocturna hasta 30m</li>
<li>Detección de movimiento</li>
</ul>
<p></p>
`;

/** Sección con título, texto guía y tabla editable. */
const BLOQUE_ESPECIFICACIONES_COMPLETO_HTML = `
<h2>Especificaciones técnicas</h2>
<p>Ajusta o amplía las filas según el producto.</p>
<table>
<thead>
<tr><th>Campo</th><th>Detalle</th></tr>
</thead>
<tbody>
<tr><td>Resolución</td><td></td></tr>
<tr><td>Lente</td><td></td></tr>
<tr><td>Visión nocturna</td><td></td></tr>
<tr><td>Audio</td><td></td></tr>
<tr><td>Compatibilidad</td><td></td></tr>
</tbody>
</table>
<p></p>
`;

/** Solo la tabla (botón “Tabla espec.”). */
const TABLA_ESPECIFICACIONES_HTML = `
<table>
<thead>
<tr><th>Especificación</th><th>Detalle</th></tr>
</thead>
<tbody>
<tr><td>Resolución</td><td></td></tr>
<tr><td>Lente</td><td></td></tr>
<tr><td>Visión nocturna</td><td></td></tr>
<tr><td>Audio</td><td></td></tr>
<tr><td>Compatibilidad</td><td></td></tr>
</tbody>
</table>
<p></p>
`;

type Props = {
  id?: string;
  label?: string;
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
};

/**
 * Editor Tiptap para `descripcion` en HTML: toolbar, subida de imágenes a
 * Supabase Storage, bloques para catálogo tech y preview en vivo.
 */
export function ProductDescriptionEditor({
  id = "product-description-rich",
  label = "Descripción del producto",
  value,
  onChange,
  disabled,
  error,
  className,
}: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        /** Encabezados H1–H4 (barra y plantillas). */
        heading: { levels: [1, 2, 3, 4] },
        /** Evita duplicar extensiones: ya van `Link` y `Underline` abajo. */
        link: false,
        underline: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Describe el producto: beneficios, uso, compatibilidad…",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
          rel: "noopener noreferrer nofollow",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full rounded-lg",
        },
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: "w-full border-collapse text-sm" },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editable: !disabled,
    editorProps: {
      attributes: {
        class: cn(
          "tiptap-editor-surface font-sans px-3 sm:px-4 text-sm leading-relaxed",
          "focus:outline-none",
        ),
        "aria-label": "Área de edición de descripción",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  /** Sincroniza resets del formulario (p. ej. al abrir otro producto). */
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value ?? "";
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  const openImagePicker = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const onImageFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !editor || disabled) return;

      const result = await uploadProductDescriptionImage(file);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      editor.chain().focus().setImage({ src: result.publicUrl }).run();
      toast.success("Imagen insertada");
    },
    [editor, disabled],
  );

  const insertCharacteristics = useCallback(() => {
    if (!editor || disabled) return;
    editor.chain().focus().insertContent(BLOQUE_CARACTERISTICAS_HTML).run();
  }, [editor, disabled]);

  const insertSpecificationsSection = useCallback(() => {
    if (!editor || disabled) return;
    editor
      .chain()
      .focus()
      .insertContent(BLOQUE_ESPECIFICACIONES_COMPLETO_HTML)
      .run();
  }, [editor, disabled]);

  const insertSpecificationsTable = useCallback(() => {
    if (!editor || disabled) return;
    editor.chain().focus().insertContent(TABLA_ESPECIFICACIONES_HTML).run();
  }, [editor, disabled]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {/* <p className="text-xs text-muted-foreground">
          Texto enriquecido con imágenes alojadas en Storage. Se guarda como
          HTML en la base de datos.
        </p> */}
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onImageFileChange}
      />

      <div
        className={cn(
          "min-w-0 rounded-lg border border-border/80 bg-background/80 shadow-sm",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <ProductDescriptionToolbar
          editor={editor}
          disabled={disabled}
          onPickImage={openImagePicker}
          onInsertCharacteristicsBlock={insertCharacteristics}
          onInsertSpecificationsSection={insertSpecificationsSection}
          onInsertSpecificationsTable={insertSpecificationsTable}
        />
        {/*
          Altura máxima del área de texto: el scroll es interno para que la
          barra de herramientas y el preview sigan visibles al editar textos largos.
          Esquinas inferiores redondeadas y overflow solo aquí (no en el contenedor
          padre) para que los desplegables de la barra no se recorten en móvil.
        */}
        <div
          className="min-h-0 max-h-[min(50vh,22rem)] overflow-y-auto overscroll-y-contain rounded-b-lg border-t border-border/80 bg-white text-foreground dark:bg-muted/10"
          role="region"
          aria-label="Área de edición con desplazamiento"
        >
          <EditorContent editor={editor} id={id} />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <ProductDescriptionPreview html={value} />
    </div>
  );
}
