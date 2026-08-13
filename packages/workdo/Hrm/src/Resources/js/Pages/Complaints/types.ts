import { PaginatedData, ModalState, AuthContext } from '@/types/common';

export interface User {
    id: number;
    name: string;
    avatar: string | null;
    email: string;
}

export interface ComplaintType {
    id: number;
    complaint_type: string;
}

export interface Complaint {
    id: number;
    employee_id?: number;
    against_employee_id?: number;
    complaint_type_id?: number;
    subject: string;
    description: string;
    complaint_date: string;
    status: string;
    document?: string;
    resolved_by?: number;
    resolution_date?: string;
    creator_id: number;
    created_by: number;
    employee?: User;
    against_employee?: User;
    againstEmployee?: User;
    complaint_type?: ComplaintType;
    complaintType?: ComplaintType;
    resolved_by_user?: User;
    resolvedBy?: User;
    created_at: string;
    updated_at: string;
}

export interface ComplaintStats {
    total: number;
    pending: number;
    in_review: number;
    assigned: number;
    in_progress: number;
    resolved: number;
}

export type PaginatedComplaints = PaginatedData<Complaint>;
export type ComplaintModalState = ModalState<Complaint>;

export interface ComplaintsIndexProps {
    complaints: PaginatedComplaints;
    employees: User[];
    allEmployees: User[];
    complaintTypes: ComplaintType[];
    stats?: ComplaintStats;
    auth: AuthContext;
    [key: string]: unknown;
}

export interface ComplaintFilters {
    subject: string;
    employee_id: string;
    complaint_type_id: string;
    status: string;
}

export interface CreateComplaintProps {
    onSuccess: () => void;
}

export interface EditComplaintProps {
    complaint: Complaint;
    onSuccess: () => void;
}

export interface CreateComplaintFormData {
    employee_id: string;
    against_employee_id: string;
    complaint_type_id: string;
    subject: string;
    description: string;
    complaint_date: string;
    document: string;
}

export interface EditComplaintFormData {
    employee_id: string;
    against_employee_id: string;
    complaint_type_id: string;
    subject: string;
    description: string;
    complaint_date: string;
    document: string;
}

export interface ComplaintStatusProps {
    complaint: Complaint;
    onSuccess: () => void;
}