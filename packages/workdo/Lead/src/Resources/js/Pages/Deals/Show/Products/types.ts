export interface CreateProductProps {
    dealId: number;
    onSuccess: () => void;
    availableProducts: { value: string; label: string }[];
}
