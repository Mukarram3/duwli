import { PaginatedData, ModalState, AuthContext } from '@/types/common';

export interface Category {
    id: number;
    name: string;
}

export interface Asset {
    id: number;
    name: string;
    purchase_date: string;
    supported_date?: string;
    serial_code: string;
    quantity: number;
    unit_price: number;
    purchase_cost: number;
    warranty_period?: string;
    location?: string;
    location_id?: number;
    description?: string;
    image?: string;
    category_id?: number;
    category?: Category;
    assetLocation?: {
        id: number;
        name: string;
        code: string;
    };
    created_at: string;
}

export interface CreateAssetFormData {
    name: string;
    purchase_date: string;
    supported_date: string;
    serial_code: string;
    quantity: string;
    unit_price: string;
    purchase_cost: string;
    warranty_period: string;
    location: string;
    location_id: string;
    description: string;
    image: string;
    category_id: string;
}

export interface EditAssetFormData {
    name: string;
    purchase_date: string;
    supported_date: string;
    serial_code: string;
    quantity: string;
    unit_price: string;
    purchase_cost: string;
    warranty_period: string;
    location: string;
    location_id: string;
    description: string;
    image: string;
    category_id: string;
}

export interface AssetFilters {
    name: string;
    serial_code: string;
    location: string;
    category_id: string;
}

export type PaginatedAssets = PaginatedData<Asset>;
export type AssetModalState = ModalState<Asset>;

export interface AssetsIndexProps {
    assets: PaginatedAssets;
    auth: AuthContext;
    categories: any[];
    locations: any[];
    [key: string]: unknown;
}

export interface CreateAssetProps {
    onSuccess: () => void;
}

export interface EditAssetProps {
    asset: Asset;
    onSuccess: () => void;
}

export interface AssetShowProps {
    asset: Asset;
    [key: string]: unknown;
}