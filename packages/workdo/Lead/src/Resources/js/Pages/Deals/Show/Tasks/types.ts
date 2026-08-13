import { ModalState } from '@/types/common';

export interface DealTask {
    id: number;
    deal_id: number;
    name: string;
    date: string;
    time: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'On Going' | 'Complete';
    created_at: string;
}

export interface DealTaskFormData {
    deal_id: number;
    name: string;
    date: string;
    time: string;
    priority: string;
    status: string;
}

export interface EditDealTaskFormData {
    name: string;
    date: string;
    time: string;
    priority: string;
    status: string;
}

export interface CreateTaskProps {
    dealId: number;
    onSuccess: () => void;
}

export interface EditTaskProps {
    task: DealTask;
    onSuccess: () => void;
}

export type TaskModalState = ModalState<DealTask>;
