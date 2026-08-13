export interface LeadCall {
    id: number;
    lead_id: number;
    subject: string;
    call_type: 'Inbound' | 'Outbound';
    duration: string;
    user_id: number;
    description: string;
    call_result: string;
}

export interface CallFormData {
    subject: string;
    call_type: string;
    duration: string;
    assignee: string;
    description: string;
    call_result: string;
}

export interface CreateCallProps {
    leadId: number;
    userLeads: any[];
    onSuccess: () => void;
}

export interface EditCallProps {
    call: LeadCall;
    userLeads: any[];
    onSuccess: () => void;
}
