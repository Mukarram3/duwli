import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced';
import { CreateSourceProps } from './types';

export default function Create({ leadId, onSuccess, availableSources }: CreateSourceProps) {
    const { t } = useTranslation();
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = () => {
        if (selectedSources.length === 0) return;
        setLoading(true);
        router.post(route('lead.leads.assign-sources', leadId), {
            source_ids: selectedSources.map(id => parseInt(id)),
        }, {
            onSuccess: () => {
                setSelectedSources([]);
                onSuccess();
            },
            onFinish: () => setLoading(false),
        });
    };

    return (
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>{t('Add Sources')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <div>
                    <Label>{t('Select Sources')}</Label>
                    <MultiSelectEnhanced
                        options={availableSources}
                        value={selectedSources}
                        onValueChange={setSelectedSources}
                        placeholder={t('Select sources')}
                        searchable={true}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onSuccess}>{t('Cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={selectedSources.length === 0 || loading}>
                        {loading ? t('Saving...') : t('Save')}
                    </Button>
                </div>
            </div>
        </DialogContent>
    );
}
