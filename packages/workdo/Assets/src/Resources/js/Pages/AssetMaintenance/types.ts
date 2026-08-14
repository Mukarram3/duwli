import { PaginatedData, ModalState, AuthContext, CreateProps, EditProps } from '@/types/common';

export interface AssetMaintenance {
    id: number;
    asset_id: number;
    maintenance_type: 'preventive' | 'corrective' | 'emergency';
    title: string;
    description: string | null;
    scheduled_date: string;
    completed_date: string | null;
    cost: number | null;
    technician_name: string | null;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    notes: string | null;
    next_maintenance_date: string | null;
    asset?: {
        id: number;
        name: string;
    };
    created_at: string;
}

export interface AssetMaintenanceFormData {
    asset_id: number | null;
    maintenance_type: string;
    title: string;
    description: string;
    scheduled_date: string;
    completed_date: string;
    cost: string;
    technician_name: string;
    status: string;
    priority: string;
    notes: string;
    next_maintenance_date: string;
}

export interface CreateAssetMaintenanceProps extends CreateProps {
}

export interface EditAssetMaintenanceProps extends EditProps<AssetMaintenance> {
    maintenance: AssetMaintenance;
}

export type PaginatedAssetMaintenance = PaginatedData<AssetMaintenance>;
export type AssetMaintenanceModalState = ModalState<AssetMaintenance>;

export interface AssetMaintenanceIndexProps {
    maintenances: PaginatedAssetMaintenance;
    assets: Array<{ id: number; name: string }>;
    auth: AuthContext;
    [key: string]: unknown;
}
