import type { GroupBase, StylesConfig } from "react-select";

/** Alineado con `tailwind.config` (primary #357fd2, border, foreground, muted). */
const border = "rgba(216, 216, 217, 0.95)";
const primary = "#357fd2";
const primaryRing = "rgba(53, 127, 210, 0.22)";
const primaryBorder = "rgba(53, 127, 210, 0.55)";
const foreground = "#2a2c30";
const mutedFg = "rgba(110, 112, 115, 0.75)";
const mutedBg = "#f0f0f1";

/**
 * Estilo unificado para todos los `react-select` de la aplicación
 * (filtros en tablas admin, formularios, selector de filas por página, etc.).
 * Se tipa con `any` para que sea asignable a cualquier `Select<Option>` sin fricción de genéricos.
 */
export const appSelectStyles: StylesConfig<any, false, GroupBase<any>> = {
  control: (base, state) => ({
    ...base,
    boxSizing: "border-box",
    minHeight: 40,
    height: 40,
    alignItems: "center",
    width: "100%",
    minWidth: 0,
    borderRadius: "0.5rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor:
      state.isFocused || state.menuIsOpen ? primaryBorder : border,
    backgroundColor: "#ffffff",
    boxShadow:
      state.isFocused || state.menuIsOpen
        ? `0 0 0 2px ${primaryRing}`
        : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "&:hover": {
      borderColor:
        state.isFocused || state.menuIsOpen ? primaryBorder : border,
    },
  }),
  valueContainer: (base) => ({
    ...base,
    /** Un poco más de aire a la izquierda evita que el glifo quede rozando el borde redondeado. */
    padding: "2px 10px 2px 12px",
    alignItems: "center",
  }),
  singleValue: (base) => ({
    ...base,
    color: foreground,
    fontSize: "0.875rem",
    lineHeight: 1.25,
  }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  placeholder: (base) => ({
    ...base,
    color: mutedFg,
    fontSize: "0.875rem",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#6e7073",
    padding: "0 8px",
  }),
  menu: (base) => ({
    ...base,
    /** Por defecto react-select usa ~8px (`menuGutter`); lo acercamos al control. */
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: "#ffffff",
    border: `1px solid ${border}`,
    borderRadius: "0.5rem",
    zIndex: 50,
    overflow: "hidden",
  }),
  menuList: (base) => ({
    ...base,
    padding: "1px 2px",
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    padding: "6px 10px",
    borderRadius: "0.375rem",
    marginBottom: "1px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: state.isSelected
      ? primary
      : state.isFocused
        ? border
        : "transparent",
    backgroundColor: state.isSelected
      ? primary
      : state.isFocused
        ? mutedBg
        : "#ffffff",
    color: state.isSelected ? "#ffffff" : foreground,
    cursor: "pointer",
  }),
};

/**
 * Altura del control alineada con `Button` por defecto (`h-9`, 36px):
 * buscador, filtros y acciones en barras de herramientas de tablas.
 */
export const appToolbarSelectStyles: StylesConfig<
  any,
  false,
  GroupBase<any>
> = {
  ...appSelectStyles,
  control: (base, state) => ({
    ...(typeof appSelectStyles.control === "function"
      ? appSelectStyles.control(base, state)
      : base),
    minHeight: 36,
    height: 36,
    alignItems: "center",
  }),
  valueContainer: (base, props) => ({
    ...(typeof appSelectStyles.valueContainer === "function"
      ? appSelectStyles.valueContainer(base, props)
      : base),
    alignItems: "center",
  }),
  dropdownIndicator: (base, props) => ({
    ...(typeof appSelectStyles.dropdownIndicator === "function"
      ? appSelectStyles.dropdownIndicator(base, props)
      : base),
    alignSelf: "stretch",
    display: "flex",
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 0,
  }),
};
