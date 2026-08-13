export interface DealUser {
    id: number;
    user_id: number;
    deal_id: number;
    user: {
        id: number;
        name: string;
        avatar?: string;
    };
}

export interface CreateUserProps {
    dealId: number;
    onSuccess: () => void;
    availableUsers: { value: string; label: string }[];
}
