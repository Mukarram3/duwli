import { PaginatedData, ModalState, AuthContext } from '@/types/common';

export interface User {
    id: number;
    name: string;
    avatar: string | null;
    email: string;
}

export interface WarningType {
    id: number;
    warning_type_name: string;
    name?: string;
}

export interface Warning {
    id: number;
    subject: string;
    severity: string;
    warning_date: string;
    description?: string;
    document?: string;
    employee_id?: number;
    employee?: User;
    warning_by?: number | User;
    warningBy?: User;
    warning_type_id?: number;
    warning_type?: WarningType;
    warningType?: WarningType;
    status: string;
    employee_response?: string;
    created_at: string;
}

export interface WarningStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

export interface CreateWarningFormData {
    subject: string;
    severity: string;
    warning_date: string;
    description: string;
    document: string;
    employee_id: string;
    warning_by: string;
    warning_type_id: string;
}

export interface EditWarningFormData {
    subject: string;
    severity: string;
    warning_date: string;
    description: string;
    document: string;
    employee_id: string;
    warning_by: string;
    warning_type_id: string;
}

export interface WarningFilters {
    subject: string;
    employee_id: string;
    status?: string;
}

export type PaginatedWarnings = PaginatedData<Warning>;
export type WarningModalState = ModalState<Warning>;

export interface WarningsIndexProps {
    warnings: PaginatedWarnings;
    auth: AuthContext;
    users: any[];
    warningtypes: any[];
    stats?: WarningStats;
    [key: string]: unknown;
}

export interface CreateWarningProps {
    onSuccess: () => void;
}

export interface EditWarningProps {
    warning: Warning;
    onSuccess: () => void;
}

export interface WarningShowProps {
    warning: Warning;
    [key: string]: unknown;
}