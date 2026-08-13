import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced';
import { CreateProductProps } from './types';

export default function Create({ dealId, onSuccess, availableProducts }: CreateProductProps) {
    const { t } = useTranslation();
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = () => {
        if (selectedProducts.length === 0) return;
        setLoading(true);
        router.post(route('lead.deals.assign-products', dealId), {
            product_ids: selectedProducts.map(id => parseInt(id)),
        }, {
            onSuccess: () => {
                setSelectedProducts([]);
                onSuccess();
            },
            onFinish: () => setLoading(false),
        });
    };

    return (
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>{t('Add Products')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <div>
                    <Label>{t('Select Products')}</Label>
                    <MultiSelectEnhanced
                        options={availableProducts}
                        value={selectedProducts}
                        onValueChange={setSelectedProducts}
                        placeholder={t('Select products')}
                        searchable={true}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onSuccess}>{t('Cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={selectedProducts.length === 0 || loading}>
                        {loading ? t('Saving...') : t('Save')}
                    </Button>
                </div>
            </div>
        </DialogContent>
    );
}
