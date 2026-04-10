/** Subcategoría para administración (tabla `subcategories`). */
export type SubcategoryAdmin = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SubcategoryAdminInsert = {
  categoryId: string;
  name: string;
  active: boolean;
};

export type SubcategoryAdminUpdate = SubcategoryAdminInsert;
