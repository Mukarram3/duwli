export interface LeadUser {
    id: number;
    user_id: number;
    lead_id: number;
    user: {
        id: number;
        name: string;
        avatar?: string;
    };
}

export interface CreateUserProps {
    leadId: number;
    onSuccess: () => void;
    availableUsers: { value: string; label: string }[];
}
