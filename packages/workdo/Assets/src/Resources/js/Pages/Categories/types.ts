import { PaginatedData, ModalState, AuthContext, CreateProps, EditProps } from '@/types/common';

export interface Category {
    id: number;
    name: string;
    created_at: string;
}

export interface CategoryFormData {
    name: string;
}

export interface CreateCategoryProps extends CreateProps {
}

export interface EditCategoryProps extends EditProps<Category> {
}

export type PaginatedCategories = PaginatedData<Category>;
export type CategoryModalState = ModalState<Category>;

export interface CategoriesIndexProps {
    categories: PaginatedCategories;
    auth: AuthContext;
    [key: string]: unknown;
}