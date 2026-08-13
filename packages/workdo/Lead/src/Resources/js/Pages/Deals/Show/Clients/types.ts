export interface DealClient {
    id: number;
    deal_id: number;
    client_id: number;
    client: {
        id: number;
        name: string;
        avatar?: string;
    };
}

export interface CreateClientProps {
    dealId: number;
    onSuccess: () => void;
    availableClients: { value: string; label: string }[];
}
