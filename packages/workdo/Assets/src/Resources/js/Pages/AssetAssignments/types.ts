import { PaginatedData, ModalState, AuthContext } from '@/types/common';

export interface Asset {
    id: number;
    name: string;
    serial_code: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
}

export interface AssetAssignment {
    id: number;
    asset_id: number;
    user_id: number;
    assigned_date: string;
    expected_return_date?: string;
    returned_date?: string;
    status: 'active' | 'returned' | 'overdue';
    condition_on_assignment: 'excellent' | 'good' | 'fair' | 'poor';
    condition_on_return?: 'excellent' | 'good' | 'fair' | 'poor';
    assignment_notes?: string;
    return_notes?: string;
    assigned_by: number;
    returned_by?: number;
    created_at: string;
    asset: Asset;
    user: User;
    assignedBy: User;
    returnedBy?: User;
}

export interface CreateAssetAssignmentFormData {
    asset_id: number | string;
    user_id: number | string;
    assigned_date: string;
    expected_return_date: string;
    condition_on_assignment: 'excellent' | 'good' | 'fair' | 'poor';
    assignment_notes: string;
}

export interface EditAssetAssignmentFormData {
    asset_id: number | string;
    user_id: number | string;
    assigned_date: string;
    expected_return_date: string;
    condition_on_assignment: 'excellent' | 'good' | 'fair' | 'poor';
    assignment_notes: string;
}

export interface ReturnAssetFormData {
    returned_date: string;
    condition_on_return: 'excellent' | 'good' | 'fair' | 'poor';
    return_notes: string;
}

export interface AssetAssignmentFilters {
    asset_name: string;
    user_name: string;
    status: string;
}

export type PaginatedAssetAssignments = PaginatedData<AssetAssignment>;
export type AssetAssignmentModalState = ModalState<AssetAssignment>;

export interface AssetAssignmentsIndexProps {
    assetAssignments: PaginatedAssetAssignments;
    auth: AuthContext;
    [key: string]: unknown;
}

export interface CreateAssetAssignmentProps {
    onSuccess: () => void;
}

export interface EditAssetAssignmentProps {
    assetAssignment: AssetAssignment;
    onSuccess: () => void;
}

export interface ReturnAssetProps {
    assetAssignment: AssetAssignment;
    onSuccess: () => void;
}