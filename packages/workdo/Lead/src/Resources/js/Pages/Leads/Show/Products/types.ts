export interface CreateProductProps {
    leadId: number;
    onSuccess: () => void;
    availableProducts: { value: string; label: string }[];
}
