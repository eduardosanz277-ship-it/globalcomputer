/** Subcategoría para administración (tabla `subcategories`). */
export type SubcategoryAdmin = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  nameEn: string | null;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SubcategoryAdminInsert = {
  categoryId: string;
  name: string;
  nameEn: string;
  slug: string;
  active: boolean;
};

export type SubcategoryAdminUpdate = SubcategoryAdminInsert;
