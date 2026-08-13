import { ModalState, AuthContext } from '@/types/common';

export interface LeadTask {
    id: number;
    lead_id: number;
    name: string;
    date: string;
    time: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'On Going' | 'Complete';
    created_at: string;
}

export interface LeadTaskFormData {
    lead_id: number;
    name: string;
    date: string;
    time: string;
    priority: string;
    status: string;
}

export interface EditLeadTaskFormData {
    name: string;
    date: string;
    time: string;
    priority: string;
    status: string;
}

export interface CreateTaskProps {
    leadId: number;
    onSuccess: () => void;
}

export interface EditTaskProps {
    task: LeadTask;
    onSuccess: () => void;
}

export type TaskModalState = ModalState<LeadTask>;
