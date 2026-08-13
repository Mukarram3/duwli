import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced';
import { CreateUserProps } from './types';

export default function Create({ dealId, onSuccess, availableUsers }: CreateUserProps) {
    const { t } = useTranslation();
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = () => {
        if (selectedUsers.length === 0) return;
        setLoading(true);
        router.post(route('lead.deals.assign-users', dealId), {
            user_ids: selectedUsers.map(id => parseInt(id)),
        }, {
            onSuccess: () => {
                setSelectedUsers([]);
                onSuccess();
            },
            onFinish: () => setLoading(false),
        });
    };

    return (
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>{t('Add Users')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <div>
                    <Label>{t('Select Users')}</Label>
                    <MultiSelectEnhanced
                        options={availableUsers}
                        value={selectedUsers}
                        onValueChange={setSelectedUsers}
                        placeholder={t('Select users')}
                        searchable={true}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onSuccess}>{t('Cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={selectedUsers.length === 0 || loading}>
                        {loading ? t('Saving...') : t('Save')}
                    </Button>
                </div>
            </div>
        </DialogContent>
    );
}
