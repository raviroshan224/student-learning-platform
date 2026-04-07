export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  children?: Category[];
  courseCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  parentId?: string;
}

export interface CategoryModel {
  id: string;
  name: string;
  parentId?: string | null;
  children?: CategoryModel[];
  imageUrl?: string;
  courseCount?: number;
}
export interface FavoriteCategory {
  id: string;
  categoryName: string;
  categoryImageUrl: string;
}

export interface PreferredCategory {
  id: string;
  name?: string; // mapping from categoryName
  slug?: string;
  parentId?: string | null;
}

export interface CategoryHierarchyItem {
  parentCategory: {
    id: string;
    categoryName: string;
    categoryImageUrl: string;
    isActive: boolean;
  };
  childCategories: Array<{
    id: string;
    categoryName: string;
    categoryImageUrl: string;
    isActive: boolean;
  }>;
}

export type PreferredCategoryList = PreferredCategory[];
