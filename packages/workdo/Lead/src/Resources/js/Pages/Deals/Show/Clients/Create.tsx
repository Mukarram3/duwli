import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced';
import { CreateClientProps } from './types';

export default function Create({ dealId, onSuccess, availableClients }: CreateClientProps) {
    const { t } = useTranslation();
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = () => {
        if (selectedClients.length === 0) return;
        setLoading(true);
        router.post(route('lead.deals.assign-clients', dealId), {
            client_ids: selectedClients.map(id => parseInt(id)),
        }, {
            onSuccess: () => {
                setSelectedClients([]);
                onSuccess();
            },
            onFinish: () => setLoading(false),
        });
    };

    return (
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>{t('Add Clients')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <div>
                    <Label>{t('Select Clients')}</Label>
                    <MultiSelectEnhanced
                        options={availableClients}
                        value={selectedClients}
                        onValueChange={setSelectedClients}
                        placeholder={t('Select clients')}
                        searchable={true}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onSuccess}>{t('Cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={selectedClients.length === 0 || loading}>
                        {loading ? t('Saving...') : t('Save')}
                    </Button>
                </div>
            </div>
        </DialogContent>
    );
}
