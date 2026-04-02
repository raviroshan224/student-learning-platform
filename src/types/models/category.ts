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
