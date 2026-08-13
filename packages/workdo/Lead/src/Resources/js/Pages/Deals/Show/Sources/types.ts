export interface CreateSourceProps {
    dealId: number;
    onSuccess: () => void;
    availableSources: { value: string; label: string }[];
}
