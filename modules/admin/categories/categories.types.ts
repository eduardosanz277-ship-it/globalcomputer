/** Categoría para desplegables (solo activas / no eliminadas). */
export type AdminCategory = {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  isAccessoryType: boolean;
};

/** Fila en la tabla de administración de categorías. */
export type CategoryAdmin = {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  active: boolean;
  isAccessoryType: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryAdminInsert = {
  name: string;
  nameEn: string;
  slug: string;
  active: boolean;
  isAccessoryType: boolean;
};

export type CategoryAdminUpdate = CategoryAdminInsert;

export type AdminSubcategory = {
  id: string;
  name: string;
  nameEn: string | null;
  categoryId: string;
  slug: string;
};
