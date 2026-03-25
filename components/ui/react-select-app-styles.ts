import type { GroupBase, StylesConfig } from "react-select";

/**
 * Estilo unificado para todos los `react-select` de la aplicación
 * (filtros en tablas admin, formularios, selector de filas por página, etc.).
 * Se tipa con `any` para que sea asignable a cualquier `Select<Option>` sin fricción de genéricos.
 */
export const appSelectStyles: StylesConfig<any, false, GroupBase<any>> = {
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    width: "100%",
    minWidth: 0,
    borderRadius: "0.5rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor:
      state.isFocused || state.menuIsOpen
        ? "hsl(222.2 84% 56.3% / 0.55)"
        : "hsl(214 32% 91% / 0.9)",
    backgroundColor: "hsl(0 0% 100%)",
    boxShadow:
      state.isFocused || state.menuIsOpen
        ? "0 0 0 2px hsl(222.2 84% 56.3% / 0.22)"
        : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "&:hover": {
      borderColor:
        state.isFocused || state.menuIsOpen
          ? "hsl(222.2 84% 56.3% / 0.55)"
          : "hsl(214 32% 91% / 0.9)",
    },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  singleValue: (base) => ({
    ...base,
    color: "hsl(222.2 84% 4.9%)",
    fontSize: "0.875rem",
  }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  placeholder: (base) => ({
    ...base,
    color: "hsl(215.4 16.3% 46.9% / 0.75)",
    fontSize: "0.875rem",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "hsl(215.4 16.3% 46.9%)",
    padding: "0 8px",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "hsl(0 0% 100%)",
    border: "1px solid hsl(214 32% 91% / 0.9)",
    borderRadius: "0.5rem",
    zIndex: 50,
    overflow: "hidden",
  }),
  menuList: (base) => ({
    ...base,
    padding: "2px",
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
      ? "hsl(222.2 47.4% 11.2%)"
      : state.isFocused
        ? "hsl(214 32% 91% / 0.95)"
        : "transparent",
    backgroundColor: state.isSelected
      ? "hsl(222.2 47.4% 11.2%)"
      : state.isFocused
        ? "hsl(210 40% 96.1%)"
        : "hsl(0 0% 100%)",
    color: state.isSelected ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
    cursor: "pointer",
  }),
};
