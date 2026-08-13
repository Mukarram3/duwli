export interface CreateSourceProps {
    leadId: number;
    onSuccess: () => void;
    availableSources: { value: string; label: string }[];
}
