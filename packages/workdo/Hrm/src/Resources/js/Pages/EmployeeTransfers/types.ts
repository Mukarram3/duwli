import { PaginatedData, ModalState, AuthContext } from '@/types/common';

export interface User {
    id: number;
    name: string;
    avatar: string | null;
    email: string;
}

export interface Branch {
    id: number;
    branch_name?: string;
    name?: string;
}

export interface Department {
    id: number;
    department_name?: string;
    name?: string;
}

export interface Designation {
    id: number;
    designation_name?: string;
    name?: string;
}

export interface EmployeeTransfer {
    id: number;
    transfer_date?: string;
    effective_date: string;
    reason?: string;
    status: string;
    document?: string;
    employee_id?: number;
    employee?: User;
    from_branch_id?: number;
    from_branch?: Branch;
    from_department_id?: number;
    from_department?: Department;
    from_designation_id?: number;
    from_designation?: Designation;
    to_branch_id?: number;
    to_branch?: Branch;
    to_department_id?: number;
    to_department?: Department;
    to_designation_id?: number;
    to_designation?: Designation;
    approved_by?: User;
    created_at: string;
}

export interface CreateEmployeeTransferFormData {
    transfer_date?: string;
    effective_date: string;
    reason: string;
    document: string;
    employee_id: string;
    to_branch_id: string;
    to_department_id: string;
    to_designation_id: string;
}

export interface EditEmployeeTransferFormData {
    effective_date: string;
    reason: string;
    document: string;
    employee_id: string;
    to_branch_id: string;
    to_department_id: string;
    to_designation_id: string;
}

export interface EmployeeTransferFilters {
    search: string;
    employee_id: string;
    status: string;
}

export interface EmployeeTransferStats {
    total: number;
    pending: number;
    approved: number;
    in_progress: number;
    rejected: number;
    cancelled: number;
}

export type PaginatedEmployeeTransfers = PaginatedData<EmployeeTransfer>;
export type EmployeeTransferModalState = ModalState<EmployeeTransfer>;

export interface EmployeeTransfersIndexProps {
    employeetransfers: PaginatedEmployeeTransfers;
    stats?: EmployeeTransferStats;
    auth: AuthContext;
    employees: any[];
    branches: any[];
    departments: any[];
    designations: any[];
    [key: string]: unknown;
}

export interface CreateEmployeeTransferProps {
    onSuccess: () => void;
}

export interface EditEmployeeTransferProps {
    employeetransfer: EmployeeTransfer;
    onSuccess: () => void;
}

export interface EmployeeTransferShowProps {
    employeetransfer: EmployeeTransfer;
    [key: string]: unknown;
}