import { PaginatedData, ModalState, AuthContext, CreateProps, EditProps } from '@/types/common';

export interface AssetDepreciation {
    id: number;
    asset_id: number;
    depreciation_method: 'straight_line' | 'declining_balance' | 'sum_of_years';
    useful_life_years: number;
    salvage_value: number;
    annual_depreciation: number;
    accumulated_depreciation: number;
    book_value: number;
    depreciation_start_date: string;
    last_calculated_date: string | null;
    is_fully_depreciated: boolean;
    notes: string | null;
    asset?: {
        id: number;
        name: string;
        purchase_cost: number;
    };
    created_at: string;
}

export interface AssetDepreciationFormData {
    asset_id: number | null;
    depreciation_method: string;
    useful_life_years: string;
    salvage_value: string;
    depreciation_start_date: string;
    notes: string;
}

export interface CreateAssetDepreciationProps extends CreateProps {
}

export interface EditAssetDepreciationProps extends EditProps<AssetDepreciation> {
    depreciation: AssetDepreciation;
}

export type PaginatedAssetDepreciation = PaginatedData<AssetDepreciation>;
export type AssetDepreciationModalState = ModalState<AssetDepreciation>;

export interface AssetDepreciationIndexProps {
    depreciations: PaginatedAssetDepreciation;
    assets: Array<{ id: number; name: string; purchase_cost: number }>;
    auth: AuthContext;
    [key: string]: unknown;
}
