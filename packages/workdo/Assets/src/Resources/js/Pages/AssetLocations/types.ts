import { PaginatedData, ModalState, AuthContext, CreateProps, EditProps } from '@/types/common';

export interface AssetLocation {
    id: number;
    name: string;
    code: string;
    type: 'building' | 'floor' | 'room' | 'warehouse' | 'site';
    parent_id: number | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    contact_person: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
}

export interface AssetLocationFormData {
    name: string;
    code: string;
    type: string;
    parent_id: number | null;
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    contact_person: string;
    contact_phone: string;
    contact_email: string;
    description: string;
    is_active: boolean;
}

export interface CreateAssetLocationProps extends CreateProps {
}

export interface EditAssetLocationProps extends EditProps<AssetLocation> {
}

export type PaginatedAssetLocations = PaginatedData<AssetLocation>;
export type AssetLocationModalState = ModalState<AssetLocation>;

export interface AssetLocationsIndexProps {
    assetLocations: PaginatedAssetLocations;
    auth: AuthContext;
    [key: string]: unknown;
}
