/** Categoría para desplegables (solo activas / no eliminadas). */
export type AdminCategory = {
  id: string;
  name: string;
  nameEn: string | null;
};

/** Fila en la tabla de administración de categorías. */
export type CategoryAdmin = {
  id: string;
  name: string;
  nameEn: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryAdminInsert = {
  name: string;
  nameEn: string;
  active: boolean;
};

export type CategoryAdminUpdate = CategoryAdminInsert;

export type AdminSubcategory = {
  id: string;
  name: string;
  categoryId: string;
};
